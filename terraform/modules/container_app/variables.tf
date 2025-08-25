variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "env" {
  type = string
}

variable "container_app_env_id" {
  type = string
}

variable "postgres_server_name" {
  type = string
}

variable "postgres_db_name" {
  type = string
}

variable "key_vault_uri" {
  type = string
}

variable "key_vault_id" {
  type = string
}

variable "github_repository_owner" {
  type = string
}

variable "jwt_secret_key" {
  type      = string
  sensitive = true
}

variable "spring_mail_username" {
  type      = string
  sensitive = true
}

variable "spring_mail_password" {
  type      = string
  sensitive = true
}

variable "captcha_enabled" {
  type = bool
}

variable "captcha_secret" {
  type      = string
  sensitive = true
}

variable "vite_recaptcha_site_key" {
  type = string
}