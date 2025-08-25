# Terraform Infrastructure for Kanban Project

This directory contains the Terraform configuration for deploying the Kanban project on Azure.

## Prerequisites

- [Terraform CLI](https://learn.hashicorp.com/tutorials/terraform/install-cli)
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- Logged in to Azure CLI and correct subscription selected
- An Azure Storage Account to store Terraform state

## Setup

1) Azure login and subscription

```powershell
az login
# Optional: select subscription explicitly
az account set --subscription "<subscription-id-or-name>"
```

2) Create storage for Terraform state (once per organization)

```powershell
az group create --name tfstate-rg --location "West Europe"
az storage account create --name tfstatekanban --resource-group tfstate-rg --location "West Europe" --sku Standard_LRS
az storage container create --name tfstate --account-name tfstatekanban
```

3) Provide required secrets/variables

The app stores secrets in Azure Key Vault; values are provided to Terraform via variables:
- `jwt_secret_key`
- `spring_mail_username`
- `spring_mail_password`
 - `captcha_enabled`
 - `captcha_secret`
 - `vite_recaptcha_site_key`

Recommended: copy `dev.local.auto.tfvars.example` to `dev.local.auto.tfvars` and fill in values for local development (auto-loaded and usually gitignored). Alternatively, use the provided `*.tfvars` files and pass with `-var-file`.

## Deployment

1) Initialize Terraform for a target environment by setting a distinct backend key

Use a unique state key per environment instead of Terraform workspaces:

```powershell
# Development
terraform init -reconfigure -backend-config="key=env/dev/terraform.tfstate"

# Production
terraform init -reconfigure -backend-config="key=env/prod/terraform.tfstate"
```

Note: Re-run init with `-reconfigure` and a different `key` when switching environments.

2) Plan and apply

```powershell
# Development
terraform plan  -var-file "dev.tfvars"
terraform apply -var-file "dev.tfvars"

# Production
terraform plan  -var-file "prod.tfvars"
terraform apply -var-file "prod.tfvars"
```

## CI/CD
The existing GitHub Actions workflow in `.github/workflows/kanban-cd.yml` builds and pushes the Docker image to GitHub Container Registry (public). The Container App pulls the public image without authentication. The Container App's managed identity is granted `Key Vault Secrets User` role to read application secrets from Key Vault.
