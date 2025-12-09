output "resource_group_id" {
  value = var.create_resource_group ? azurerm_resource_group.rg[0].id : null
}

output "vnet_id" {
  value = var.deploy_vnet ? azurerm_virtual_network.vnet[0].id : null
}

output "acr_login_server" {
  value = var.deploy_acr ? azurerm_container_registry.acr[0].login_server : null
}
