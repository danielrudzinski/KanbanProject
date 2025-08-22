# Terraform Infrastructure for Kanban Project

This directory contains the Terraform configuration for deploying the Kanban project on Azure.

## Prerequisites

- [Terraform CLI](https://learn.hashicorp.com/tutorials/terraform/install-cli)
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- Logged in to Azure CLI (`az login`)
- An Azure Storage Account to store Terraform state.

## Setup

1.  **Create Storage for Terraform State:**
    You need to create a resource group and a storage account to store the Terraform state remotely.

    ```bash
    az group create --name tfstate-rg --location "West Europe"
    az storage account create --name tfstatekanban --resource-group tfstate-rg --location "West Europe" --sku Standard_LRS
    az storage container create --name tfstate --account-name tfstatekanban
    ```

2.  **Populate Key Vault:**
    The application requires secrets to be stored in Azure Key Vault. The Terraform configuration creates the Key Vault and stores values provided via variables. Ensure these are provided for apply (tfvars or environment variables):
    - `jwt_secret_key`
    - `spring_mail_username`
    - `spring_mail_password`

## Deployment

1.  **Initialize Terraform:**
    Navigate to the `terraform` directory and run:
    ```bash
    terraform init
    ```

2.  **Select Workspace:**
    For different environments, use Terraform workspaces.
    ```bash
    terraform workspace select dev # for development
    terraform workspace select prod # for production
    ```
    If the workspace doesn't exist, create it:
    ```bash
    terraform workspace new dev
    ```

3.  **Plan and Apply:**
    Run `terraform plan` to see the changes and `terraform apply` to deploy.
    ```bash
    terraform plan -var-file="dev.tfvars"
    terraform apply -var-file="dev.tfvars"
    ```
    For production, use `prod.tfvars`.

## CI/CD
The existing GitHub Actions workflow in `.github/workflows/kanban-cd.yml` builds and pushes the Docker image to GitHub Container Registry (public). The Container App pulls the public image without authentication. The Container App's managed identity is granted `Key Vault Secrets User` role to be able to read application secrets from Key Vault.
