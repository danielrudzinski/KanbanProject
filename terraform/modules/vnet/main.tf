variable "resource_group_name" {
  type        = string
  description = "The name of the resource group."
}

variable "location" {
  type        = string
  description = "The Azure region."
}

variable "env" {
  type        = string
  description = "The environment name."
}

resource "azurerm_virtual_network" "main" {
  name                = "vnet-${var.env}"
  address_space       = ["10.0.0.0/16"]
  location            = var.location
  resource_group_name = var.resource_group_name
}

resource "azurerm_subnet" "backend" {
  name                 = "snet-backend-${var.env}"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.0.0/23"]
  service_endpoints    = ["Microsoft.KeyVault"]
}

resource "azurerm_subnet" "db" {
  name                 = "snet-db-${var.env}"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.2.0/24"]
  service_endpoints    = ["Microsoft.Storage"]
  delegation {
    name = "fs"
    service_delegation {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}

resource "azurerm_container_app_environment" "main" {
  name                       = "cae-${var.env}"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  infrastructure_subnet_id   = azurerm_subnet.backend.id
}

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