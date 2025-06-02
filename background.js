// Boolean flag to know if the icon is already green
let iconIsGreen = false;

// Paths (relative to your extension root) for the default vs. green icons.
// Adjust filenames/paths to match how you organized them under /icons/.
const DEFAULT_ICON_PATH = {
  16: "icons/icon-default.png",
};
const GREEN_ICON_PATH = {
  16: "icons/icon-green.png",
};

// Listen for messages from content scripts.
// Each message has the form { match: true/false }.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "FETCH_AND_CHECK") {
    const { domain } = request;

    fetch("https://trustseal.enamad.ir/getData", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `domain=${domain}`
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("ENAMAD response:", data);
        // If the response is not null and contains expected data (e.g. id exists)
        if (data && data.id !== null) {
          sendResponse({ found: true });
        } else {
          sendResponse({ found: false });
        }
      })
      .catch((error) => {
        console.error("POST fetch failed:", error);
        sendResponse({ found: false, error: true });
      });

    // Required to keep sendResponse async
    return true;
  }
});
