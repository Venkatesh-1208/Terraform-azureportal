variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
}

variable "location" {
  description = "Azure Region"
  type        = string
  default     = "East US"
}

variable "resource_group_name" {
  description = "Name of the Resource Group"
  type        = string
}

variable "create_resource_group" {
  description = "Whether to create a new Resource Group"
  type        = bool
  default     = false
}

# -------------------------------------------------------------------------
# IaaS Variables
# -------------------------------------------------------------------------

# Virtual Machine
variable "deploy_vm" {
  description = "Deploy Virtual Machine"
  type        = bool
  default     = false
}

variable "vm_name" {
  description = "Name of the Virtual Machine"
  type        = string
  default     = "my-vm"
}

variable "vm_size" {
  description = "Size of the Virtual Machine"
  type        = string
  default     = "Standard_B1s"
}

variable "admin_username" {
  description = "Admin username for the VM"
  type        = string
  default     = "azureuser"
}

variable "admin_password" {
  description = "Admin password for the VM"
  type        = string
  sensitive   = true
  default     = ""
}

# Virtual Network
variable "deploy_vnet" {
  description = "Deploy Virtual Network"
  type        = bool
  default     = false
}

variable "vnet_name" {
  description = "Name of the Virtual Network"
  type        = string
  default     = "my-vnet"
}

