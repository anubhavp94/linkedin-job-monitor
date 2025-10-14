# LinkedIn Job Monitor

A simple browser extension that monitors LinkedIn job search URLs and sends notifications when new jobs are posted.

## Features

- Monitor any LinkedIn job search URL
- Automatic hourly checks for new job postings
- Browser notifications for new jobs
- Simple configuration interface

## Installation

### Chrome/Edge

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `linkedin-job-monitor` folder

### Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select the `manifest.json` file from the `linkedin-job-monitor` folder

## Usage

1. Click on the extension icon in your browser toolbar
2. Paste your LinkedIn job search URL into the input field
3. Click "Save URL"
4. The extension will check for new jobs every hour and send notifications

## Note on Icons

The extension requires icon files (icon16.png, icon48.png, icon128.png). You can:
- Create simple icons using any image editor
- Use a placeholder icon service
- Download free icons from icon libraries

For now, the extension will work but show default browser icons until you add custom icons.

## How It Works

- Uses Chrome Alarms API to schedule hourly checks
- Opens LinkedIn job search page in background
- Extracts job IDs from the page
- Compares with previously seen jobs
- Sends notification if new jobs are found
