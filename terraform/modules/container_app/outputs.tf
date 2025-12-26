output "container_app_url" {
  value = "https://${azurerm_container_app.main.latest_revision_fqdn}"
}

output "container_app_id" {
  description = "Resource ID of the Azure Container App."
  value       = azurerm_container_app.main.id
}
