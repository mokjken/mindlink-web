# 🚀 MindLink Deployment Guide (macOS)

This guide covers how to set up, run, and deploy the entire MindLink platform (Frontend + Backend) to **Cloudflare** using a Mac.

## 🛠 Prerequisites

1.  **Node.js**: Ensure you have Node.js installed (v18 or later).
    ```bash
    node -v
    ```
2.  **Cloudflare Account**: [Sign up here](https://dash.cloudflare.com/sign-up).
3.  **Wrangler CLI**: Cloudflare's command-line tool.
    ```bash
    npm install -g wrangler
    wrangler login
    ```
    *A browser window will open; log in to authorize.*

---

## 💻 Part 1: Local Development (Running locally)

We now have two parts:
1.  **Frontend**: The React App (in the root folder).
2.  **Backend**: The Cloudflare Worker (in `worker/` folder).

### Step 1: Setup Backend (Worker + Database)

1.  **Open Terminal** and navigate to the project:
    ```bash
    cd /path/to/MindLink/worker
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Create Local Database (D1)**:
    Initialize the local database with our schema.
    ```bash
    npx wrangler d1 execute mindlink-db --local --file=./schema.sql
    ```
    *(Select "Yes" to create the database if prompted)*

4.  **Start the Backend**:
    ```bash
    npm run dev
    # OR
    npx wrangler dev
    ```
    ✅ Server is now running at `http://localhost:8787`

### Step 2: Setup Frontend

1.  **Open a New Terminal Tab** (Cmd+T).
2.  Navigate to the root project folder:
    ```bash
    cd /path/to/MindLink
    ```
3.  **Start the Frontend**:
    ```bash
    npm run dev
    ```
    ✅ Frontend is running at `http://localhost:5173` (or similar).
    *It is already configured to talk to `http://localhost:8787`.*

---

## ☁️ Part 2: Go Live! (Deploy to Cloudflare)

### Step 1: Deploy Backend (Worker)

1.  **Create Production Database**:
    ```bash
    cd worker
    npx wrangler d1 create mindlink-db
    ```
    *Copy the `database_id` output from this command!*

2.  **Update Config**:
    Open `worker/wrangler.toml` and paste the `database_id` you just got:
    ```toml
    [[d1_databases]]
    binding = "DB"
    database_name = "mindlink-db"
    database_id = "PASTE_YOUR_ID_HERE"
    ```

3.  **Initialize Production Schema**:
    ```bash
    npx wrangler d1 execute mindlink-db --remote --file=./schema.sql
    ```

4.  **Deploy**:
    ```bash
    npx wrangler deploy
    ```
    🎉 **Success!** You will get a URL like `https://mindlink-backend.your-name.workers.dev`.
    **Copy this URL.**

### Step 2: Connect Frontend to Production Backend

1.  Open `services/api.ts` in the root folder.
2.  Change the `WORKER_URL` to your real backend URL:
    ```typescript
    // services/api.ts
    // const WORKER_URL = 'http://localhost:8787/api'; // Local
    const WORKER_URL = 'https://mindlink-backend.your-name.workers.dev/api'; // Production
    ```

### Step 3: Deploy Frontend (Pages)

1.  **Build the Frontend**:
    In the root folder:
    ```bash
    npm run build
    ```
    *This creates a `dist/` folder.*

2.  **Deploy to Cloudflare Pages**:
    ```bash
    npx wrangler pages deploy dist --project-name mindlink-web
    ```
    *It will ask to create a new project. Select "Yes" and "Create a new project".*

🎉 **Congratulations! Your App is Live.**
Cloudflare will give you a URL (e.g., `https://mindlink-web.pages.dev`).


---

## 🌐 Part 3: Custom Domains (Optional)

If you own a domain (e.g., `mindlink.com`), you can use it instead of `.pages.dev` or `.workers.dev`.

### 1. Frontend Domain (Pages)
1.  Go to **Cloudflare Dashboard** > **Workers & Pages**.
2.  Click your **MindLink Web** project.
3.  Go to **Custom Domains** tab.
4.  Click **Set up a Custom Domain**.
5.  Enter your domain (e.g., `app.mindlink.com`).
6.  Cloudflare will automatically configure the DNS for you.

### 2. Backend Domain (Worker)
*Only needed if you want a pretty API URL like `api.mindlink.com`.*
1.  Go to **Cloudflare Dashboard** > **Workers & Pages**.
2.  Click your **mindlink-backend** worker.
3.  Go to **Settings** > **Triggers**.
4.  Scroll to **Custom Domains**.
5.  Click **Add Custom Domain** and enter e.g., `api.mindlink.com`.

**Important:** If you add a custom domain to the backend, remember to update `WORKER_URL` in `services/api.ts` and re-deploy the frontend!
