data "azurerm_monitor_diagnostic_categories" "container_app" {
  resource_id = var.container_app_id
}

locals {
  container_app_log_categories    = toset(data.azurerm_monitor_diagnostic_categories.container_app.log_category_types)
  container_app_metric_categories = toset(try(data.azurerm_monitor_diagnostic_categories.container_app.metrics, []))
}

resource "azurerm_monitor_diagnostic_setting" "container_app" {
  name                       = "diag-kanban-app-${var.env}"
  target_resource_id         = var.container_app_id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  dynamic "enabled_log" {
    for_each = local.container_app_log_categories
    content {
      category = enabled_log.value
    }
  }

  dynamic "enabled_metric" {
    for_each = local.container_app_metric_categories
    content {
      category = enabled_metric.value
    }
  }
}

data "azurerm_monitor_diagnostic_categories" "container_app_env" {
  resource_id = var.container_app_env_id
}

locals {
  container_app_env_log_categories    = toset(data.azurerm_monitor_diagnostic_categories.container_app_env.log_category_types)
  container_app_env_metric_categories = toset(try(data.azurerm_monitor_diagnostic_categories.container_app_env.metrics, []))
}

resource "azurerm_monitor_diagnostic_setting" "container_app_env" {
  name                       = "diag-kanban-cae-${var.env}"
  target_resource_id         = var.container_app_env_id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  dynamic "enabled_log" {
    for_each = local.container_app_env_log_categories
    content {
      category = enabled_log.value
    }
  }

  dynamic "enabled_metric" {
    for_each = local.container_app_env_metric_categories
    content {
      category = enabled_metric.value
    }
  }
}

resource "azurerm_monitor_action_group" "main" {
  count               = var.alert_email != "" ? 1 : 0
  name                = "ag-kanban-${var.env}"
  resource_group_name = var.resource_group_name
  short_name          = "kanban${var.env}"

  email_receiver {
    name          = "primary"
    email_address = var.alert_email
  }
}

resource "azurerm_monitor_metric_alert" "container_app_high_cpu" {
  count               = var.alert_email != "" ? 1 : 0
  name                = "kanban-${var.env}-high-cpu"
  resource_group_name = var.resource_group_name
  scopes              = [var.container_app_id]
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
  resource_group_name = var.resource_group_name
  scopes              = [var.container_app_id]
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
