# End-to-End Testing Guide

## Pre-Test Validation ✅

All automated checks have passed:
- ✅ manifest.json is valid JSON
- ✅ All icon files (16x16, 48x48, 128x128) exist and are valid PNGs
- ✅ All JavaScript files have valid syntax
- ✅ All required files present

## Manual Testing Steps

### 1. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" toggle (top right)
3. Click "Load unpacked"
4. Select the `linkedin-job-monitor` folder
5. **Expected**: Extension appears in the list with name "LinkedIn Job Monitor" v1.0.0

### 2. Verify Installation

1. Look for the extension icon in the Chrome toolbar
2. Check for no error messages on the extension card
3. **Expected**: Extension icon visible, no errors shown

### 3. Configure URL

1. Click the extension icon in the toolbar
2. Popup should open with:
   - Input field for URL
   - "Save URL" button
   - "Check Now" button
3. Paste this test URL:
   ```
   https://www.linkedin.com/jobs/search/?currentJobId=4314608036&f_E=4&f_TPR=r3600&geoId=105214831&keywords=product%20manager&origin=JOB_SEARCH_PAGE_JOB_FILTER&refresh=true
   ```
4. Click "Save URL"
5. **Expected**:
   - Success message: "URL saved successfully! Monitoring will start within an hour."
   - "Currently monitoring: [URL]" appears below the input

### 4. Test Immediate Check

1. Click "Check Now" button
2. **Expected**:
   - Button shows "Checking for new jobs..."
   - Button becomes disabled temporarily
   - After ~7-10 seconds: Message "Check initiated! You will receive a notification if new jobs are found."
   - A new Chrome tab briefly opens to LinkedIn (may be visible in background)
   - Tab automatically closes
   - Browser notification appears with title "New LinkedIn Jobs Found!" and count of new jobs

### 5. Verify Background Service Worker

1. On `chrome://extensions/` page, find the extension
2. Click "Service worker" link (or "Inspect views service worker")
3. **Expected**: DevTools opens showing the background service worker
4. In Console tab, you should see:
   ```
   LinkedIn Job Monitor installed - alarm set for hourly checks
   ```

### 6. Verify Alarm Configuration

1. In the Service Worker DevTools console, run:
   ```javascript
   chrome.alarms.getAll().then(console.log)
   ```
2. **Expected**: Output shows alarm named `jobMonitorAlarm` with `periodInMinutes: 60`

### 7. Verify Storage

1. In the Service Worker DevTools console, run:
   ```javascript
   chrome.storage.local.get(null).then(console.log)
   ```
2. **Expected**: Output shows:
   - `monitorUrl`: Your saved LinkedIn URL
   - `seenJobIds`: Array of job IDs (empty on first run, populated after first check)

### 8. Test URL Validation

1. Click extension icon again
2. Try saving an invalid URL like `https://google.com`
3. **Expected**: Error message "Please enter a valid LinkedIn job search URL"

### 9. Test Second Check (No New Jobs)

1. Wait 5 seconds after first check
2. Click "Check Now" again
3. **Expected**:
   - No notification this time (since jobs are already in `seenJobIds`)
   - In Service Worker console: "No new jobs found"

### 10. Test URL Change (Reset State)

1. Click extension icon
2. Paste a different LinkedIn job search URL
3. Click "Save URL"
4. **Expected**:
   - `seenJobIds` is cleared (check via storage console command)
   - Next "Check Now" will treat all jobs as new

## Common Issues & Troubleshooting

### Extension Won't Load
- Ensure all files are in the same directory
- Check DevTools console for errors
- Verify manifest.json has no syntax errors

### No Notification Appears
- Check Chrome notification permissions are enabled
- Verify LinkedIn page actually has jobs (URL might be too specific)
- Check Service Worker console for error messages

### "Check Now" Does Nothing
- Check Service Worker is running (not "inactive")
- Open Service Worker DevTools to see error messages
- Verify LinkedIn didn't change their HTML structure (job elements still have `data-job-id` attribute)

### Hourly Alarm Not Working
- Verify alarm exists: `chrome.alarms.getAll().then(console.log)`
- Service workers can be terminated by Chrome; alarm should restart it
- Check Chrome didn't disable the extension due to errors

## Test Results

Date: ________________

| Test Step | Pass/Fail | Notes |
|-----------|-----------|-------|
| Extension Loads | ☐ | |
| Popup Opens | ☐ | |
| URL Saves | ☐ | |
| Check Now Works | ☐ | |
| Notification Appears | ☐ | |
| Alarm Configured | ☐ | |
| Storage Works | ☐ | |
| URL Validation | ☐ | |
| Second Check (No Dupes) | ☐ | |
| URL Change Resets | ☐ | |

## Notes

- LinkedIn rate-limiting: Too many automated checks may trigger LinkedIn's bot detection
- The extension opens a real browser tab to LinkedIn, which may affect your LinkedIn session
- Job IDs persist in storage until URL is changed - clearing extension storage will reset state
