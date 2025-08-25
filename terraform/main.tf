resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
}

resource "random_password" "postgres_admin_password" {
  length  = 16
  special = true
}

data "http" "myip" {
  url = "https://api.ipify.org"
}

locals {
  caller_ip = try(trim(data.http.myip.response_body), null)
}

module "vnet" {
  source              = "./modules/vnet"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  env                 = var.env
}

module "key_vault" {
  source              = "./modules/key_vault"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  env                 = var.env
  subnet_id           = module.vnet.backend_subnet_id
  vnet_id             = module.vnet.id
  ip_rules            = length(var.key_vault_allowed_ips) > 0 ? var.key_vault_allowed_ips : (local.caller_ip != null ? [local.caller_ip] : [])
  allow_azure_services_bypass = var.key_vault_allow_azure_services_bypass
  network_default_action      = var.key_vault_network_default_action
}

module "postgres" {
  source              = "./modules/postgres"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  env                 = var.env
  admin_password      = random_password.postgres_admin_password.result
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

  depends_on              = [module.key_vault, module.postgres]
}
