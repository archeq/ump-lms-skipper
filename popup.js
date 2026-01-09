document.addEventListener('DOMContentLoaded', () => {
  const checkbox = document.getElementById('toggleSkip');

  // Load saved state (default to true)
  chrome.storage.local.get(['isEnabled'], (result) => {
    // If undefined, default to true, otherwise use the saved value
    checkbox.checked = result.isEnabled !== false;
  });

  // Save state on change
  checkbox.addEventListener('change', () => {
    chrome.storage.local.set({ isEnabled: checkbox.checked }, () => {
      console.log('Auto-Skip setting saved:', checkbox.checked);
    });
  });
});
