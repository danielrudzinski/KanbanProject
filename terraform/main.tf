resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_log_analytics_workspace" "main" {
  name                = "law-kanban-${var.env}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

data "http" "myip" {
  url = "https://api.ipify.org"
}

locals {
  caller_ip = try(trim(data.http.myip.response_body), null)
}

module "vnet" {
  source                     = "./modules/vnet"
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  env                        = var.env
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
}

module "key_vault" {
  source                      = "./modules/key_vault"
  resource_group_name         = azurerm_resource_group.main.name
  location                    = azurerm_resource_group.main.location
  env                         = var.env
  subnet_id                   = module.vnet.backend_subnet_id
  vnet_id                     = module.vnet.id
  ip_rules                    = length(var.key_vault_allowed_ips) > 0 ? var.key_vault_allowed_ips : (local.caller_ip != null ? [local.caller_ip] : [])
  allow_azure_services_bypass = var.key_vault_allow_azure_services_bypass
  network_default_action      = var.key_vault_network_default_action
}

module "postgres" {
  source              = "./modules/postgres"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  env                 = var.env
  vnet_id             = module.vnet.id
  subnet_id           = module.vnet.db_subnet_id
  key_vault_id        = module.key_vault.id
}

module "container_app" {
  source                  = "./modules/container_app"
  resource_group_name     = azurerm_resource_group.main.name
  location                = azurerm_resource_group.main.location
  env                     = var.env
  container_app_env_id    = module.vnet.container_app_env_id
  app_image_tag           = var.app_image_tag
  postgres_server_name    = module.postgres.postgres_server_name
  postgres_db_name        = module.postgres.postgres_db_name
  key_vault_uri           = module.key_vault.uri
  key_vault_id            = module.key_vault.id
  github_repository_owner = var.github_repository_owner
  jwt_secret_key          = var.jwt_secret_key
  spring_mail_username    = var.spring_mail_username
  spring_mail_password    = var.spring_mail_password
  captcha_enabled         = var.captcha_enabled
  captcha_secret          = var.captcha_secret
  vite_recaptcha_site_key = var.vite_recaptcha_site_key

  depends_on = [module.key_vault, module.postgres]
}

resource "azurerm_monitor_action_group" "main" {
  count               = var.alert_email != "" ? 1 : 0
  name                = "ag-kanban-${var.env}"
  resource_group_name = azurerm_resource_group.main.name
  short_name          = "kanban${var.env}"

  email_receiver {
    name          = "primary"
    email_address = var.alert_email
  }
}

resource "azurerm_monitor_metric_alert" "container_app_high_cpu" {
  count               = var.alert_email != "" ? 1 : 0
  name                = "kanban-${var.env}-high-cpu"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [module.container_app.container_app_id]
  description         = "Average CPU usage is close to the configured limit."
  severity            = 2
  enabled             = true

  frequency   = "PT1M"
  window_size = "PT5M"

  criteria {
    metric_namespace = "Microsoft.App/containerApps"
    metric_name      = "UsageNanoCores"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 200000000
  }

  action {
    action_group_id = azurerm_monitor_action_group.main[0].id
  }
}

resource "azurerm_monitor_metric_alert" "container_app_high_memory" {
  count               = var.alert_email != "" ? 1 : 0
  name                = "kanban-${var.env}-high-memory"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [module.container_app.container_app_id]
  description         = "Average memory working set is close to the configured limit."
  severity            = 2
  enabled             = true

  frequency   = "PT1M"
  window_size = "PT5M"

  criteria {
    metric_namespace = "Microsoft.App/containerApps"
    metric_name      = "WorkingSetBytes"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 450000000
  }

  action {
    action_group_id = azurerm_monitor_action_group.main[0].id
  }
}
