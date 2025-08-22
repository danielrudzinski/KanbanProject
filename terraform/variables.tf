variable "resource_group_name" {
  type        = string
  description = "The name of the resource group."
}

variable "location" {
  type        = string
  description = "The Azure region where resources will be deployed."
}

variable "env" {
  type        = string
  description = "The environment name (e.g., dev, prod)."
}

variable "github_repository_owner" {
  type        = string
  description = "The owner of the GitHub repository."
}

// GHCR auth not required for public images

variable "key_vault_allowed_ips" {
  description = "Optional list of IPv4 addresses allowed to access Key Vault (dev convenience)."
  type        = list(string)
  default     = []
}

variable "key_vault_allow_azure_services_bypass" {
  description = "Allow trusted Azure services to bypass Key Vault firewall."
  type        = bool
  default     = true
}

variable "key_vault_network_default_action" {
  description = "Key Vault network ACL default action: Allow or Deny. For dev you may set Allow."
  type        = string
  default     = "Deny"
}

variable "jwt_secret_key" {
  description = "JWT secret used by the backend."
  type        = string
  sensitive   = true
}

variable "spring_mail_username" {
  description = "SMTP username for Spring Mail."
  type        = string
  sensitive   = true
}

variable "spring_mail_password" {
  description = "SMTP password for Spring Mail."
  type        = string
  sensitive   = true
}
