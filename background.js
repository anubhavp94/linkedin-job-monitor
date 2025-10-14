// Set up alarm when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Create an alarm that fires every hour
  chrome.alarms.create('jobMonitorAlarm', {
    periodInMinutes: 60
  });
  console.log('LinkedIn Job Monitor installed - alarm set for hourly checks');
});

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'jobMonitorAlarm') {
    checkForNewJobs();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startMonitoring') {
    // Optionally check immediately when user saves a new URL
    checkForNewJobs();
  }
});

// Listen for notification clicks
chrome.notifications.onClicked.addListener(async (notificationId) => {
  // Get the URL associated with this notification
  const storageKey = `notification_${notificationId}`;
  const data = await chrome.storage.local.get([storageKey]);
  const url = data[storageKey];

  if (url) {
    // Open the LinkedIn search URL in a new tab
    chrome.tabs.create({ url: url });

    // Clean up the stored notification URL
    chrome.storage.local.remove(storageKey);
  }

  // Clear the notification
  chrome.notifications.clear(notificationId);
});

// Create a simple icon data URL
function createIconDataUrl() {
  const canvas = new OffscreenCanvas(48, 48);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0077b5'; // LinkedIn blue
  ctx.fillRect(0, 0, 48, 48);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Li', 24, 24);
  return canvas.convertToBlob().then(blob => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  });
}

async function checkForNewJobs() {
  try {
    const data = await chrome.storage.local.get(['monitorUrl', 'seenJobs', 'seenJobIds']);

    if (!data.monitorUrl) {
      console.log('No URL configured for monitoring');
      return;
    }

    // Migrate old seenJobIds to seenJobs format if needed
    let seenJobs = data.seenJobs || [];
    if (!data.seenJobs && data.seenJobIds) {
      seenJobs = data.seenJobIds.map(id => ({ id, title: '', url: '' }));
    }

    const iconUrl = await createIconDataUrl();

    // Create a new tab to load the LinkedIn page
    const tab = await chrome.tabs.create({
      url: data.monitorUrl,
      active: false
    });

    // Wait for the page to load
    setTimeout(async () => {
      try {
        // Inject and execute content script to extract job listings
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: extractJobListings
        });

        const jobs = results[0]?.result || [];
        console.log(`Total jobs found on page: ${jobs.length}`);
        console.log(`Previously seen jobs: ${seenJobs.length}`);

        // Find new jobs
        const seenJobIds = seenJobs.map(job => job.id);
        const newJobs = jobs.filter(job => !seenJobIds.includes(job.id));
        console.log(`New jobs: ${newJobs.length}`);

        if (newJobs.length > 0) {
          // Update seen jobs
          const updatedSeenJobs = [...seenJobs, ...newJobs];
          await chrome.storage.local.set({ seenJobs: updatedSeenJobs });

          // Prepare notification message with job list (limit to 6 for readability)
          const maxItems = 6;
          const jobsToShow = newJobs.slice(0, maxItems);

          // Build message with job titles and companies
          let message = '';
          jobsToShow.forEach((job, index) => {
            message += `${index + 1}. ${job.title}\n   ${job.company}\n`;
          });

          if (newJobs.length > maxItems) {
            message += `\n...and ${newJobs.length - maxItems} more jobs`;
          }

          message += '\n\nClick to view all jobs on LinkedIn';

          console.log('Creating notification for', newJobs.length, 'jobs');

          // Send basic notification with job list in message
          const notificationId = await chrome.notifications.create({
            type: 'basic',
            iconUrl: iconUrl,
            title: `New LinkedIn Jobs Found! (${newJobs.length})`,
            message: message,
            requireInteraction: false
          });

          // Store the notification URL mapping
          await chrome.storage.local.set({
            [`notification_${notificationId}`]: data.monitorUrl
          });

          console.log(`Found ${newJobs.length} new jobs`);
        } else {
          console.log('No new jobs found');
          // Send notification even when no new jobs (for testing/confirmation)
          chrome.notifications.create({
            type: 'basic',
            iconUrl: iconUrl,
            title: 'LinkedIn Job Check Complete',
            message: `Checked ${jobs.length} jobs - no new postings since last check`
          }, (notificationId) => {
            if (chrome.runtime.lastError) {
              console.error('Notification error:', chrome.runtime.lastError);
            } else {
              console.log('Notification created:', notificationId);
            }
          });
        }

        // Close the tab
        chrome.tabs.remove(tab.id);
      } catch (error) {
        console.error('Error processing jobs:', error);
        chrome.tabs.remove(tab.id);
      }
    }, 5000); // Wait 5 seconds for page to load
  } catch (error) {
    console.error('Error checking for new jobs:', error);
  }
}

// Function to be injected into the page
function extractJobListings() {
  const jobElements = document.querySelectorAll('[data-job-id]');
  const jobs = Array.from(jobElements).map(el => {
    const jobId = el.getAttribute('data-job-id');

    // Extract job title - try multiple selectors
    let title = 'Untitled Job';
    const titleElement = el.querySelector('.job-card-list__title, .job-card-container__link, h3, .artdeco-entity-lockup__title');
    if (titleElement) {
      // Get only the direct text content, excluding child elements
      const strongElement = titleElement.querySelector('strong');
      if (strongElement) {
        title = strongElement.textContent.trim();
      } else {
        title = titleElement.textContent.trim();
      }
      // Clean up extra whitespace
      title = title.replace(/\s+/g, ' ').trim();
    }

    // Extract company name
    let company = 'Unknown Company';
    const companyElement = el.querySelector('.job-card-container__primary-description, .job-card-container__company-name, .artdeco-entity-lockup__subtitle');
    if (companyElement) {
      company = companyElement.textContent.trim().replace(/\s+/g, ' ').trim();
    }

    // Construct job URL
    const url = `https://www.linkedin.com/jobs/view/${jobId}/`;

    return { id: jobId, title, company, url };
  });

  return jobs;
}
