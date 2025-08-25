output "backend_subnet_id" {
  value = azurerm_subnet.backend.id
}

output "db_subnet_id" {
  value = azurerm_subnet.db.id
}

output "container_app_env_id" {
  value = azurerm_container_app_environment.main.id
}

output "id" {
  description = "The ID of the virtual network."
  value       = azurerm_virtual_network.main.id
}
