export const msalConfig = {
    auth: {
        clientId: localStorage.getItem("azureClientId") || "YOUR_CLIENT_ID_HERE",
        authority: "https://login.microsoftonline.com/" + (localStorage.getItem("azureTenantId") || "common"),
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    }
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest = {
    scopes: ["User.Read", "https://management.azure.com/user_impersonation"]
};
