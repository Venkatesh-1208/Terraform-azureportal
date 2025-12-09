# Resource Group
resource "azurerm_resource_group" "rg" {
  count    = var.create_resource_group ? 1 : 0
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

data "azurerm_client_config" "current" {}

# -------------------------------------------------------------------------
# IaaS Resources
# -------------------------------------------------------------------------

## Virtual Network
resource "azurerm_virtual_network" "vnet" {
  count               = var.deploy_vnet ? 1 : 0
  name                = var.vnet_name
  location            = var.location
  resource_group_name = var.resource_group_name
  address_space       = var.vnet_address_space

  tags = var.tags

  depends_on = [azurerm_resource_group.rg]
}

resource "azurerm_subnet" "subnet" {
  count                = var.deploy_vnet ? 1 : 0
  name                 = var.subnet_name
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.vnet[0].name
  address_prefixes     = var.subnet_prefix
}

## Public IP
resource "azurerm_public_ip" "pip" {
  count               = var.deploy_public_ip ? 1 : 0
  name                = var.public_ip_name
  location            = var.location
  resource_group_name = var.resource_group_name
  allocation_method   = var.public_ip_allocation

  tags = var.tags

  depends_on = [azurerm_resource_group.rg]
}

## Network Security Group
resource "azurerm_network_security_group" "nsg" {
  count               = var.deploy_nsg ? 1 : 0
  name                = var.nsg_name
  location            = var.location
  resource_group_name = var.resource_group_name

  tags = var.tags

  depends_on = [azurerm_resource_group.rg]
}

## Network Interface (Required for VM)
resource "azurerm_network_interface" "nic" {
  count               = var.deploy_vm ? 1 : 0
  name                = "${var.vm_name}-nic"
  location            = var.location
  resource_group_name = var.resource_group_name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = var.deploy_vnet ? azurerm_subnet.subnet[0].id : null # Implicit dependency on VNet deployment for this POC
    private_ip_address_allocation = "Dynamic"
    
    # Attach Public IP if requested
    public_ip_address_id = var.deploy_public_ip ? azurerm_public_ip.pip[0].id : null
  }

  depends_on = [azurerm_virtual_network.vnet, azurerm_resource_group.rg]
}


## Virtual Machine (Linux)
resource "azurerm_linux_virtual_machine" "vm" {
  count               = var.deploy_vm ? 1 : 0
  name                = var.vm_name
  resource_group_name = var.resource_group_name
  location            = var.location
  size                = var.vm_size
  admin_username      = var.admin_username
  admin_password      = var.admin_password
  disable_password_authentication = false

  network_interface_ids = [
    azurerm_network_interface.nic[0].id,
  ]

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "UbuntuServer"
    sku       = "18.04-LTS"
    version   = "latest"
  }

  tags = var.tags

  depends_on = [azurerm_resource_group.rg]
}

## Storage Account
resource "azurerm_storage_account" "sa" {
  count                    = var.deploy_storage ? 1 : 0
  name                     = var.storage_account_name != "" ? var.storage_account_name : lower(replace("sa${var.resource_group_name}random", "/[^a-z0-9]/", ""))
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = split("_", var.storage_account_type)[0]
  account_replication_type = split("_", var.storage_account_type)[1]

  tags = var.tags

  depends_on = [azurerm_resource_group.rg]
}

## Load Balancer
resource "azurerm_lb" "lb" {
  count               = var.deploy_lb ? 1 : 0
  name                = var.lb_name
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = var.lb_sku

  frontend_ip_configuration {
    name                 = "PublicIPAddress"
    public_ip_address_id = var.deploy_public_ip ? azurerm_public_ip.pip[0].id : null 
  }

  tags = var.tags

  depends_on = [azurerm_resource_group.rg]
}


# -------------------------------------------------------------------------
# PaaS Resources
# -------------------------------------------------------------------------

## Azure Container Registry
resource "azurerm_container_registry" "acr" {
  count               = var.deploy_acr ? 1 : 0
  name                = var.acr_name != "" ? var.acr_name : lower(replace("acr${var.resource_group_name}random", "/[^a-z0-9]/", ""))
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = var.acr_sku
  admin_enabled       = false

  tags = var.tags

  depends_on = [azurerm_resource_group.rg]
}

## Linux Web App with Container
# 1. New App Service Plan (created if var.linux_asp_create is true)
resource "azurerm_service_plan" "asp_linux" {
  count               = (var.deploy_app_linux && var.linux_asp_create) ? 1 : 0
  name                = var.linux_asp_name
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  sku_name            = var.linux_web_app_sku
  
  tags = var.tags

  depends_on = [azurerm_resource_group.rg]
}

