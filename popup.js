document.addEventListener('DOMContentLoaded', async () => {
  const jobUrlInput = document.getElementById('jobUrl');
  const saveBtn = document.getElementById('saveBtn');
  const checkNowBtn = document.getElementById('checkNowBtn');
  const statusDiv = document.getElementById('status');
  const currentUrlP = document.getElementById('currentUrl');

  // Telegram elements
  const telegramBotTokenInput = document.getElementById('telegramBotToken');
  const telegramChatIdInput = document.getElementById('telegramChatId');
  const saveTelegramBtn = document.getElementById('saveTelegramBtn');
  const telegramStatusDiv = document.getElementById('telegramStatus');

  // Load saved URL
  const data = await chrome.storage.local.get(['monitorUrl', 'telegramBotToken', 'telegramChatId']);
  if (data.monitorUrl) {
    jobUrlInput.value = data.monitorUrl;
    currentUrlP.textContent = `Currently monitoring: ${data.monitorUrl}`;
  }

  // Load saved Telegram settings
  if (data.telegramBotToken) {
    telegramBotTokenInput.value = data.telegramBotToken;
  }
  if (data.telegramChatId) {
    telegramChatIdInput.value = data.telegramChatId;
  }

  // Check Now button handler
  checkNowBtn.addEventListener('click', async () => {
    const data = await chrome.storage.local.get(['monitorUrl']);

    if (!data.monitorUrl) {
      showStatus('Please save a URL first', 'error');
      return;
    }

    showStatus('Checking for new jobs...', 'info');
    checkNowBtn.disabled = true;

    try {
      chrome.runtime.sendMessage({ action: 'startMonitoring' });

      // Re-enable button after a few seconds
      setTimeout(() => {
        checkNowBtn.disabled = false;
        showStatus('Check initiated! You will receive a notification if new jobs are found.', 'success');
      }, 2000);
    } catch (error) {
      checkNowBtn.disabled = false;
      showStatus('Error: ' + error.message, 'error');
    }
  });

  // Save URL when button is clicked
  saveBtn.addEventListener('click', async () => {
    const url = jobUrlInput.value.trim();

    if (!url) {
      showStatus('Please enter a URL', 'error');
      return;
    }

    if (!url.includes('linkedin.com/jobs/search')) {
      showStatus('Please enter a valid LinkedIn job search URL', 'error');
      return;
    }

    try {
      // Save URL and clear previous jobs
      await chrome.storage.local.set({
        monitorUrl: url,
        seenJobs: []
      });

      currentUrlP.textContent = `Currently monitoring: ${url}`;
      showStatus('URL saved successfully! Monitoring will start within an hour.', 'success');

      // Send message to background script to start monitoring
      chrome.runtime.sendMessage({ action: 'startMonitoring' });
    } catch (error) {
      showStatus('Error saving URL: ' + error.message, 'error');
    }
  });

  // Save Telegram settings
  saveTelegramBtn.addEventListener('click', async () => {
    const botToken = telegramBotTokenInput.value.trim();
    const chatId = telegramChatIdInput.value.trim();

    if (!botToken || !chatId) {
      showTelegramStatus('Please enter both Bot Token and Chat ID', 'error');
      return;
    }

    try {
      await chrome.storage.local.set({
        telegramBotToken: botToken,
        telegramChatId: chatId
      });

      showTelegramStatus('Telegram settings saved successfully!', 'success');
    } catch (error) {
      showTelegramStatus('Error saving Telegram settings: ' + error.message, 'error');
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 3000);
  }

  function showTelegramStatus(message, type) {
    telegramStatusDiv.textContent = message;
    telegramStatusDiv.className = `status ${type}`;
    setTimeout(() => {
      telegramStatusDiv.textContent = '';
      telegramStatusDiv.className = 'status';
    }, 3000);
  }
});
