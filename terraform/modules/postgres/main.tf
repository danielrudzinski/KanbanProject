variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "env" {
  type = string
}

variable "subnet_id" {
  type = string
}

variable "key_vault_id" {
  type = string
}

variable "admin_password" {
  description = "The administrator password for the PostgreSQL server."
  type        = string
  sensitive   = true
}

variable "vnet_id" {
  description = "The ID of the virtual network to link the private DNS zone to."
  type        = string
}

resource "random_password" "password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "random_string" "suffix" {
  length  = 5
  upper   = false
  lower   = true
  numeric = true
  special = false
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "psql-${var.env}-${random_string.suffix.result}"
  resource_group_name    = var.resource_group_name
  location               = var.location
  version                = "13"
  public_network_access_enabled = false
  delegated_subnet_id    = var.subnet_id
  private_dns_zone_id    = azurerm_private_dns_zone.main.id
  administrator_login    = "psqladmin"
  administrator_password = random_password.password.result
  zone                   = "1"
  storage_mb             = 32768
  sku_name               = "B_Standard_B1ms" # Burstable, cheap for dev/test

  maintenance_window {
    day_of_week  = 0
    start_hour   = 1
    start_minute = 0
  }
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = "kanban"
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

resource "azurerm_private_dns_zone" "main" {
  name                = "privatelink.postgres.database.azure.com"
  resource_group_name = var.resource_group_name
}

resource "azurerm_private_dns_zone_virtual_network_link" "main" {
  name                  = "${var.env}-dns-vnet-link"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.main.name
  virtual_network_id    = var.vnet_id
}

resource "azurerm_key_vault_secret" "postgres_user" {
  name         = "POSTGRES-USER"
  value        = azurerm_postgresql_flexible_server.main.administrator_login
  key_vault_id = var.key_vault_id
}

resource "azurerm_key_vault_secret" "postgres_password" {
  name         = "POSTGRES-PASSWORD"
  value        = random_password.password.result
  key_vault_id = var.key_vault_id
}

# Expose a ready-to-use JDBC connection string for Spring
resource "azurerm_key_vault_secret" "postgres_connection_string" {
  name         = "POSTGRES-CONNECTION-STRING"
  value        = format("jdbc:postgresql://%s:5432/%s?sslmode=require", azurerm_postgresql_flexible_server.main.fqdn, azurerm_postgresql_flexible_server_database.main.name)
  key_vault_id = var.key_vault_id
}

output "postgres_server_name" {
  value = azurerm_postgresql_flexible_server.main.name
}

output "postgres_db_name" {
  value = azurerm_postgresql_flexible_server_database.main.name
}
