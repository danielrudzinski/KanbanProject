output "container_app_diagnostic_setting_id" {
  description = "ID of the diagnostic setting on the Container App."
  value       = azurerm_monitor_diagnostic_setting.container_app.id
}

output "container_app_env_diagnostic_setting_id" {
  description = "ID of the diagnostic setting on the Container Apps Environment."
  value       = azurerm_monitor_diagnostic_setting.container_app_env.id
}
