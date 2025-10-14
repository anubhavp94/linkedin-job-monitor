// This script runs on LinkedIn job search pages
// It can be used for additional functionality if needed

console.log('LinkedIn Job Monitor content script loaded');

// Listen for messages from background script if needed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractJobs') {
    const jobElements = document.querySelectorAll('[data-job-id]');
    const jobIds = Array.from(jobElements).map(el => el.getAttribute('data-job-id'));
    sendResponse({ jobIds });
  }
});
