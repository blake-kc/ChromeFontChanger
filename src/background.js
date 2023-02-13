// Where we will expose all the data we retrieve from storage.sync.
const storageCache = {};

const initStorageCache = chrome.storage.sync.get().then((items) => {
  // Copy the data retrieved from storage into storageCache.
  Object.assign(storageCache, items);
});

chrome.action.onClicked.addListener(async (tab) => {
  const useDiscoverSans = storageCache.useDiscoverSans;
  if (useDiscoverSans) {
    storageCache.useDiscoverSans = false;
    chrome.storage.local.set({ storageCache });
  } else {
    storageCache.useDiscoverSans = true;
    chrome.storage.local.set({ storageCache });
  }
  chrome.storage.sync.set(storageCache);

  executeInjection();
});

chrome.webNavigation.onCompleted.addListener(async (tab) => {
  await webNavigationBasedOnStorageCache(tab);
});

chrome.webNavigation.onDOMContentLoaded.addListener(async (tab) => {
  await webNavigationBasedOnStorageCache(tab);
});

chrome.webNavigation.onHistoryStateUpdated.addListener(async (tab) => {
  await webNavigationBasedOnStorageCache(tab);
});

chrome.webNavigation.onReferenceFragmentUpdated.addListener(async (tab) => {
  await webNavigationBasedOnStorageCache(tab);
});

const webNavigationBasedOnStorageCache = async (tab) => {
  if (tab.frameId == 0) {
    await executeBasedOnStorageCache();
  }
};

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    await executeBasedOnStorageCache();
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await executeBasedOnStorageCache();
});

const executeBasedOnStorageCache = async () => {
  try {
    if (storageCache.useDiscoverSans == null) {
      console.log("Init Storage Cache");
      await initStorageCache;
    }
    executeInjection();
  } catch (e) {
    console.log("Error while initializing Storage Cache");
  }
};

const executeInjection = async () => {
  getCurrentTab().then((tabs) => {
    const tabId = tabs[0].id;
    const useDiscoverSans = storageCache.useDiscoverSans;
    if (useDiscoverSans) {
      console.log("Injecting Discover Sans");
      chrome.scripting
        .insertCSS({
          target: { tabId: tabId },
          files: ["/assets/styles/fontStyles.css"],
        })
        .then((value) => {
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: convertMetaToDiscoverSans,
          });
        });
      chrome.action.setIcon({
        path: "/assets/icon67Selected.png",
      });
    } else {
      console.log("Removing Discover Sans");
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: removeDiscoverSans,
      });
      chrome.action.setIcon({
        path: "/assets/icon67NotSelected.png",
      });
    }
  });
};

function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let tabs = chrome.tabs.query(queryOptions);
  return tabs;
}

function removeDiscoverSans() {
  const allElements = document.getElementsByTagName("*");
  for (const element of allElements) {
    revertFont(element);

    if (element.shadowRoot) {
      const childNodes = element.shadowRoot.childNodes;
      for (const child of childNodes) {
        revertFont(child);
      }
    }
  }

  function revertFont(element) {
    const fontFamily = element.getAttribute("data-stylefont");
    element.style.fontFamily = fontFamily;

    for (const elementChildren of element.children) {
      revertFont(elementChildren);
    }
  }
}

function convertMetaToDiscoverSans() {
  const allElements = document.getElementsByTagName("*");
  for (const element of allElements) {
    changeFont(element);

    if (element.shadowRoot) {
      const childNodes = element.shadowRoot.childNodes;
      for (const child of childNodes) {
        changeFont(child);
      }
    }
  }

  function changeFont(element) {
    const font = fontFamilyBasedOnElement(element);
    if (font != null) {
      element.setAttribute("data-stylefont", element.style.fontFamily);
      element.style.fontFamily = font;
    }

    for (const elementChildren of element.children) {
      changeFont(elementChildren);
    }
  }

  function fontFamilyBasedOnElement(element) {
    const style = getComputedStyle(element);
    const fontFamily = style.fontFamily.toLowerCase().split(",")[0];

    if (fontFamily.includes("meta") && fontFamily.includes("norm")) {
      return "DiscoverSans-Book";
    } else if (fontFamily.includes("meta") && fontFamily.includes("light")) {
      return "DiscoverSans-Light";
    } else if (fontFamily.includes("meta") && fontFamily.includes("medium")) {
      return "DiscoverSans-Medium";
    } else if (fontFamily.includes("meta") && fontFamily.includes("bold")) {
      return "DiscoverSans-Bold";
    } else {
      return null;
    }
  }
}
