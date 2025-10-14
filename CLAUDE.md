# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser extension (Manifest V3) that monitors LinkedIn job search URLs and sends notifications when new jobs are posted. The extension checks hourly for new job postings by comparing job IDs from the LinkedIn page.

## Architecture

The extension follows a standard Manifest V3 architecture with three main components:

1. **Service Worker** ([background.js](background.js))
   - Sets up hourly alarm via Chrome Alarms API
   - Manages job checking workflow: creates background tab → injects extraction script → compares job IDs → sends notifications
   - Stores seen job IDs in `chrome.storage.local` to track which jobs have been notified
   - Uses `chrome.scripting.executeScript()` to inject the `extractJobListings()` function into LinkedIn pages

2. **Popup UI** ([popup.html](popup.html) + [popup.js](popup.js))
   - Simple interface to configure the LinkedIn job search URL
   - "Check Now" button to trigger immediate check
   - Validates URL contains `linkedin.com/jobs/search`
   - Clears `seenJobIds` when a new URL is saved

3. **Content Script** ([content.js](content.js))
   - Currently minimal; logs when loaded on LinkedIn job search pages
   - The actual job extraction is done via injected function in background.js rather than this persistent content script

## Key Implementation Details

- **Job ID Extraction**: Uses `document.querySelectorAll('[data-job-id]')` to find job listings on LinkedIn pages
- **Timing**: 5-second wait after tab creation to allow LinkedIn page to load before extraction
- **Storage Schema**:
  - `monitorUrl`: The LinkedIn job search URL being monitored
  - `seenJobIds`: Array of job IDs that have already been notified
- **LinkedIn URL Pattern**: `https://www.linkedin.com/jobs/search/*`

## Testing

No automated test suite exists. To manually test:

1. Load extension in browser:
   - Chrome/Edge: `chrome://extensions/` → "Load unpacked"
   - Firefox: `about:debugging#/runtime/this-firefox` → "Load Temporary Add-on"
2. Click extension icon, paste LinkedIn job search URL, save
3. Click "Check Now" to trigger immediate check
4. Verify notification appears when new jobs are found

## Design Principle

Per [requirements.md](requirements.md): "Keep it simple. Do not add fancy features." This extension deliberately maintains minimal functionality focused on URL monitoring and notifications only.
