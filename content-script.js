// content-script.js

// 1) Utility: run when DOM is fully ready
function onDomReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
}

// 2) Once the DOM is ready, grab the current hostname (no "www.")
//    and send it straight to background.js via FETCH_AND_CHECK.
onDomReady(() => {
  const domain = window.location.hostname.replace(/^www\./, "");
 

  chrome.runtime.sendMessage(
    {
      type: "FETCH_AND_CHECK",
      domain: domain
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          "[content-script] Runtime error during FETCH_AND_CHECK:",
          chrome.runtime.lastError
        );
        return;
      }

      if (response && response.data) {
        // (a) Optionally, store this data persistently for popup.js
        chrome.runtime.sendMessage({
          type: "STORE_DATA",
          key: domain,
          data: response.data
        });
      }
      // No link to “highlight” anymore, since we’re not scanning for <a> tags.
      // If you want to visually indicate a match, you could do something like
      // document.body.style.border = "5px solid lime";
    }
  );
});
