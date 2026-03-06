# MindLink 🌐
*[English](#english) | [中文](#chinese)*

<a name="english"></a>
## 🌟 Overview
**MindLink** is a lightweight, real-time student emotion and mental health tracking platform designed for K-12 educational environments. It empowers students to effortlessly log their daily emotional states and locations, while providing teachers and administrators with powerful data visualization and AI-driven insights to proactively address mental health concerns.

This project was created for the **CTB (China Thinks Big) 2025-2026** competition.

## ✨ Key Features
- **Student Playground**: An interactive, physics-based "Mood Cloud" where students can quickly tap to record their feelings (Positive, Calm, Anxious, Negative).
- **Teacher Dashboard**: Real-time radar charts and emotional trend analysis for specific classes.
- **Admin Heatmap**: A 3D-styled campus map showing real-time emotional hotspots and high-risk alerts across the entire school.
- **AI Advice Engine**: Powered by Google Gemini, offering automated, data-driven psychological intervention suggestions based on recent mood trends.
- **Community Feed**: A school-wide anonymous "Emotion Square" where students can see peer statuses, fostering a sense of shared experience.
- **Mobile First**: Fully responsive design with an app-like bottom navigation experience on iOS and Android.

## 🛠️ Tech Stack & Architecture
MindLink is designed to be completely **Serverless**, meaning zero server maintenance, infinite scaling, and practically free hosting via Cloudflare.

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS (Vanilla CSS for themes), Framer Motion (Animations), Recharts (Data Viz)
- **Backend (Serverless API)**: Hono.js running on **Cloudflare Workers**
- **Database**: **Cloudflare D1** (Serverless SQLite)
- **AI Integration**: Google Gemini 1.5 API (Native HTTP integration within Cloudflare Worker)
- **Deployment**: **Cloudflare Pages** (Frontend) + **Cloudflare Workers** (API)

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js (v18+)
- Cloudflare [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed globally (`npm install -g wrangler`)

### 2. Backend Setup
```bash
cd worker
npm install
# Initialize local SQLite database
npx wrangler d1 execute mindlink-db --local --file=./schema.sql
# Start the local API server
npm run dev
```

### 3. Frontend Setup
```bash
# In a separate terminal, from the project root
npm install
# Start the Vite dev server
npm run dev
```
Access the app at `http://localhost:3000`. It will automatically connect to the local Cloudflare Worker.

## ☁️ Deployment
Check out the detailed [Deployment Guide (DEPLOY.md)](./DEPLOY.md) to launch the entire stack globally in minutes using Cloudflare.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
<a name="chinese"></a>

## 🌟 项目简介 (Overview)
**MindLink** 是一个专为中小学校园设计的轻量级、实时的学生情绪与心理健康追踪平台。它让学生能以最轻松的方式记录每天的情绪状态，同时为教师和心理辅导员提供强大的数据可视化看板与 AI 建议，帮助学校变被动干预为主动预防。

本项目为 **CTB (China Thinks Big) 2025-2026** 参赛作品。

## ✨ 核心功能
- **学生端互动广场**：基于物理引擎的“情绪云”界面，长按泡泡即可秒速打卡情绪与位置。
- **教师端数据看板**：实时雷达图和情绪趋势线，掌握所带班级的整体心理健康状况。
- **管理端全校热力图**：3D拟物风格的校园热力图，全局监控高危情绪频发区域（如某些特定地点或宿舍）。
- **AI 对策引擎**：接入 Google Gemini 大模型，系统自动分析近期情绪趋势，并一键生成专业的心理辅导建议。
- **校园情绪广场**：类似朋友圈的匿名“动态墙”，展示全校同学当下的状态与感受（如“专注中”、“正在补觉”），打破情绪孤岛。
- **移动端深度适配**：完美适配 iPhone/Android，底部导航栏设计，媲美原生 App 的沉浸式体验。

## 🛠️ 技术栈与架构
MindLink 采用前沿的 **Serverless（无服务器）架构** 构建，免去了所有服务器购买与运维烦恼，支持高并发且几乎零成本。

- **前端界面**：React 18 + TypeScript + Vite + TailwindCSS + Framer Motion (动画) + Recharts (图表)
- **后端 API**：Hono.js 框架，运行在边缘计算平台 **Cloudflare Workers**
- **数据库**：**Cloudflare D1** (Serverless SQLite)
- **AI 赋能**：Google Gemini 1.5 
- **生产部署**：**Cloudflare Pages** 托管前端，全球 CDN 加速

## 🚀 本地开发快速启动

### 1. 环境准备
- Node.js (v18+)
- 全局安装 Cloudflare [Wrangler 命令行工具](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm install -g wrangler`)

### 2. 启动本地后端
```bash
cd worker
npm install
# 初始化本地 SQLite 数据库表结构
npx wrangler d1 execute mindlink-db --local --file=./schema.sql
# 启动本地 API 节点
npm run dev
```

### 3. 启动前端
```bash
# 在项目根目录下，新开一个终端窗口
npm install
# 启动 Vite 本地服务器
npm run dev
```
打开浏览器访问 `http://localhost:3000` 即可体验。前端会自动连接本地运行的 Worker 接口。

## ☁️ 一键上线部署
请参考完整的 [部署指南 (DEPLOY.md)](./DEPLOY.md)，仅需几行命令即可在全球免费上线你的专属 MindLink 服务。

## 📄 开源协议
本项目采用 MIT 开源协议 - 详情请查看 [LICENSE](LICENSE) 文件。
