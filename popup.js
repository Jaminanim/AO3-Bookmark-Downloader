// Get DOM elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusDetails = document.getElementById('statusDetails');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const phaseIndicator = document.getElementById('phaseIndicator');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const notOnBookmarks = document.getElementById('notOnBookmarks');
const mainContent = document.getElementById('mainContent');

// Check if on bookmarks page
async function checkCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isBookmarksPage = tab.url && tab.url.includes('archiveofourown.org') && 
                         (tab.url.includes('/bookmarks') || tab.url.includes('/users/') && tab.url.includes('/bookmarks'));
  
  if (!isBookmarksPage) {
    notOnBookmarks.style.display = 'block';
    mainContent.style.display = 'none';
    return false;
  }
  
  notOnBookmarks.style.display = 'none';
  mainContent.style.display = 'block';
  return true;
}

// Update UI based on current state
async function updateUI() {
  const state = await chrome.storage.local.get(['isRunning', 'status', 'progress', 'phase']);
  
  if (state.isRunning) {
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    startBtn.disabled = true;
    progressBar.style.display = 'block';
    phaseIndicator.style.display = 'block';
    
    // Disable format options during download
    document.querySelectorAll('input[name="format"]').forEach(input => {
      input.disabled = true;
    });
  } else {
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    startBtn.disabled = false;
    
    // Enable format options
    document.querySelectorAll('input[name="format"]').forEach(input => {
      input.disabled = false;
    });
  }
  
  if (state.status) {
    statusDetails.innerHTML = state.status;
  }
  
  if (state.progress !== undefined) {
    const percentage = Math.round(state.progress);
    progressFill.style.width = `${percentage}%`;
    progressFill.textContent = `${percentage}%`;
  }
  
  if (state.phase) {
    phaseIndicator.textContent = `Phase ${state.phase}: ${state.phase === 1 ? 'Collecting bookmarks' : 'Downloading works'}`;
  }
}

// Start download process
startBtn.addEventListener('click', async () => {
  const isValid = await checkCurrentTab();
  if (!isValid) return;
  
  const format = document.querySelector('input[name="format"]:checked').value;
  
  // Clear previous messages
  errorMessage.style.display = 'none';
  successMessage.style.display = 'none';
  
  // Send message to background script
  chrome.runtime.sendMessage({ 
    action: 'startDownload', 
    format: format 
  });
  
  // Update UI
  await chrome.storage.local.set({ isRunning: true });
  updateUI();
});

// Stop download process
stopBtn.addEventListener('click', async () => {
  chrome.runtime.sendMessage({ action: 'stopDownload' });
  await chrome.storage.local.set({ isRunning: false });
  updateUI();
});

// Listen for updates from background script
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    updateUI();
    
    if (changes.error?.newValue) {
      errorMessage.textContent = changes.error.newValue;
      errorMessage.style.display = 'block';
    }
    
    if (changes.complete?.newValue) {
      successMessage.textContent = changes.complete.newValue;
      successMessage.style.display = 'block';
      progressBar.style.display = 'none';
      phaseIndicator.style.display = 'none';
    }
  }
});

// Initial setup
checkCurrentTab();
updateUI();

// Periodically check if still on bookmarks page
setInterval(checkCurrentTab, 1000);