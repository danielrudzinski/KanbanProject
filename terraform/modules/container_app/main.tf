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

resource "azurerm_container_app" "main" {
  name                         = "kanban-app-${var.env}"
  resource_group_name          = var.resource_group_name
  container_app_environment_id = var.container_app_env_id
  revision_mode                = "Single"
  depends_on = [
    azurerm_key_vault_access_policy.containerapp_identity,
    azurerm_key_vault_secret.jwt_secret,
    azurerm_key_vault_secret.spring_mail_username,
    azurerm_key_vault_secret.spring_mail_password,
  ]

  secret {
    name                 = "postgres-connection-string"
  key_vault_secret_id  = format("%s/secrets/%s", trimsuffix(var.key_vault_uri, "/"), "POSTGRES-CONNECTION-STRING")
    identity             = azurerm_user_assigned_identity.main.id
  }
  secret {
    name                 = "postgres-user"
  key_vault_secret_id  = format("%s/secrets/%s", trimsuffix(var.key_vault_uri, "/"), "POSTGRES-USER")
    identity             = azurerm_user_assigned_identity.main.id
  }
  secret {
    name                 = "postgres-password"
  key_vault_secret_id  = format("%s/secrets/%s", trimsuffix(var.key_vault_uri, "/"), "POSTGRES-PASSWORD")
    identity             = azurerm_user_assigned_identity.main.id
  }
  secret {
    name                 = "jwt-secret-key"
  key_vault_secret_id  = format("%s/secrets/%s", trimsuffix(var.key_vault_uri, "/"), "JWT-SECRET-KEY")
    identity             = azurerm_user_assigned_identity.main.id
  }
  secret {
    name                 = "spring-mail-username"
  key_vault_secret_id  = format("%s/secrets/%s", trimsuffix(var.key_vault_uri, "/"), "SPRING-MAIL-USERNAME")
    identity             = azurerm_user_assigned_identity.main.id
  }
  secret {
    name                 = "spring-mail-password"
  key_vault_secret_id  = format("%s/secrets/%s", trimsuffix(var.key_vault_uri, "/"), "SPRING-MAIL-PASSWORD")
    identity             = azurerm_user_assigned_identity.main.id
  }

  template {
    container {
      name   = "kanban-app"
      image  = "ghcr.io/${var.github_repository_owner}/kanbanproject-app:latest"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name        = "SPRING_DATASOURCE_URL"
        secret_name = "postgres-connection-string"
      }
      env {
        name        = "SPRING_DATASOURCE_USERNAME"
        secret_name = "postgres-user"
      }
      env {
        name        = "SPRING_DATASOURCE_PASSWORD"
        secret_name = "postgres-password"
      }
      env {
        name        = "JWT_SECRET_KEY"
        secret_name = "jwt-secret-key"
      }
      env {
        name        = "SPRING_MAIL_USERNAME"
        secret_name = "spring-mail-username"
      }
      env {
        name        = "SPRING_MAIL_PASSWORD"
        secret_name = "spring-mail-password"
      }
    }

    min_replicas = 1
    max_replicas = 5

    http_scale_rule {
      name               = "http-scale"
      concurrent_requests = "50"
    }

  }


  ingress {
    external_enabled = true
    target_port      = 8080
    transport        = "http"
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.main.id]
  }
}

resource "azurerm_user_assigned_identity" "main" {
  name                = "kanban-app-identity-${var.env}"
  location            = var.location
  resource_group_name = var.resource_group_name
}

data "azurerm_client_config" "current" {}

# Grant the Container App user-assigned identity access to read secrets from Key Vault
resource "azurerm_key_vault_access_policy" "containerapp_identity" {
  key_vault_id = var.key_vault_id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_user_assigned_identity.main.principal_id

  secret_permissions = [
    "Get",
    "List",
  ]
}

resource "azurerm_role_assignment" "key_vault_secrets_user" {
  scope                = var.key_vault_id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.main.principal_id
}

resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "JWT-SECRET-KEY"
  value        = var.jwt_secret_key
  key_vault_id = var.key_vault_id
}

resource "azurerm_key_vault_secret" "spring_mail_username" {
  name         = "SPRING-MAIL-USERNAME"
  value        = var.spring_mail_username
  key_vault_id = var.key_vault_id
}

resource "azurerm_key_vault_secret" "spring_mail_password" {
  name         = "SPRING-MAIL-PASSWORD"
  value        = var.spring_mail_password
  key_vault_id = var.key_vault_id
}


output "container_app_url" {
  value = "https://${azurerm_container_app.main.latest_revision_fqdn}"
}