# 2. Existing App Service Plan (looked up if var.linux_asp_create is false)
data "azurerm_service_plan" "existing_asp" {
  count               = (var.deploy_app_linux && !var.linux_asp_create) ? 1 : 0
  name                = var.linux_asp_name
  resource_group_name = coalesce(var.linux_asp_rg, var.resource_group_name)
}

# Locals to determine which ASP ID to use and parse Docker Image
locals {
  final_asp_id = var.deploy_app_linux ? (
    var.linux_asp_create ? azurerm_service_plan.asp_linux[0].id : data.azurerm_service_plan.existing_asp[0].id
  ) : null

  # Parse Docker Image (e.g., "nginx:latest" -> image="nginx", tag="latest")
  # Fallback to "latest" if no tag provided
  docker_image_parts = split(":", var.linux_docker_image)
  docker_image_name  = local.docker_image_parts[0]
  docker_image_tag   = length(local.docker_image_parts) > 1 ? local.docker_image_parts[1] : "latest"
}

# 3. The Web App
resource "azurerm_linux_web_app" "app_linux" {
  count               = var.deploy_app_linux ? 1 : 0
  name                = var.linux_web_app_name
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = local.final_asp_id

  site_config {
    application_stack {
      docker_image     = local.docker_image_name
      docker_image_tag = local.docker_image_tag
    }
  }
  
  identity {
    type = "SystemAssigned"
  }

  app_settings = {
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
  }

  tags = var.tags

  depends_on = [azurerm_resource_group.rg, azurerm_service_plan.asp_linux]
}

# 4. Deployment Slot (Blue-Green)
resource "azurerm_linux_web_app_slot" "blue_green" {
  count          = (var.deploy_app_linux && var.create_deployment_slot) ? 1 : 0
  name           = "staging"
  app_service_id = azurerm_linux_web_app.app_linux[0].id

  site_config {
    application_stack {
      docker_image     = local.docker_image_name
      docker_image_tag = local.docker_image_tag
    }
  }

  tags = var.tags
}

# ACR Linking
data "azurerm_container_registry" "existing_acr" {
  count               = (var.deploy_app_linux && var.use_existing_acr) ? 1 : 0
  name                = var.existing_acr_name
  resource_group_name = coalesce(var.existing_acr_rg, var.resource_group_name)
}

locals {
  acr_id = var.deploy_app_linux ? (
    var.use_existing_acr ? (length(data.azurerm_container_registry.existing_acr) > 0 ? data.azurerm_container_registry.existing_acr[0].id : null) : (
        var.deploy_acr ? azurerm_container_registry.acr[0].id : null
    )
  ) : null
}

resource "azurerm_role_assignment" "acr_pull" {
  count                = (local.acr_id != null) ? 1 : 0
  scope                = local.acr_id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_linux_web_app.app_linux[0].identity[0].principal_id
}

## Windows Web App
resource "azurerm_service_plan" "asp_windows" {
  count               = var.deploy_app_windows ? 1 : 0
  name                = var.windows_asp_name
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Windows"
  sku_name            = var.windows_asp_sku

  tags = var.tags

  depends_on = [azurerm_resource_group.rg]
}

resource "azurerm_windows_web_app" "app_windows" {
  count               = var.deploy_app_windows ? 1 : 0
  name                = var.windows_web_app_name
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.asp_windows[0].id

  site_config {}
  
  tags = var.tags

  depends_on = [azurerm_resource_group.rg]
}

## Function App with AI Integration
resource "azurerm_storage_account" "func_sa" {
  count                    = var.deploy_func_ai ? 1 : 0
  name                     = var.function_storage_name != "" ? var.function_storage_name : lower(replace("funcsa${var.resource_group_name}random", "/[^a-z0-9]/", ""))
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = var.tags

  depends_on = [azurerm_resource_group.rg]
}

resource "azurerm_service_plan" "asp_func" {
  count               = var.deploy_func_ai ? 1 : 0
  name                = "${var.function_app_name}-asp"
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux" 
  sku_name            = "Y1" # Consumption Plan

  tags = var.tags

  depends_on = [azurerm_resource_group.rg]
}

resource "azurerm_linux_function_app" "func" {
  count               = var.deploy_func_ai ? 1 : 0
  name                = var.function_app_name
  resource_group_name = var.resource_group_name
  location            = var.location

  storage_account_name       = azurerm_storage_account.func_sa[0].name
  storage_account_access_key = azurerm_storage_account.func_sa[0].primary_access_key
  service_plan_id            = azurerm_service_plan.asp_func[0].id

  site_config {
    application_stack {
        python_version = "3.9" 
    }
  }

  tags = var.tags

  depends_on = [azurerm_resource_group.rg]
}

resource "azurerm_cosmosdb_account" "db" {
  count               = (var.deploy_func_ai && var.deploy_cosmos) ? 1 : 0
  name                = lower("${var.function_app_name}-cosmos")
  location            = var.location
  resource_group_name = var.resource_group_name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = var.location
    failover_priority = 0
  }

  tags = var.tags

  depends_on = [azurerm_resource_group.rg]
}

