// content-script.js

// 1) Whenever we find an <a href*="trustseal.enamad.ir">, call this.
//    It will send a message to the background script to fetch some HTML
//    and check if it contains the current domain.
function processLinkContent(linkEl) {
  // Only proceed if it’s actually an <a> and has an href
  if (
    linkEl.tagName === "A" &&
    linkEl.href &&
    linkEl.href.toLowerCase().includes("trustseal.enamad.ir")
  ) {
    // Get the “bare” hostname (no “www.”)
    const domain = window.location.hostname.replace(/^www\./, "");
    console.log("[content-script] Domain is:", domain);

    chrome.runtime.sendMessage(
      {
        type: "FETCH_AND_CHECK",
        // Pass the link itself as well, in case background wants to fetch linkEl.href
        targetUrl: linkEl.href,
        domain: domain,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "[content-script] Runtime error while sending FETCH_AND_CHECK:",
            chrome.runtime.lastError
          );
          return;
        }

        // If the background says “found: true”, highlight the link.
        console.log("[content-script] response:", response);
        if (response && response.found) {
          linkEl.style.border = "5px solid lime";
          // Not strictly necessary unless you have a listener for “match” somewhere else
          chrome.runtime.sendMessage({ match: true });
        }
      }
    );
  }
}

// 2) Scan all existing <a> elements right now (on page load)
function scanExistingLinks() {
  const allAnchors = document.querySelectorAll('a[href*="trustseal.enamad.ir" i]');
  allAnchors.forEach((linkEl) => {
    processLinkContent(linkEl);
  });
}

// 3) Watch for any future <a> insertions
function watchForNewLinks() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        // If the newly added node itself is an <a> with trustseal URL, process it.
        if (
          node.tagName === "A" &&
          node.href &&
          node.href.toLowerCase().includes("trustseal.enamad.ir")
        ) {
          processLinkContent(node);
        }

        // Otherwise, search inside it for any nested <a> tags that match
        if (node.querySelectorAll) {
          const nested = node.querySelectorAll('a[href*="trustseal.enamad.ir" i]');
          nested.forEach((linkEl) => {
            processLinkContent(linkEl);
          });
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// 4) Utility: run when DOM is fully ready
function onDomReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
}

// ENTRY POINT
onDomReady(() => {
  scanExistingLinks();
  watchForNewLinks();
});