variable "vnet_address_space" {
  description = "Address space for the VNet"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "subnet_name" {
  description = "Name of the default subnet"
  type        = string
  default     = "default"
}

variable "subnet_prefix" {
  description = "Address prefix for the default subnet"
  type        = list(string)
  default     = ["10.0.0.0/24"]
}

# Storage Account
variable "deploy_storage" {
  description = "Deploy Storage Account"
  type        = bool
  default     = false
}

variable "storage_account_name" {
  description = "Name of the Storage Account"
  type        = string
  default     = ""
}

variable "storage_account_type" {
  description = "Storage Account Replication Type"
  type        = string
  default     = "Standard_LRS"
}

# Load Balancer
variable "deploy_lb" {
  description = "Deploy Load Balancer"
  type        = bool
  default     = false
}

variable "lb_name" {
  description = "Name of the Load Balancer"
  type        = string
  default     = "my-lb"
}

variable "lb_sku" {
  description = "SKU of the Load Balancer"
  type        = string
  default     = "Basic"
}

# Public IP
variable "deploy_public_ip" {
  description = "Deploy Public IP Address"
  type        = bool
  default     = false
}

variable "public_ip_name" {
  description = "Name of the Public IP"
  type        = string
  default     = "my-public-ip"
}

variable "public_ip_allocation" {
  description = "Public IP Allocation Method"
  type        = string
  default     = "Dynamic"
}

# Network Security Group
variable "deploy_nsg" {
  description = "Deploy Network Security Group"
  type        = bool
  default     = false
}

variable "nsg_name" {
  description = "Name of the Network Security Group"
  type        = string
  default     = "my-nsg"
}

# -------------------------------------------------------------------------
# PaaS Variables
# -------------------------------------------------------------------------

# ACR
variable "deploy_acr" {
  description = "Deploy Azure Container Registry"
  type        = bool
  default     = false
}

variable "acr_name" {
  description = "Name of the Azure Container Registry"
  type        = string
  default     = ""
}

variable "acr_sku" {
  description = "SKU for the ACR"
  type        = string
  default     = "Basic"
}

# Linux Web App
variable "deploy_app_linux" {
  description = "Deploy Linux App Service with Container"
  type        = bool
  default     = false
}

variable "linux_web_app_name" {
  description = "Name for the Linux Web App"
  type        = string
  default     = "my-linux-app"
}

variable "linux_asp_create" {
  description = "Create a new App Service Plan (true) or use existing (false)"
  type        = bool
  default     = true
}

variable "linux_asp_name" {
  description = "Name of the App Service Plan (New or Existing)"
  type        = string
  default     = "asp-linux-default"
}

variable "linux_asp_rg" {
  description = "Resource Group for existing App Service Plan (Leave empty if same as current)"
  type        = string
  default     = ""
}

variable "linux_web_app_sku" {
  description = "SKU for the Linux Web App Service Plan"
  type        = string
  default     = "B1"
}

variable "linux_docker_image" {
  description = "Docker Image to deploy (e.g., nginx:latest)"
  type        = string
  default     = "nginx:latest"
}

variable "create_deployment_slot" {
  description = "Create a Blue-Green deployment slot"
  type        = bool
  default     = false
}

variable "use_existing_acr" {
  description = "Use an existing Azure Container Registry"
  type        = bool
  default     = false
}

variable "existing_acr_name" {
  description = "Name of the existing Azure Container Registry"
  type        = string
  default     = ""
}

variable "existing_acr_rg" {
  description = "Resource Group of the existing ACR"
  type        = string
  default     = ""
}

# Windows Web App
variable "deploy_app_windows" {
  description = "Deploy Windows App Service"
  type        = bool
  default     = false
}

variable "windows_web_app_name" {
  description = "Name for the Windows Web App"
  type        = string
  default     = "my-win-app"
}

variable "windows_asp_name" {
  description = "Name for the Windows App Service Plan"
  type        = string
  default     = "asp-win-my-app"
}

variable "windows_asp_sku" {
  description = "SKU for the Windows App Service Plan"
  type        = string
  default     = "F1"
}

# Function App
variable "deploy_func_ai" {
  description = "Deploy Function App with AI Integration"
  type        = bool
  default     = false
}

variable "function_app_name" {
  description = "Name of the Function App"
  type        = string
  default     = "my-func-app"
}

variable "function_storage_name" {
  description = "Name of the Storage Account for Function App"
  type        = string
  default     = ""
}

variable "deploy_cosmos" {
  description = "Deploy Cosmos DB for Function App"
  type        = bool
  default     = false
}

variable "deploy_openai" {
  description = "Deploy OpenAI/Cognitive Services for Function App"
  type        = bool
  default     = false
}

# -------------------------------------------------------------------------
# Database Variables
# -------------------------------------------------------------------------

variable "deploy_sql" {
  description = "Deploy SQL Server"
  type        = bool
  default     = false
}

variable "sql_server_name" { type = string; default = "" }
variable "sql_admin_user" { type = string; default = "sqladminuser" }
variable "sql_admin_password" { type = string; sensitive = true; default = "" }
variable "deploy_sql_db" { type = bool; default = false }

variable "deploy_postgres" {
  description = "Deploy PostgreSQL Flexible Server"
  type        = bool
  default     = false
}

variable "postgres_server_name" { type = string; default = "" }
variable "postgres_sku" { type = string; default = "B_Standard_B1ms" }
variable "postgres_version" { type = string; default = "14" }
variable "postgres_admin_user" { type = string; default = "pgadmin" }
variable "postgres_admin_password" { type = string; sensitive = true; default = "" }
variable "postgres_db_name" { type = string; default = "" }

variable "deploy_cosmos_db" {
  description = "Deploy Standalone Cosmos DB"
  type        = bool
  default     = false
}

variable "cosmos_name" { type = string; default = "" }
variable "cosmos_api" { type = string; default = "GlobalDocumentDB" }
variable "cosmos_consistency" { type = string; default = "Session" }


# -------------------------------------------------------------------------
# Security & Management Variables
# -------------------------------------------------------------------------

variable "deploy_keyvault" {
  description = "Deploy Key Vault"
  type        = bool
  default     = false
}

variable "kv_name" { type = string; default = "" }
variable "kv_sku" { type = string; default = "standard" }

variable "deploy_aks" {
  description = "Deploy Azure Kubernetes Service"
  type        = bool
  default     = false
}

variable "aks_name" { type = string; default = "my-aks-cluster" }
variable "aks_node_count" { type = number; default = 3 }
variable "aks_node_size" { type = string; default = "Standard_D2s_v3" }

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default     = {}
}
