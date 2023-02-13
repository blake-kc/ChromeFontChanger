// In-page cache of the user's options
const options = {};

function handleClick(event) {
  options.useDiscoverSans = event.target.checked;
  chrome.storage.sync.set({ options });
}

const fontCheckbox = document.getElementById("fontCheckbox");

// Initialize the form with the user's option settings
chrome.storage.sync.get("options", (data) => {
  Object.assign(options, data.options);
  fontCheckbox.checked = Boolean(options.useDiscoverSans);
});

// Immediately persist options changes
fontCheckbox.addEventListener("click", handleClick);
