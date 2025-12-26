output "container_app_url" {
  description = "The URL of the container app."
  value       = module.container_app.container_app_url
}

output "log_analytics_workspace_id" {
  description = "Log Analytics Workspace ID used by the Container Apps environment."
  value       = azurerm_log_analytics_workspace.main.id
}

output "log_analytics_workspace_name" {
  description = "Log Analytics Workspace name used by the Container Apps environment."
  value       = azurerm_log_analytics_workspace.main.name
}
