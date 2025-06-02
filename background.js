// background.js

// Boolean flag to know if the icon is currently showing green
let iconIsGreen = false;

// Paths for the default vs. green icons.
// Make sure these match the filenames/locations in your /icons/ folder.
const DEFAULT_ICON_PATH = {
  16: "icons/icon-default.png"
};
const GREEN_ICON_PATH = {
  16: "icons/icon-green.png"
};

// Listen for messages from content scripts.
// We expect messages of the form: { type: "FETCH_AND_CHECK", domain: "example.com" }
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "FETCH_AND_CHECK") {
    const { domain } = request;

    // Make a POST request to the ENAMAD API endpoint
    fetch("https://trustseal.enamad.ir/getData", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `domain=${encodeURIComponent(domain)}`
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("[background] ENAMAD response for", domain, ":", data);

        // If the API returned a valid object with a non‐null `id`,
        // we treat that as a "match"
        if (data && data.id != null) {
          // (1) Reply to the content script with the data
          sendResponse({ data: data });

          // (2) Switch the toolbar icon to green (only if it’s not already green)
          if (!iconIsGreen) {
            chrome.action.setIcon({ path: GREEN_ICON_PATH }, () => {
              if (chrome.runtime.lastError) {
                console.error(
                  "[background] Error setting green icon:",
                  chrome.runtime.lastError
                );
              }
            });
            iconIsGreen = true;
          }

          // (3) Optionally, store this object in chrome.storage.local under the domain key.
          //     If you do not want to store, you can remove this block entirely.
          chrome.storage.local.set({ [domain]: data }, () => {
            if (chrome.runtime.lastError) {
              console.error(
                "[background] Error saving data to storage:",
                chrome.runtime.lastError
              );
            } else {
              console.log(
                `[background] Stored ENAMAD data under key "${domain}"`
              );
            }
          });
        } else {
          // No valid `id` in the API response (treat as "no match")
          sendResponse({ data: null });

          // If we previously set the icon green, reset it back to default
          if (iconIsGreen) {
            chrome.action.setIcon({ path: DEFAULT_ICON_PATH }, () => {
              if (chrome.runtime.lastError) {
                console.error(
                  "[background] Error resetting to default icon:",
                  chrome.runtime.lastError
                );
              }
            });
            iconIsGreen = false;
          }
        }
      })
      .catch((error) => {
        console.error("[background] POST fetch failed:", error);
        // On network or JSON parse error, respond with data: null and reset icon
        sendResponse({ data: null });

        if (iconIsGreen) {
          chrome.action.setIcon({ path: DEFAULT_ICON_PATH }, () => {
            if (chrome.runtime.lastError) {
              console.error(
                "[background] Error resetting icon after fetch error:",
                chrome.runtime.lastError
              );
            }
          });
          iconIsGreen = false;
        }
      });

    // Must return true to indicate we will call sendResponse asynchronously
    return true;
  }
});
