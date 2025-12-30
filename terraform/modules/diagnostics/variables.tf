variable "env" {
  type        = string
  description = "Environment name used for naming."
}

variable "log_analytics_workspace_id" {
  type        = string
  description = "Log Analytics Workspace resource ID."
}

variable "container_app_id" {
  type        = string
  description = "Resource ID of the Azure Container App."
}

variable "container_app_env_id" {
  type        = string
  description = "Resource ID of the Azure Container Apps Environment."
}

variable "resource_group_name" {
  type        = string
  description = "Resource group name for alert resources."
}

variable "alert_email" {
  type        = string
  description = "Email address for alert notifications. Leave empty to disable alert resources."
}
