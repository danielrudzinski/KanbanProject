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

2b) Grant yourself access to the Terraform state container

This project uses the `azurerm` backend with `use_azuread_auth = true`, so you need **Storage Blob data-plane** permissions on the state storage account.

Assign at least `Storage Blob Data Contributor` (recommended) on the storage account scope:

```powershell
$subId = az account show --query id -o tsv
$userObjectId = az ad signed-in-user show --query id -o tsv
$scope = "/subscriptions/$subId/resourceGroups/tfstate-rg/providers/Microsoft.Storage/storageAccounts/tfstatekanban"

az role assignment create --assignee-object-id $userObjectId --assignee-principal-type User --role "Storage Blob Data Contributor" --scope $scope
```

If you get an authorization error creating the role assignment, ask a subscription Owner/User Access Administrator to run it.

3) Provide required secrets/variables

The app stores secrets in Azure Key Vault; values are provided to Terraform via variables:
- `jwt_secret_key`
- `spring_mail_username`
- `spring_mail_password`
 - `captcha_enabled`
 - `captcha_secret`
 - `vite_recaptcha_site_key`

Optional (recommended):
- `app_image_tag` - container image tag deployed to Azure Container Apps. For reproducible deployments, set this to an immutable value like the git SHA pushed by the CI pipeline.

Optional (monitoring):
- `alert_email` - if set, Terraform creates an Azure Monitor action group and basic Container Apps metric alerts (CPU + memory).

Recommended: copy `dev.local.auto.tfvars.example` to `dev.local.auto.tfvars` and fill in values for local development (auto-loaded and usually gitignored). Alternatively, use the provided `*.tfvars` files and pass with `-var-file`.

Note: the `azurerm` provider uses the active Azure CLI context by default (`use_cli = true`). If Terraform cannot determine your subscription for any reason, set `subscription_id` in `dev.local.auto.tfvars` or export `ARM_SUBSCRIPTION_ID`.

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

Note: if you see `subscription ID could not be determined`, set `subscription_id` in `dev.local.auto.tfvars` (preferred) or export `ARM_SUBSCRIPTION_ID` in your shell.

## CI/CD
The existing GitHub Actions workflow in `.github/workflows/kanban-cd.yml` builds and pushes the Docker image to GitHub Container Registry (public). The Container App pulls the public image without authentication. The Container App's managed identity is granted `Key Vault Secrets User` role to read application secrets from Key Vault.

## Notes

- **Postgres password generation**: the Postgres Terraform module generates the administrator password internally and stores it in Key Vault. (A previously-declared but unused `admin_password` input was removed to avoid confusion.)
- **Logging/analytics**: a Log Analytics Workspace is created and connected to the Container Apps Environment, so Container Apps logs/metrics are available in Azure Monitor Logs.
