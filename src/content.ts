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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    color: white !important;
    z-index: 2147483647 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif !important;
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
    background: rgba(255, 255, 255, 0.1) !important;
    border-radius: 20px !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1) !important;
  `;

  const icon = document.createElement("div");
  icon.textContent = "🚫";
  icon.style.cssText = "font-size: 4rem; margin-bottom: 1.5rem;";

  const title = document.createElement("h1");
  title.textContent = "Access Blocked";
  title.style.cssText =
    "font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem; background: linear-gradient(45deg, #fff, #f0f0f0); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;";

  const message = document.createElement("p");
  message.textContent = "ChatGPT access has been blocked by GPTracker";
  message.style.cssText =
    "font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9; line-height: 1.6;";

  const info = document.createElement("p");
  info.textContent =
    "This website is currently blocked to help you manage your usage. You can disable blocking from the GPTracker extension popup.";
  info.style.cssText =
    "font-size: 1rem; opacity: 0.8; margin-bottom: 2rem; line-height: 1.5;";

  const button = document.createElement("button");
  button.id = "gptracker-unblock-btn";
  button.textContent = "Open GPTracker Settings";
  button.style.cssText =
    "background: rgba(255, 255, 255, 0.2); border: 2px solid rgba(255, 255, 255, 0.3); color: white; padding: 0.75rem 1.5rem; border-radius: 50px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease;";

  const branding = document.createElement("div");
  branding.textContent = "Blocked by GPTracker";
  branding.style.cssText = "margin-top: 2rem; font-size: 0.9rem; opacity: 0.7;";

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
