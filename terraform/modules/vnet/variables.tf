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

variable "log_analytics_workspace_id" {
  type        = string
  description = "Log Analytics Workspace ID for Container Apps environment diagnostics."
  default     = null
}
