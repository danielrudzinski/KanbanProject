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
variable "vnet_id" {
  description = "The ID of the virtual network for private DNS zone linking."
  type        = string
}

variable "ip_rules" {
  description = "Optional list of public IPv4 addresses allowed to access the Key Vault (for dev)."
  type        = list(string)
  default     = []
}

variable "allow_azure_services_bypass" {
  description = "Whether to allow trusted Azure services to bypass the firewall."
  type        = bool
  default     = true
}

variable "network_default_action" {
  description = "Key Vault network ACL default action: Allow or Deny."
  type        = string
  default     = "Deny"
  validation {
    condition     = contains(["Allow", "Deny"], var.network_default_action)
    error_message = "network_default_action must be either 'Allow' or 'Deny'."
  }
}

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  name                        = "kv-${var.env}-kanban"
  location                    = var.location
  resource_group_name         = var.resource_group_name
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  sku_name                    = "standard"
  enabled_for_deployment      = true
  enabled_for_disk_encryption = true
  enabled_for_template_deployment = true

  network_acls {
  default_action             = var.network_default_action
  bypass                     = var.allow_azure_services_bypass ? "AzureServices" : "None"
  virtual_network_subnet_ids = [var.subnet_id]
  ip_rules                   = var.ip_rules
  }

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    key_permissions = [
      "Get",
    ]

    secret_permissions = [
      "Get", "List", "Set", "Delete", "Purge", "Recover"
    ]

    storage_permissions = [
      "Get",
    ]
  }
}

resource "azurerm_private_dns_zone" "kv" {
  name                = "privatelink.vaultcore.azure.net"
  resource_group_name = var.resource_group_name
}

resource "azurerm_private_dns_zone_virtual_network_link" "kv" {
  name                  = "${var.env}-kv-vnet-link"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.kv.name
  virtual_network_id    = var.vnet_id
}

resource "azurerm_private_endpoint" "kv" {
  name                = "pe-kv-${var.env}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "psc-kv-${var.env}"
    private_connection_resource_id = azurerm_key_vault.main.id
    is_manual_connection           = false
    subresource_names              = ["vault"]
  }

  private_dns_zone_group {
    name                 = "kv-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.kv.id]
  }
}

output "id" {
  value = azurerm_key_vault.main.id
}

output "uri" {
  value = azurerm_key_vault.main.vault_uri
}
