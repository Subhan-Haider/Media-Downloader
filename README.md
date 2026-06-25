# Ultimate Media Downloader

A modern, high-performance web application that allows you to easily download media from **YouTube**, **Instagram**, and **TikTok**. Built with Next.js, React, and `yt-dlp`, this application features a beautiful UI, a background download queue, and a persistent media library.

## ✨ Features

- **Multi-Platform Support:** Download videos, audio, and images from YouTube, Instagram (Posts & Reels), and TikTok.
- **Background Queue System:** Don't wait for large files! Add videos to the queue and let the server download them in the background. You can track progress in real-time.
- **Media Library:** All your downloaded files are saved to the server and organized in a beautiful Library gallery for easy viewing, playing, and redownloading.
- **Best Quality Auto-Merging:** Automatically grabs the absolute highest quality video available (up to 4K) and merges it with the best audio track using `ffmpeg`.
- **Beautiful Modern UI:** Glassmorphism-inspired aesthetic with dark mode and smooth micro-animations.

---

## 🚀 Getting Started & Setup Guide

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.
You must also have **Python (3.7+)** installed on your system to use the advanced Instagram image scraper.

### 2. Installation
Clone or download this repository, then open your terminal in the project folder and install the Node and Python dependencies:
```bash
npm install
pip install instaloader
```

### 3. Running the App
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to start downloading!

---

## 📂 Project Structure

- `src/app/page.tsx` - The main downloader interface.
- `src/app/queue/page.tsx` - The background download queue monitor.
- `src/app/library/page.tsx` - Your personal gallery of downloaded media.
- `src/app/api/queue/route.ts` - The backend engine handling yt-dlp, format selection, and ffmpeg merging.
- `data/` - Secure storage for the `db.json` database and the `/library/` where all downloaded media is saved.

## 🛠️ Technology Stack
- **Frontend:** Next.js (App Router), React 19, Lucide React Icons
- **Backend:** Node.js, Next.js API Routes, Local JSON Database
- **Extraction & Merging:** `youtube-dl-exec` (yt-dlp interface), `ffmpeg-static`, `instaloader` (Python)
