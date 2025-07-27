console.log("ChatGPT visited - content script loaded");

(async () => {
  try {
    const result = await chrome.storage.sync.get(["chatgptBlocked"]);
    const isBlocked = result.chatgptBlocked === true;

    if (isBlocked) {
      console.log("ChatGPT is blocked, showing blocking screen");
      showBlockingScreen();
    } else {
      console.log("ChatGPT is not blocked, allowing normal access");
    }
  } catch (error) {
    console.error("Failed to check blocking state:", error);
  }
})();

function showBlockingScreen() {
  // Creating overlay instead of replacing entire document
  const overlay = document.createElement("div");
  overlay.id = "gptracker-blocking-overlay";
  overlay.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: #d4e9e2 !important;
    color: #1e3932 !important;
    z-index: 2147483647 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-family: 'Cutive Mono', monospace !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-sizing: border-box !important;
  `;

  const container = document.createElement("div");
  container.style.cssText = `
    text-align: center !important;
    max-width: 500px !important;
    padding: 3rem !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
  `;

  const icon = document.createElement("div");
  icon.textContent = "🚫";
  icon.style.cssText = "font-size: 4rem; margin-bottom: 1.5rem;";

  const title = document.createElement("h1");
  title.textContent = "Access Blocked";
  title.style.cssText =
    "font-size: 2rem; font-weight: normal; margin-bottom: 1rem; color: #1e3932 !important;";

  const message = document.createElement("p");
  message.textContent = "ChatGPT access has been blocked by GPTracker";
  message.style.cssText =
    "font-size: 1.125rem; margin-bottom: 1.5rem; color: #1e3932 !important; opacity: 0.8; line-height: 1.6;";

  const info = document.createElement("p");
  info.textContent =
    "This website is currently blocked to help you manage your usage. You can disable blocking from the GPTracker extension popup.";
  info.style.cssText =
    "font-size: 1rem; color: #1e3932 !important; opacity: 0.7; margin-bottom: 1.5rem; line-height: 1.5;";

  const button = document.createElement("button");
  button.id = "gptracker-unblock-btn";
  button.textContent = "Open GPTracker Settings";
  button.style.cssText =
    "background: transparent !important; border: 1px solid #1e3932 !important; color: #1e3932 !important; padding: 0.75rem 1.5rem !important; border-radius: 0 !important; font-size: 1rem !important; font-weight: normal !important; font-family: 'Cutive Mono', monospace !important; cursor: pointer !important; transition: all 0.2s ease !important;";

  const branding = document.createElement("div");
  branding.textContent = "Blocked by GPTracker";
  branding.style.cssText = "margin-top: 1.5rem; font-size: 0.875rem; color: #1e3932 !important; opacity: 0.6;";

  container.appendChild(icon);
  container.appendChild(title);
  container.appendChild(message);
  container.appendChild(info);
  container.appendChild(button);
  container.appendChild(branding);

  overlay.appendChild(container);
  document.documentElement.appendChild(overlay);

  button.addEventListener("click", () => {
    alert(
      "Please click the GPTracker extension icon in your browser toolbar to disable blocking."
    );
  });

  // Add hover effects for the button
  button.addEventListener("mouseenter", () => {
    button.style.background = "#1e3932 !important";
    button.style.color = "#d4e9e2 !important";
  });

  button.addEventListener("mouseleave", () => {
    button.style.background = "transparent !important";
    button.style.color = "#1e3932 !important";
  });

  // Use MutationObserver to prevent attempts to remove overlay by checking DOM child node removals of the blocking overlay
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.removedNodes.forEach((node) => {
          if ((node as HTMLElement).id === "gptracker-blocking-overlay") {
            document.documentElement.appendChild(overlay);
          }
        });
      }
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  document.addEventListener(
    "keydown",
    function (e) {
      if (
        e.key === "F5" ||
        (e.ctrlKey && e.key === "r") ||
        (e.metaKey && e.key === "r") ||
        (e.ctrlKey && e.shiftKey && e.key === "R") ||
        e.key === "F12"
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    },
    true
  );
}
