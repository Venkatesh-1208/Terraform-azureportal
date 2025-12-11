# Azure Resource Deployment Portal

This project contains two versions of the deployment portal:

## 1. Modern App (Recommended)
**Features:** Azure AD Authentication, Real Subscription Fetching, Vite Build System.
**Location:** The source code is in the `frontend/` folder.

### How to Run
This version **cannot** be opened directly in the browser due to security features (ES Modules). You must run a local server:

1.  Open a terminal in the `frontend` directory.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open the link shown (e.g., `http://localhost:5173`).

> **⚠️ Troubleshooting: 'npm' is not recognized**
> If you see this error, it means **Node.js is not installed** on your computer.
> - **Solution A:** Install Node.js from [nodejs.org](https://nodejs.org/).
> - **Solution B:** Use the **Legacy App** (below) which requires no installation.

---

## 2. Legacy App (Backup)
**Features:** Static HTML, Mock Data only (No Login).
**Location:** `frontend/index.backup.html`

### How to Run
Simply double-click `frontend/index.backup.html` to open it in your browser.

---

## 3. Docker Support (Optional)
If you prefer to run this as a container:
1.  Build the image:
    ```bash
    cd frontend
    docker build -t azure-portal-v2 .
    ```
2.  Run the container:
    ```bash
    docker run -p 3000:3000 azure-portal-v2
    ```

## 4. GitHub Actions Configuration
To use the pipelines, set these **Repository Secrets** in GitHub:

| Secret | Description |
|--------|-------------|
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Download from Azure Portal (Web App -> Overview -> Get publish profile) |
| `REGISTRY_USERNAME` | (Docker Only) Docker Hub or ACR Username |
| `REGISTRY_PASSWORD` | (Docker Only) Docker Hub or ACR Password | 

*   **Standard Deploy:** Pushes to `main` trigger `azure-webapp.yml` (Code Deploy).
*   **Docker Deploy:** Manually trigger `azure-docker.yml` or configure branches as needed.
