let isRunning = false;
let currentTabId = null;

// Helper function to create delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Random delay between min and max seconds
function randomDelay(minSeconds, maxSeconds) {
  const ms = (Math.random() * (maxSeconds - minSeconds) + minSeconds) * 1000;
  return delay(Math.round(ms));
}

// Update status with countdown (now handles decimal delays)
async function updateStatusWithCountdown(message, seconds) {
  const wholeSeconds = Math.floor(seconds);
  const totalDelayMs = seconds * 1000;
  
  // Show countdown for whole seconds
  for (let i = wholeSeconds; i > 0; i--) {
    if (!isRunning) break;
    await chrome.storage.local.set({ 
      status: `${message} <span class="countdown">${i}s</span>`
    });
    await delay(1000);
  }
  
  // Calculate remaining delay after countdown
  const remainingMs = totalDelayMs - (wholeSeconds * 1000);
  if (remainingMs > 0 && isRunning) {
    await delay(remainingMs);
  }
}

// Sanitize filename
function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200); // Limit length
}

// Extract work info from bookmarks page
async function extractBookmarksFromPage(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        const bookmarks = [];
        const bookmarkElements = document.querySelectorAll('li.bookmark.blurb.group h4.heading a[href^="/works/"]');
        
        bookmarkElements.forEach(link => {
          const href = link.getAttribute('href');
          const match = href.match(/\/works\/(\d+)/);
          if (match) {
            bookmarks.push({
              workId: match[1],
              title: link.textContent.trim()
            });
          }
        });
        
        // Check for next page
        const nextLink = document.querySelector('ol.pagination li.next a');
        const hasNextPage = nextLink !== null;
        const nextPageUrl = hasNextPage ? nextLink.href : null;
        
        return { bookmarks, hasNextPage, nextPageUrl };
      }
    });
    
    return results[0].result;
  } catch (error) {
    console.error('Error extracting bookmarks:', error);
    return { bookmarks: [], hasNextPage: false, nextPageUrl: null };
  }
}

// Navigate to URL and wait for load
async function navigateToUrl(tabId, url) {
  await chrome.tabs.update(tabId, { url: url });
  
  // Wait for page to load
  return new Promise((resolve) => {
    const listener = (updatedTabId, changeInfo, tab) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}

// Phase 1: Collect all bookmarks
async function collectAllBookmarks(tabId) {
  const allBookmarks = [];
  let pageCount = 1;
  let hasMore = true;
  
  await chrome.storage.local.set({ phase: 1 });
  
  while (hasMore && isRunning) {
    await chrome.storage.local.set({ 
      status: `Collecting bookmarks from page ${pageCount}...`
    });
    
    // Small delay before extraction
    await delay(500);
    
    const pageData = await extractBookmarksFromPage(tabId);
    allBookmarks.push(...pageData.bookmarks);
    
    await chrome.storage.local.set({ 
      status: `Found ${allBookmarks.length} bookmarks so far...`
    });
    
    if (pageData.hasNextPage && pageData.nextPageUrl && isRunning) {
      // Random delay before next page (4-8 seconds, decimal)
      const delaySecondsPageLoad = Math.random() * (8 - 4) + 4; // 4.0 to 8.0 seconds
	  await updateStatusWithCountdown(`Waiting before next page...`, delaySecondsPageLoad);
      
      if (isRunning) {
        await navigateToUrl(tabId, pageData.nextPageUrl);
        pageCount++;
      }
    } else {
      hasMore = false;
    }
  }
  
  return allBookmarks;
}

// Phase 2: Download all works
async function downloadAllWorks(bookmarks, format) {
  await chrome.storage.local.set({ phase: 2 });
  
  const totalWorks = bookmarks.length;
  const downloadDate = new Date().toISOString().split('T')[0];
  const folderName = `AO3_Bookmarks_${downloadDate}`;
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < bookmarks.length && isRunning; i++) {
    const bookmark = bookmarks[i];
    const progress = ((i + 1) / totalWorks) * 100;
    
    await chrome.storage.local.set({ 
      progress: progress,
      status: `Downloading "${bookmark.title}" (${i + 1}/${totalWorks})`
    });
    
    try {
      // Construct download URL
      const sanitizedTitle = sanitizeFilename(bookmark.title) || 'untitled';
      const filename = `${sanitizedTitle}_${downloadDate}.${format}`;
      const downloadUrl = `https://archiveofourown.org/downloads/${bookmark.workId}/${sanitizedTitle}.${format}`;
      
      // Start download
      await chrome.downloads.download({
        url: downloadUrl,
        filename: `${folderName}/${filename}`,
        conflictAction: 'uniquify',
        saveAs: false
      });
      
      successCount++;
    } catch (error) {
      console.error(`Failed to download work ${bookmark.workId}:`, error);
      failCount++;
    }
    
    // Delay before next download (except for last item) - 1-3 seconds, decimal
    if (i < bookmarks.length - 1 && isRunning) {
      const delaySecondsDownload = Math.random() * (3 - 1) + 1; // 1.0 to 3.0 seconds
      await updateStatusWithCountdown(`Waiting before next download...`, delaySecondsDownload);
    }
  }
  
  return { successCount, failCount, totalWorks };
}

// Main download handler
async function handleDownload(format) {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTabId = tab.id;
    
    // Phase 1: Collect all bookmarks
    await chrome.storage.local.set({ 
      status: 'Starting bookmark collection...',
      progress: 0
    });
    
    const bookmarks = await collectAllBookmarks(currentTabId);
    
    if (!isRunning) {
      await chrome.storage.local.set({ 
        status: 'Download stopped by user',
        isRunning: false
      });
      return;
    }
    
    if (bookmarks.length === 0) {
      await chrome.storage.local.set({ 
        error: 'No bookmarks found on this page',
        isRunning: false
      });
      return;
    }
    
    await chrome.storage.local.set({ 
      status: `Found ${bookmarks.length} bookmarks. Starting downloads...`
    });
    
    // Small delay between phases
    await delay(1000);
    
    // Phase 2: Download all works
    const results = await downloadAllWorks(bookmarks, format);
    
    // Complete
    if (isRunning) {
      await chrome.storage.local.set({ 
        complete: `Download complete! Successfully downloaded ${results.successCount} of ${results.totalWorks} works.`,
        status: 'All downloads completed',
        isRunning: false,
        progress: 100
      });
    }
    
  } catch (error) {
    console.error('Download error:', error);
    await chrome.storage.local.set({ 
      error: `Error: ${error.message}`,
      isRunning: false
    });
  } finally {
    isRunning = false;
  }
}

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startDownload') {
    isRunning = true;
    handleDownload(request.format);
    sendResponse({ status: 'started' });
  } else if (request.action === 'stopDownload') {
    isRunning = false;
    chrome.storage.local.set({ 
      status: 'Stopping download...',
      isRunning: false
    });
    sendResponse({ status: 'stopped' });
  }
  return true;
});

// Clean up storage on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.clear();
});
