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