resource "azurerm_cognitive_account" "openai" {
  count               = (var.deploy_func_ai && var.deploy_openai) ? 1 : 0
  name                = lower("${var.function_app_name}-openai")
  location            = var.location
  resource_group_name = var.resource_group_name
  kind                = "OpenAI"

  sku_name = "S0"

  tags = var.tags

  depends_on = [azurerm_resource_group.rg]
}

# -------------------------------------------------------------------------
# Database Resources
# -------------------------------------------------------------------------

## SQL Server
resource "azurerm_mssql_server" "sql" {
  count                        = var.deploy_sql ? 1 : 0
  name                         = var.sql_server_name
  resource_group_name          = var.resource_group_name
  location                     = var.location
  version                      = "12.0"
  administrator_login          = var.sql_admin_user
  administrator_login_password = var.sql_admin_password
  minimum_tls_version          = "1.2"

  tags = var.tags

  depends_on = [azurerm_resource_group.rg]
}

resource "azurerm_mssql_database" "sqldb" {
  count         = (var.deploy_sql && var.deploy_sql_db) ? 1 : 0
  name          = "sqldb"
  server_id     = azurerm_mssql_server.sql[0].id
  sku_name      = "Basic"
}

## PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "postgres" {
  count               = var.deploy_postgres ? 1 : 0
  name                = var.postgres_server_name
  resource_group_name = var.resource_group_name
  location            = var.location
  version             = var.postgres_version
  administrator_login = var.postgres_admin_user
  administrator_password = var.postgres_admin_password
  sku_name            = var.postgres_sku
  storage_mb          = 32768
  
  tags = var.tags

  depends_on = [azurerm_resource_group.rg]
}

resource "azurerm_postgresql_flexible_server_database" "pgdb" {
  count      = (var.deploy_postgres && var.postgres_db_name != "") ? 1 : 0
  name       = var.postgres_db_name
  server_id  = azurerm_postgresql_flexible_server.postgres[0].id
  collation  = "en_US.utf8"
  charset    = "utf8"
}

## Cosmos DB (Standalone)
resource "azurerm_cosmosdb_account" "cosmos_db" {
  count               = var.deploy_cosmos_db ? 1 : 0
  name                = var.cosmos_name
  location            = var.location
  resource_group_name = var.resource_group_name
  offer_type          = "Standard"
  kind                = var.cosmos_api == "MongoDB" ? "MongoDB" : "GlobalDocumentDB"

  consistency_policy {
    consistency_level = var.cosmos_consistency
  }

  geo_location {
    location          = var.location
    failover_priority = 0
  }

  tags = var.tags

  depends_on = [azurerm_resource_group.rg]
}

# -------------------------------------------------------------------------
# Security & Management Resources
# -------------------------------------------------------------------------

## Key Vault
resource "azurerm_key_vault" "kv" {
  count                       = var.deploy_keyvault ? 1 : 0
  name                        = var.kv_name
  location                    = var.location
  resource_group_name         = var.resource_group_name
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  sku_name                    = var.kv_sku
  purge_protection_enabled    = false
  
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id
    key_permissions = ["Get", "Create", "Delete", "List", "Update"]
    secret_permissions = ["Get", "Set", "Delete", "List"]
  }

  tags = var.tags

  depends_on = [azurerm_resource_group.rg]
}

## Log Analytics Workspace (for AKS Monitoring)
resource "azurerm_log_analytics_workspace" "aks_law" {
  count               = (var.deploy_aks && var.aks_enable_monitoring) ? 1 : 0
  name                = "law-${var.aks_name}"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = var.tags

  depends_on = [azurerm_resource_group.rg]
}

## Azure Kubernetes Service (AKS)
resource "azurerm_kubernetes_cluster" "aks" {
  count               = var.deploy_aks ? 1 : 0
  name                = var.aks_name
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = "${var.aks_name}-dns"

  default_node_pool {
    name                = "default"
    vm_size             = var.aks_node_size
    enable_auto_scaling = var.aks_enable_auto_scaling
    node_count          = var.aks_enable_auto_scaling ? null : var.aks_node_count
    min_count           = var.aks_enable_auto_scaling ? var.aks_min_count : null
    max_count           = var.aks_enable_auto_scaling ? var.aks_max_count : null
  }

  identity {
    type = "SystemAssigned"
  }

  tags = merge(var.tags, {
    Environment = var.aks_environment
  })

  dynamic "oms_agent" {
    for_each = var.aks_enable_monitoring ? [1] : []
    content {
      log_analytics_workspace_id = azurerm_log_analytics_workspace.aks_law[0].id
    }
  }

  depends_on = [azurerm_resource_group.rg]
}
