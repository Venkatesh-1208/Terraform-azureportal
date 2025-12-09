import React, { useState, useEffect, useRef } from 'react';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from './authConfig';

const ServiceCard = ({ label, checked, onToggle, children }) => (
    <div className={`service-card ${checked ? 'selected' : ''}`}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', marginBottom: checked ? '15px' : '0' }}>
            <input type="checkbox" checked={checked} onChange={onToggle} style={{ transform: 'scale(1.2)' }} />
            {label}
        </label>
        {checked && <div className="card-content" style={{ paddingLeft: '10px' }}>{children}</div>}
    </div>
);

function App() {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const [userSubscriptions, setUserSubscriptions] = useState([]);
    const fileInputRef = useRef(null);

    // Logic to handle login/logout
    const handleLogin = () => {
        instance.loginPopup(loginRequest).catch(e => console.error(e));
    };

    const handleLogout = () => {
        instance.logoutPopup().catch(e => console.error(e));
    };

    // State
    const [globalContext, setGlobalContext] = useState({ projectName: "myproject", environment: "Dev" });
    const [subscription, setSubscription] = useState("");
    const [location, setLocation] = useState("East US");
    const [resourceGroup, setResourceGroup] = useState("");
    const [isNewRg, setIsNewRg] = useState(false);

    // Auth Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [authSettings, setAuthSettings] = useState({
        clientId: localStorage.getItem("azureClientId") || "",
        tenantId: localStorage.getItem("azureTenantId") || ""
    });

    const saveAuthSettings = () => {
        localStorage.setItem("azureClientId", authSettings.clientId);
        localStorage.setItem("azureTenantId", authSettings.tenantId);
        window.location.reload();
    };

    // Fetch Subscriptions
    useEffect(() => {
        if (isAuthenticated && accounts[0]) {
            instance.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0]
            }).then((response) => {
                fetch("https://management.azure.com/subscriptions?api-version=2020-01-01", {
                    headers: { "Authorization": `Bearer ${response.accessToken}` }
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.value) setUserSubscriptions(data.value);
                    })
                    .catch(err => console.error("Error fetching subscriptions", err));
            });
        }
    }, [isAuthenticated, accounts, instance]);

    // IaaS State
    const [iaasSelections, setIaasSelections] = useState({ vm: false, vnet: false, storage: false, lb: false, nsg: false, publicIp: false });
    const [vmConfig, setVmConfig] = useState({ name: "", size: "Standard_B1s", username: "azureuser", password: "" });
    const [vnetConfig, setVnetConfig] = useState({ name: "", addressPrefix: "10.0.0.0/16", subnetName: "default", subnetPrefix: "10.0.0.0/24" });
    const [storageConfig, setStorageConfig] = useState({ name: "", type: "Standard_LRS" });
    const [lbConfig, setLbConfig] = useState({ name: "", sku: "Basic" });
    const [nsgConfig, setNsgConfig] = useState({ name: "" });
    const [pipConfig, setPipConfig] = useState({ name: "", allocation: "Dynamic" });

    // PaaS State
    const [paasSelections, setPaasSelections] = useState({ acr: false, linuxApp: false, windowsApp: false, funcApp: false });
    const [linuxAppConfig, setLinuxAppConfig] = useState({
        name: "", aspSelection: "new", aspName: "", aspRg: "", sku: "B1", dockerImage: "nginx:latest", acrMode: "new", existingAcrName: "", enableSlot: false
    });
    const [acrConfig, setAcrConfig] = useState({ name: "", sku: "Basic" });
    const [windowsAppConfig, setWindowsAppConfig] = useState({ aspName: "", appName: "", sku: "F1" });
    const [funcAppConfig, setFuncAppConfig] = useState({ appName: "", aspName: "Consumption plan (auto-generated)", storageName: "", createCosmos: false, createOpenAI: false });

    // Database State
    const [dbSelections, setDbSelections] = useState({ sql: false, postgres: false, cosmos: false });
    const [sqlConfig, setSqlConfig] = useState({ serverName: "", adminUser: "sqladmin", adminPass: "", createDb: true });
    const [postgresConfig, setPostgresConfig] = useState({ serverName: "", sku: "B_Standard_B1ms", version: "14", adminUser: "pgadmin", adminPass: "", dbName: "postgres" });
    const [cosmosConfig, setCosmosConfig] = useState({ name: "", api: "GlobalDocumentDB", consistency: "Session" });

    // Security State
    const [secSelections, setSecSelections] = useState({ keyvault: false, aks: false });
    const [kvConfig, setKvConfig] = useState({ name: "", sku: "standard" });
    const [aksConfig, setAksConfig] = useState({
        name: "", nodeCount: 3, nodeSize: "Standard_D2s_v3", environment: "Dev",
        enableAutoScale: false, minCount: 1, maxCount: 3, enableMonitoring: false
    });

    // Toggle Handlers
    const handleIaasChange = (key) => setIaasSelections(prev => ({ ...prev, [key]: !prev[key] }));
    const handlePaasChange = (key) => setPaasSelections(prev => ({ ...prev, [key]: !prev[key] }));
    const handleDbChange = (key) => setDbSelections(prev => ({ ...prev, [key]: !prev[key] }));
    const handleSecChange = (key) => setSecSelections(prev => ({ ...prev, [key]: !prev[key] }));

    // Auto-Naming Logic
    const applyNaming = () => {
        const { projectName, environment } = globalContext;
        if (!projectName) { alert("Please enter a Project Name"); return; }

        const prefix = `${projectName.toLowerCase()}-${environment.toLowerCase()}`;
        const cleanPrefix = prefix.replace(/[^a-z0-9-]/g, '');
        const cleanStoragePrefix = cleanPrefix.replace(/-/g, '');

        if (iaasSelections.vm) setVmConfig(prev => ({ ...prev, name: `${prefix}-vm` }));
        if (iaasSelections.vnet) setVnetConfig(prev => ({ ...prev, name: `${prefix}-vnet` }));
        if (iaasSelections.storage) setStorageConfig(prev => ({ ...prev, name: `${cleanStoragePrefix}sa`.substring(0, 24) }));
        if (iaasSelections.lb) setLbConfig(prev => ({ ...prev, name: `${prefix}-lb` }));
        if (iaasSelections.nsg) setNsgConfig(prev => ({ ...prev, name: `${prefix}-nsg` }));
        if (iaasSelections.publicIp) setPipConfig(prev => ({ ...prev, name: `${prefix}-pip` }));

        if (paasSelections.acr) setAcrConfig(prev => ({ ...prev, name: `${cleanStoragePrefix}acr`.substring(0, 50) }));
        if (paasSelections.linuxApp) setLinuxAppConfig(prev => ({ ...prev, name: `${prefix}-linux-app`, aspName: `${prefix}-asp-linux` }));
        if (paasSelections.windowsApp) setWindowsAppConfig(prev => ({ ...prev, appName: `${prefix}-win-app`, aspName: `${prefix}-asp-win` }));
        if (paasSelections.funcApp) setFuncAppConfig(prev => ({ ...prev, appName: `${prefix}-func`, storageName: `${cleanStoragePrefix}funcsa`.substring(0, 24) }));

        if (dbSelections.sql) setSqlConfig(prev => ({ ...prev, serverName: `${prefix}-sql` }));
        if (dbSelections.postgres) setPostgresConfig(prev => ({ ...prev, serverName: `${prefix}-psql` }));
        if (dbSelections.cosmos) setCosmosConfig(prev => ({ ...prev, name: `${prefix}-cosmos` }));

        if (secSelections.keyvault) setKvConfig(prev => ({ ...prev, name: `${prefix}-kv` }));
        if (secSelections.aks) setAksConfig(prev => ({ ...prev, name: `${prefix}-aks`, environment: environment }));

        setResourceGroup(`${prefix}-rg`);
        setIsNewRg(true);
    };

    // Load/Save Config Logic
    const getFullConfig = () => {
        return {
            globalContext, subscription, location, resourceGroup, isNewRg,
            iaasSelections, iaasConfig: { vm: vmConfig, vnet: vnetConfig, storage: storageConfig, lb: lbConfig, nsg: nsgConfig, publicIp: pipConfig },
            paasSelections, paasConfig: { linuxApp: linuxAppConfig, acr: acrConfig, windowsApp: windowsAppConfig, funcApp: funcAppConfig },
            dbSelections, dbConfig: { sql: sqlConfig, postgres: postgresConfig, cosmos: cosmosConfig },
            secSelections, secConfig: { keyvault: kvConfig, aks: aksConfig },
            tags: { Project: globalContext.projectName, Environment: globalContext.environment, CreatedBy: "AzurePortal" }
        };
    };

    const handleSaveConfig = () => {
        const config = getFullConfig();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `azure_config_${globalContext.projectName}_${globalContext.environment}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleLoadConfig = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loaded = JSON.parse(e.target.result);
                if (loaded.globalContext) setGlobalContext(loaded.globalContext);
                if (loaded.subscription) setSubscription(loaded.subscription);
                if (loaded.location) setLocation(loaded.location);
                if (loaded.resourceGroup) setResourceGroup(loaded.resourceGroup);
                if (loaded.isNewRg !== undefined) setIsNewRg(loaded.isNewRg);

                if (loaded.iaasSelections) setIaasSelections(loaded.iaasSelections);
                if (loaded.iaasConfig) {
                    if (loaded.iaasConfig.vm) setVmConfig(loaded.iaasConfig.vm);
                    if (loaded.iaasConfig.vnet) setVnetConfig(loaded.iaasConfig.vnet);
                    if (loaded.iaasConfig.storage) setStorageConfig(loaded.iaasConfig.storage);
                    if (loaded.iaasConfig.lb) setLbConfig(loaded.iaasConfig.lb);
                    if (loaded.iaasConfig.nsg) setNsgConfig(loaded.iaasConfig.nsg);
                    if (loaded.iaasConfig.publicIp) setPipConfig(loaded.iaasConfig.publicIp);
                }

                if (loaded.paasSelections) setPaasSelections(loaded.paasSelections);
                if (loaded.paasConfig) {
                    if (loaded.paasConfig.linuxApp) setLinuxAppConfig(loaded.paasConfig.linuxApp);
                    if (loaded.paasConfig.acr) setAcrConfig(loaded.paasConfig.acr);
                    if (loaded.paasConfig.windowsApp) setWindowsAppConfig(loaded.paasConfig.windowsApp);
                    if (loaded.paasConfig.funcApp) setFuncAppConfig(loaded.paasConfig.funcApp);
                }

                if (loaded.dbSelections) setDbSelections(loaded.dbSelections);
                if (loaded.dbConfig) {
                    if (loaded.dbConfig.sql) setSqlConfig(loaded.dbConfig.sql);
                    if (loaded.dbConfig.postgres) setPostgresConfig(loaded.dbConfig.postgres);
                    if (loaded.dbConfig.cosmos) setCosmosConfig(loaded.dbConfig.cosmos);
                }

                if (loaded.secSelections) setSecSelections(loaded.secSelections);
                if (loaded.secConfig) {
                    if (loaded.secConfig.keyvault) setKvConfig(loaded.secConfig.keyvault);
                    if (loaded.secConfig.aks) setAksConfig(loaded.secConfig.aks);
                }
            } catch (err) { alert("Error parsing config: " + err.message); }
        };
        reader.readAsText(file);
    };

    return (
        <div className="main-container">
            {/* Header */}
            <div className="title-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3>Azure Deployment Portal</h3>
                    <span className="badge bg-light text-dark">{globalContext.environment}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleLoadConfig} accept=".json" />
                    <button className="btn btn-outline-light btn-sm" onClick={() => fileInputRef.current.click()}>Load Config</button>
                    <button className="btn btn-outline-light btn-sm" onClick={handleSaveConfig}>Save Config</button>
                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.3)', margin: '0 5px' }}></div>
                    {isAuthenticated ? (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span>{accounts[0].name}</span>
                            <button className="btn btn-light btn-sm" onClick={handleLogout}>Sign Out</button>
                        </div>
                    ) : (
                        <button className="btn btn-light btn-sm" onClick={handleLogin}>Sign In with Azure</button>
                    )}
                    <button className="btn btn-link text-white" onClick={() => setShowSettings(!showSettings)}>Settings</button>
                </div>
            </div>

            {/* Auth Settings */}
            {showSettings && (
                <div className="alert alert-info">
                    <h5>App Registration Settings</h5>
                    <div className="form-group"><label>Client ID</label><input type="text" className="form-control" value={authSettings.clientId} onChange={e => setAuthSettings({ ...authSettings, clientId: e.target.value })} /></div>
                    <div className="form-group"><label>Tenant ID</label><input type="text" className="form-control" value={authSettings.tenantId} onChange={e => setAuthSettings({ ...authSettings, tenantId: e.target.value })} /></div>
                    <button className="btn btn-primary btn-sm mt-2" onClick={saveAuthSettings}>Save & Reload</button>
                </div>
            )}

            {/* Global Context */}
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '5px', borderLeft: '4px solid #0078d4', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '10px', color: '#0078d4' }}>Global Context</h4>
                <div className="row align-items-end">
                    <div className="col-md-4">
                        <div className="form-group mb-0">
                            <label>Project Name</label>
                            <input type="text" className="form-control" value={globalContext.projectName} onChange={e => setGlobalContext({ ...globalContext, projectName: e.target.value })} />
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="form-group mb-0">
                            <label>Global Environment</label>
                            <select className="form-control" value={globalContext.environment} onChange={e => setGlobalContext({ ...globalContext, environment: e.target.value })}>
                                <option value="Dev">Dev</option><option value="Test">Test</option><option value="Prod">Prod</option>
                            </select>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <button className="btn btn-warning w-100" onClick={applyNaming}>Apply Naming Convention</button>
                    </div>
                </div>
            </div>

            {/* Basic Config */}
            <div className="mb-4">
                <h2 className="section-title">Basic Configuration</h2>
                <div className="row">
                    <div className="col-md-6">
                        <div className="form-group">
                            <label>Subscription *</label>
                            <select className="form-control" value={subscription} onChange={(e) => setSubscription(e.target.value)}>
                                <option value="">Select Subscription...</option>
                                {isAuthenticated && userSubscriptions.length > 0 ? (
                                    userSubscriptions.map(sub => <option key={sub.subscriptionId} value={sub.subscriptionId}>{sub.displayName} ({sub.subscriptionId})</option>)
                                ) : (
                                    <><option value="sub-1">Free Trial (Default)</option><option value="sub-2">Pay-As-You-Go</option></>
                                )}
                            </select>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="form-group">
                            <label>Location</label>
                            <select className="form-control" value={location} onChange={(e) => setLocation(e.target.value)}>
                                <option value="East US">East US</option><option value="West US">West US</option><option value="North Europe">North Europe</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="form-group mt-2">
                    <div className="form-check">
                        <input className="form-check-input" type="checkbox" checked={isNewRg} onChange={(e) => setIsNewRg(e.target.checked)} />
                        <label className="form-check-label">Create New Resource Group</label>
                    </div>
                    {isNewRg ? (
                        <input type="text" className="form-control mt-2" placeholder="New RG Name" value={resourceGroup} onChange={(e) => setResourceGroup(e.target.value)} />
                    ) : (
                        <select className="form-control mt-2" value={resourceGroup} onChange={(e) => setResourceGroup(e.target.value)}>
                            <option value="">Select RG...</option><option value="rg-demo">rg-demo</option><option value="rg-prod">rg-prod</option>
                        </select>
                    )}
                </div>
            </div>

            <div className="row">
                {/* IaaS Panel */}
                <div className="col-lg-12 mb-4">
                    <div className="panel h-100">
                        <div className="panel-header">Infrastructure (IaaS)</div>
                        <div className="panel-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <ServiceCard label="Virtual Machines" checked={iaasSelections.vm} onToggle={() => handleIaasChange('vm')}>
                                        <div className="form-group"><label>VM Name</label><input type="text" className="form-control" value={vmConfig.name} onChange={e => setVmConfig({ ...vmConfig, name: e.target.value })} /></div>
                                        <div className="form-group"><label>Size</label><select className="form-control" value={vmConfig.size} onChange={e => setVmConfig({ ...vmConfig, size: e.target.value })}><option value="Standard_B1s">B1s</option><option value="Standard_D2s_v3">D2s_v3</option></select></div>
                                        <div className="form-group"><label>Username</label><input type="text" className="form-control" value={vmConfig.username} onChange={e => setVmConfig({ ...vmConfig, username: e.target.value })} /></div>
                                    </ServiceCard>
                                    <ServiceCard label="Virtual Network" checked={iaasSelections.vnet} onToggle={() => handleIaasChange('vnet')}>
                                        <div className="form-group"><label>VNet Name</label><input type="text" className="form-control" value={vnetConfig.name} onChange={e => setVnetConfig({ ...vnetConfig, name: e.target.value })} /></div>
                                        <div className="form-group"><label>Address Prefix</label><input type="text" className="form-control" value={vnetConfig.addressPrefix} onChange={e => setVnetConfig({ ...vnetConfig, addressPrefix: e.target.value })} /></div>
                                        <div className="form-group"><label>Subnet Name</label><input type="text" className="form-control" value={vnetConfig.subnetName} onChange={e => setVnetConfig({ ...vnetConfig, subnetName: e.target.value })} /></div>
                                    </ServiceCard>
                                    <ServiceCard label="Storage Account" checked={iaasSelections.storage} onToggle={() => handleIaasChange('storage')}>
                                        <div className="form-group"><label>Name</label><input type="text" className="form-control" value={storageConfig.name} onChange={e => setStorageConfig({ ...storageConfig, name: e.target.value })} /></div>
                                        <div className="form-group"><label>Type</label><select className="form-control" value={storageConfig.type} onChange={e => setStorageConfig({ ...storageConfig, type: e.target.value })}><option value="Standard_LRS">LRS</option><option value="Standard_GRS">GRS</option></select></div>
                                    </ServiceCard>
                                </div>
                                <div className="col-md-6">
                                    <ServiceCard label="Load Balancer" checked={iaasSelections.lb} onToggle={() => handleIaasChange('lb')}>
                                        <div className="form-group"><label>Name</label><input type="text" className="form-control" value={lbConfig.name} onChange={e => setLbConfig({ ...lbConfig, name: e.target.value })} /></div>
                                        <div className="form-group"><label>SKU</label><select className="form-control" value={lbConfig.sku} onChange={e => setLbConfig({ ...lbConfig, sku: e.target.value })}><option value="Basic">Basic</option><option value="Standard">Standard</option></select></div>
                                    </ServiceCard>
                                    <ServiceCard label="NSG" checked={iaasSelections.nsg} onToggle={() => handleIaasChange('nsg')}>
                                        <div className="form-group"><label>Name</label><input type="text" className="form-control" value={nsgConfig.name} onChange={e => setNsgConfig({ ...nsgConfig, name: e.target.value })} /></div>
                                    </ServiceCard>
                                    <ServiceCard label="Public IP" checked={iaasSelections.publicIp} onToggle={() => handleIaasChange('publicIp')}>
                                        <div className="form-group"><label>Name</label><input type="text" className="form-control" value={pipConfig.name} onChange={e => setPipConfig({ ...pipConfig, name: e.target.value })} /></div>
                                        <div className="form-group"><label>Method</label><select className="form-control" value={pipConfig.allocation} onChange={e => setPipConfig({ ...pipConfig, allocation: e.target.value })}><option value="Dynamic">Dynamic</option><option value="Static">Static</option></select></div>
                                    </ServiceCard>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PaaS Panel */}
                <div className="col-lg-12 mb-4">
                    <div className="panel h-100">
                        <div className="panel-header">Platform (PaaS)</div>
                        <div className="panel-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <ServiceCard label="Linux App Service (Container)" checked={paasSelections.linuxApp} onToggle={() => handlePaasChange('linuxApp')}>
                                        <div className="form-group"><label>App Name</label><input type="text" className="form-control" value={linuxAppConfig.name} onChange={e => setLinuxAppConfig({ ...linuxAppConfig, name: e.target.value })} /></div>
                                        <div className="d-flex gap-3 mb-2">
                                            <div className="form-check"><input className="form-check-input" type="radio" checked={linuxAppConfig.aspSelection === 'new'} onChange={() => setLinuxAppConfig({ ...linuxAppConfig, aspSelection: 'new' })} /><label>New ASP</label></div>
                                            <div className="form-check"><input className="form-check-input" type="radio" checked={linuxAppConfig.aspSelection === 'existing'} onChange={() => setLinuxAppConfig({ ...linuxAppConfig, aspSelection: 'existing' })} /><label>Existing ASP</label></div>
                                        </div>
                                        {linuxAppConfig.aspSelection === 'new' ? (
                                            <><div className="form-group"><label>ASP Name</label><input type="text" className="form-control" value={linuxAppConfig.aspName} onChange={e => setLinuxAppConfig({ ...linuxAppConfig, aspName: e.target.value })} /></div>
                                                <div className="form-group"><label>SKU</label><select className="form-control" value={linuxAppConfig.sku} onChange={(e) => setLinuxAppConfig({ ...linuxAppConfig, sku: e.target.value })}><option value="B1">B1</option><option value="S1">S1</option><option value="P1v2">P1v2</option></select></div></>
                                        ) : (
                                            <div className="form-group"><label>Existing ASP Resource Group</label><input type="text" className="form-control" value={linuxAppConfig.aspRg} onChange={e => setLinuxAppConfig({ ...linuxAppConfig, aspRg: e.target.value })} /></div>
                                        )}
                                        <div className="form-group"><label>Docker Image</label><input type="text" className="form-control" value={linuxAppConfig.dockerImage} onChange={e => setLinuxAppConfig({ ...linuxAppConfig, dockerImage: e.target.value })} /></div>
                                        <div className="form-check mt-2"><input className="form-check-input" type="checkbox" checked={linuxAppConfig.enableSlot} onChange={e => setLinuxAppConfig({ ...linuxAppConfig, enableSlot: e.target.checked })} /><label>Create Blue-Green Slot</label></div>
                                    </ServiceCard>
                                    <ServiceCard label="Azure Container Registry" checked={paasSelections.acr} onToggle={() => handlePaasChange('acr')}>
                                        <div className="form-group"><label>Name</label><input type="text" className="form-control" value={acrConfig.name} onChange={e => setAcrConfig({ ...acrConfig, name: e.target.value })} /></div>
                                        <div className="form-group"><label>SKU</label><select className="form-control" value={acrConfig.sku} onChange={e => setAcrConfig({ ...acrConfig, sku: e.target.value })}><option value="Basic">Basic</option><option value="Standard">Standard</option></select></div>
                                    </ServiceCard>
                                </div>
                                <div className="col-md-6">
                                    <ServiceCard label="Windows App Service" checked={paasSelections.windowsApp} onToggle={() => handlePaasChange('windowsApp')}>
                                        <div className="form-group"><label>App Name</label><input type="text" className="form-control" value={windowsAppConfig.appName} onChange={e => setWindowsAppConfig({ ...windowsAppConfig, appName: e.target.value })} /></div>
                                        <div className="form-group"><label>ASP Name</label><input type="text" className="form-control" value={windowsAppConfig.aspName} onChange={e => setWindowsAppConfig({ ...windowsAppConfig, aspName: e.target.value })} /></div>
                                        <div className="form-group"><label>SKU</label><select className="form-control" value={windowsAppConfig.sku} onChange={e => setWindowsAppConfig({ ...windowsAppConfig, sku: e.target.value })}><option value="F1">F1</option><option value="B1">B1</option><option value="S1">S1</option></select></div>
                                    </ServiceCard>
                                    <ServiceCard label="Function App + AI" checked={paasSelections.funcApp} onToggle={() => handlePaasChange('funcApp')}>
                                        <div className="form-group"><label>App Name</label><input type="text" className="form-control" value={funcAppConfig.appName} onChange={e => setFuncAppConfig({ ...funcAppConfig, appName: e.target.value })} /></div>
                                        <div className="form-group"><label>Storage Name</label><input type="text" className="form-control" value={funcAppConfig.storageName} onChange={e => setFuncAppConfig({ ...funcAppConfig, storageName: e.target.value })} /></div>
                                        <div className="form-check"><input className="form-check-input" type="checkbox" checked={funcAppConfig.createCosmos} onChange={e => setFuncAppConfig({ ...funcAppConfig, createCosmos: e.target.checked })} /><label>Create Cosmos DB</label></div>
                                        <div className="form-check"><input className="form-check-input" type="checkbox" checked={funcAppConfig.createOpenAI} onChange={e => setFuncAppConfig({ ...funcAppConfig, createOpenAI: e.target.checked })} /><label>Create OpenAI Service</label></div>
                                    </ServiceCard>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Database Panel */}
                <div className="col-lg-6 mb-4">
                    <div className="panel h-100">
                        <div className="panel-header">Databases</div>
                        <div className="panel-body">
                            <ServiceCard label="SQL Database" checked={dbSelections.sql} onToggle={() => handleDbChange('sql')}>
                                <div className="form-group"><label>Server Name</label><input type="text" className="form-control" value={sqlConfig.serverName} onChange={e => setSqlConfig({ ...sqlConfig, serverName: e.target.value })} /></div>
                                <div className="form-group"><label>Admin User</label><input type="text" className="form-control" value={sqlConfig.adminUser} onChange={e => setSqlConfig({ ...sqlConfig, adminUser: e.target.value })} /></div>
                                <div className="form-check"><input className="form-check-input" type="checkbox" checked={sqlConfig.createDb} onChange={e => setSqlConfig({ ...sqlConfig, createDb: e.target.checked })} /><label>Create DB</label></div>
                            </ServiceCard>
                            <ServiceCard label="PostgreSQL" checked={dbSelections.postgres} onToggle={() => handleDbChange('postgres')}>
                                <div className="form-group"><label>Server Name</label><input type="text" className="form-control" value={postgresConfig.serverName} onChange={e => setPostgresConfig({ ...postgresConfig, serverName: e.target.value })} /></div>
                                <div className="form-group"><label>SKU</label><select className="form-control" value={postgresConfig.sku} onChange={e => setPostgresConfig({ ...postgresConfig, sku: e.target.value })}><option value="B_Standard_B1ms">B1ms</option></select></div>
                                <div className="form-group"><label>DB Name</label><input type="text" className="form-control" value={postgresConfig.dbName} onChange={e => setPostgresConfig({ ...postgresConfig, dbName: e.target.value })} /></div>
                            </ServiceCard>
                            <ServiceCard label="Cosmos DB" checked={dbSelections.cosmos} onToggle={() => handleDbChange('cosmos')}>
                                <div className="form-group"><label>Account Name</label><input type="text" className="form-control" value={cosmosConfig.name} onChange={e => setCosmosConfig({ ...cosmosConfig, name: e.target.value })} /></div>
                                <div className="form-group"><label>API</label><select className="form-control" value={cosmosConfig.api} onChange={e => setCosmosConfig({ ...cosmosConfig, api: e.target.value })}><option value="GlobalDocumentDB">SQL</option><option value="MongoDB">MongoDB</option></select></div>
                            </ServiceCard>
                        </div>
                    </div>
                </div>

                {/* Security Panel */}
                <div className="col-lg-6 mb-4">
                    <div className="panel h-100">
                        <div className="panel-header">Security & Management</div>
                        <div className="panel-body">
                            <ServiceCard label="Key Vault" checked={secSelections.keyvault} onToggle={() => handleSecChange('keyvault')}>
                                <div className="form-group"><label>Name</label><input type="text" className="form-control" value={kvConfig.name} onChange={e => setKvConfig({ ...kvConfig, name: e.target.value })} /></div>
                                <div className="form-group"><label>SKU</label><select className="form-control" value={kvConfig.sku} onChange={e => setKvConfig({ ...kvConfig, sku: e.target.value })}><option value="standard">Standard</option><option value="premium">Premium</option></select></div>
                            </ServiceCard>
                            <ServiceCard label="AKS (Kubernetes)" checked={secSelections.aks} onToggle={() => handleSecChange('aks')}>
                                <div className="form-group"><label>Cluster Name</label><input type="text" className="form-control" value={aksConfig.name} onChange={e => setAksConfig({ ...aksConfig, name: e.target.value })} /></div>
                                <div className="form-group"><label>Environment</label><select className="form-control" value={aksConfig.environment} onChange={e => setAksConfig({ ...aksConfig, environment: e.target.value })}><option value="Dev">Dev</option><option value="Prod">Prod</option></select></div>
                                <div className="form-check"><input className="form-check-input" type="checkbox" checked={aksConfig.enableAutoScale} onChange={e => setAksConfig({ ...aksConfig, enableAutoScale: e.target.checked })} /><label>Auto-Scale</label></div>
                                <div className="form-check"><input className="form-check-input" type="checkbox" checked={aksConfig.enableMonitoring} onChange={e => setAksConfig({ ...aksConfig, enableMonitoring: e.target.checked })} /><label>Monitoring</label></div>
                            </ServiceCard>
                        </div>
                    </div>
                </div>

            </div>

            <div className="text-center mt-5 mb-5 pb-5">
                <button className="btn btn-success btn-lg" onClick={handleSaveConfig} style={{ padding: '15px 50px', fontSize: '1.2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    Download Configuration JSON
                </button>
            </div>
        </div>
    );
}

export default App;
