# 🛸 Nexa Bridge: Public Deployment Guide (Beginner Friendly)

This guide will help you take the Nexa AI Bridge live on the public internet using **Vercel**. We have already prepared the code for you—now you just need to follow these simple dashboard steps.

---

### 📦 Prerequisites

1.  **A GitHub Repository**: Make sure your latest code is pushed to a repository on GitHub (e.g., `github.com/yourname/Nexa`).
2.  **A Vercel Account**: Sign up for free at [vercel.com](https://vercel.com) using your GitHub account.

---

### 🚀 Step 1: Import Your Project

1.  Log in to the **Vercel Dashboard**.
2.  Click the **"Add New..."** button and select **"Project"**.
3.  Find your `Nexa` repository in the list and click **"Import"**.

---

### ⚙️ Step 2: Configure Monorepo Settings

Vercel will ask you about your project settings. Since we have a frontend and a backend, use these values:

*   **Framework Preset**: Select `Vite`.
*   **Root Directory**: Leave as `.` (the root of the project).
*   **Build command**: `cd auditgen-core && npm install && npm run build`
*   **Output directory**: `auditgen-core/dist`
*   **Install command**: `npm install`

---

### 🔑 Step 3: Set Environment Variables

This is the **most important step**. You need to add the variables from your `.env` file to Vercel so the bridge can talk to Stellar and GenLayer.

In the **"Environment Variables"** section of the Vercel setup, add these one by one:

| Name | Value |
| :--- | :--- |
| `STELLAR_SECRET_KEY` | *Your Bridge Secret Key* |
| `STELLAR_PUBLIC_KEY` | *Your Bridge Public Key* |
| `GENLAYER_PRIVATE_KEY` | *Your GenLayer Private Key* |
| `GENLAYER_CONTRACT_ADDRESS` | `0x9CE0d2626753e4C7729C70feeB41eAaB8Ecc189b` |
| `GENLAYER_RPC_URL` | `https://studio.genlayer.com/api` |
| `VITE_API_URL` | *Leave empty for now, Vercel will set it automatically* |

> [!TIP]
> After you deploy for the first time, Vercel will give you a URL (like `nexa-bridge.vercel.app`). You should then add `VITE_API_URL` pointing to that address to ensure the frontend can find the backend.

---

### 🏗️ Step 4: Deploy!

Click **"Deploy"**. Vercel will now:
1.  Install all your dependencies.
2.  Build your premium React frontend.
3.  Set up your Express server as a "Serverless Function."

Once finished, you'll see a **"Congratulations!"** screen with a screenshot of your live site.

---

### 🏁 Final Verification

1.  Open your new `.vercel.app` URL.
2.  Try running an audit.
3.  Check the **"Logs"** tab in the Vercel dashboard to see the AI validators reaching consensus in real-time!

---

### 🛠️ Troubleshooting for Newbies

*   **"Payment Rejected"**: Ensure you have funded your Bridge account (`STELLAR_PUBLIC_KEY`) with some XLM for gas sponsorship.
*   **"Consensus Failed"**: Check if the GenLayer testnet is currently active at `studio.genlayer.com`.

**You are now officially live! 🌍🚀**
