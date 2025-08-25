output "postgres_server_name" {
  value = azurerm_postgresql_flexible_server.main.name
}

output "postgres_db_name" {
  value = azurerm_postgresql_flexible_server_database.main.name
}
