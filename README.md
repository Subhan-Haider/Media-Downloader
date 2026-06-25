# Ultimate Media Downloader

A modern, high-performance web application that allows you to easily download media from **YouTube**, **Instagram**, and **TikTok**. Built with Next.js, React, and `yt-dlp`, this application features a beautiful UI, a background download queue, and a persistent media library.

## ✨ Features

- **Multi-Platform Support:** Download videos, audio, and images from YouTube, Instagram (Posts & Reels), and TikTok.
- **Background Queue System:** Don't wait for large files! Add videos to the queue and let the server download them in the background. You can track progress in real-time.
- **Media Library:** All your downloaded files are saved to the server and organized in a beautiful Library gallery for easy viewing, playing, and redownloading.
- **Best Quality Auto-Merging:** Automatically grabs the absolute highest quality video available (up to 4K) and merges it with the best audio track using `ffmpeg`.
- **Bypass Instagram Login Walls:** Built-in support for Netscape cookies (`cookies.txt`) to download private or restricted Instagram media securely.
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

### 3. Setting Up Instagram Authentication (Important!)
Instagram aggressively blocks automated downloads. To download private or age-restricted Instagram media, you must provide your browser cookies to the application.
*(Note: Public Instagram images use a special embed workaround and may not require cookies, but for video Reels, cookies are highly recommended).*

1. Install a browser extension like **"Get cookies.txt LOCALLY"** on Chrome/Firefox.
2. Log into your Instagram account on your browser.
3. Click the extension and export the cookies for `instagram.com` in Netscape format.
4. Save the exported file exactly as:
   `data/instagram_cookies.txt`
   *(This folder is ignored by git, so your private session will never be uploaded to GitHub).*

### 4. Running the App
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
- `data/` - Secure storage for the `db.json` database, your `instagram_cookies.txt`, and the `/library/` where all downloaded MP4s are saved.

## 🛠️ Technology Stack
- **Frontend:** Next.js (App Router), React 19, Lucide React Icons
- **Backend:** Node.js, Next.js API Routes, Local JSON Database
- **Extraction & Merging:** `youtube-dl-exec` (yt-dlp interface), `ffmpeg-static`, `instaloader` (Python)
