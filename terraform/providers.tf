terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">=3.0.0"
    }
    http = {
      source  = "hashicorp/http"
      version = ">= 3.4.0"
    }
  }
  backend "azurerm" {
    resource_group_name  = "tfstate-rg"
    storage_account_name = "tfstatekanban"
    container_name       = "tfstate"
    use_azuread_auth     = true
    // key = "terraform.tfstate" // optional
  }
}

provider "azurerm" {
  use_cli = true
  features {}
}

provider "http" {}