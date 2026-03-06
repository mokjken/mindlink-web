# 🛠️ How to Runi MindLink on Another Computer

Follow these steps to set up the **MindLink** project (Frontend + Backend) on a new machine.

## 1. Prerequisites
Ensure you have **Node.js** installed on your computer.
- **Download:** [nodejs.org](https://nodejs.org/) (Recommended: LTS version, v18 or higher).
- Verify installation by running: `node -v` and `npm -v` in your terminal.

## 2. Copy/Clone the Project
Copy the entire `MindLink` folder to the new computer.

## 3. Install Dependencies (Critical Step!)
This project has a **Frontend** (React) and a **Backend** (Express). You must install dependencies for **BOTH**.

### Step A: Install Root Dependencies (Frontend & Tools)
Open your terminal in the `MindLink` folder and run:
```bash
npm install
```

### Step B: Install Backend Dependencies
Navigate to the backend folder and install its specific packages:
```bash
cd backend
npm install
```
*(After this finishes, you can go back to the root folder: `cd ..`)*

## 4. Environment Setup (Optional)
The core features (Mood Tracking, Dashboard, 3D Map) run locally with SQLite and do not require an API Key.
However, if you plan to use Generative AI features (Gemini), create a file named `.env` in the root folder and add:
```
GEMINI_API_KEY=your_api_key_here
```

## 5. Run the Project 🚀
From the **root** `MindLink` folder, run:
```bash
npm run dev
```
This command uses `concurrently` to start both:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 6. Common Issues & Troubleshooting

### 🔴 Error: `localhost refused to connect`
- Wait a few seconds! The server takes a moment to start.
- Check the terminal output. If you see errors, make sure you ran `npm install` in **both** folders (Step 3).

### 🔴 Error: `EADDRINUSE: address already in use :::3001`
This means the backend port is stuck (often if the server didn't close properly previously).
**Fix:**
run this command in your terminal to kill the zombie process:
```bash
lsof -t -i:3001 | xargs kill -9
```
Then try `npm run dev` again.

### 🔴 Backend Database
The project uses **SQLite**. A file named `mindlink.db` will automatically be created in the `backend/` folder when you first run the server. You don't need to install any database software manually.
