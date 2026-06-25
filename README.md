# YouTube Video Downloader

A modern, high-performance web application that allows you to easily download YouTube videos in various formats and qualities. Built with Next.js, React, and `yt-dlp`, this application solves the common issue of high-resolution YouTube videos downloading without audio by merging tracks on the server-side before sending them to the client.

## ✨ Features

- **Beautiful Modern UI:** Built with standard CSS to provide a rich, glassmorphism-inspired aesthetic with dark mode and smooth micro-animations.
- **1-Click Best Quality:** A dedicated button to instantly grab the absolute highest quality video available (up to 4K) and automatically merge it with the best audio track.
- **Auto-Merging:** For any video format that YouTube stores without an audio track (like standard 1080p or 1440p streams), the server automatically downloads both the video and audio tracks separately, merges them using `ffmpeg`, and delivers a perfect standard `.mp4` file directly to your browser.
- **Detailed Formats:** Lists all available qualities, file sizes, and containers (MP4, WEBM).
- **Fast Streaming:** Streams video files directly to your browser download manager using Next.js Edge APIs.

## 🛠️ Technology Stack

- **Frontend:** Next.js (App Router), React 19, Lucide React Icons
- **Backend:** Node.js, Next.js API Routes
- **Extraction & Merging:** `youtube-dl-exec` (yt-dlp interface), `ffmpeg-static`

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js installed on your machine.

### Installation

1. Clone or download this repository.
2. Open your terminal in the project folder and install the dependencies:
   ```bash
   npm install
   ```

### Running the App

Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 💡 How it works under the hood

YouTube utilizes DASH (Dynamic Adaptive Streaming over HTTP), meaning it stores high-quality video tracks (1080p+) entirely separate from audio tracks to save bandwidth.

When you attempt to download these qualities, traditional downloaders will give you a silent video. This app leverages `yt-dlp` and `ffmpeg` to securely intercept the separate video and audio streams, flawlessly mux them together into an MP4 container on the backend server, and pipe the finished product to you!
