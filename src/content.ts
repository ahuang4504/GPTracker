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
    --s: 103px;
    --c1: rgba(23, 4, 9, 0.03);
    --c2: #d4e9e2;
    --_g: #0000 52%, var(--c1) 54% 57%, #0000 59%;
    background: 
      radial-gradient(farthest-side at -33.33% 50%, var(--_g)) 0 calc(var(--s)/2),
      radial-gradient(farthest-side at 50% 133.33%, var(--_g)) calc(var(--s)/2) 0,
      radial-gradient(farthest-side at 133.33% 50%, var(--_g)),
      radial-gradient(farthest-side at 50% -33.33%, var(--_g)),
      var(--c2) !important;
    background-size: calc(var(--s)/4.667) var(--s), var(--s) calc(var(--s)/4.667) !important;
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
    line-height: 1.6 !important;
  `;

  const container = document.createElement("div");
  container.style.cssText = `
    text-align: center !important;
    max-width: 400px !important;
    padding: 2rem !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
  `;

  const icon = document.createElement("div");
  icon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9" style="width: 48px; height: 48px; opacity: 0.3; filter: grayscale(20%) drop-shadow(0 1px 1px rgba(30, 57, 50, 0.1));">
      <rect fill="#1e3932" x="2" y="0" width="2" height="1"/>
      <rect fill="#1e3932" x="5" y="0" width="2" height="1"/>
      <path fill="#1e3932" d="M2,1H1V3H0V7H1V8H2V7H3V6H1V4H2z"/>
      <rect fill="#1e3932" x="4" y="1" width="1" height="1"/>
      <path fill="#1e3932" d="M6,3H8V5H7V8H8V6H9V2H8V1H7V2H6z"/>
      <path fill="#1e3932" d="M2,5H3V6H5V7H6V5H7V4H6V3H4V2H3V4H2z M5,4V5H4V4z"/>
      <rect fill="#1e3932" x="4" y="7" width="1" height="1"/>
      <rect fill="#1e3932" x="2" y="8" width="2" height="1"/>
      <rect fill="#1e3932" x="5" y="8" width="2" height="1"/>
    </svg>
  `;
  icon.style.cssText = `
    margin-bottom: 1.5rem !important;
    display: flex !important;
    justify-content: center !important;
  `;

  const title = document.createElement("h1");
  title.textContent = "► Access Blocked";
  title.style.cssText = `
    font-size: 1.5rem !important; 
    font-weight: bold !important; 
    margin-bottom: 1rem !important; 
    color: #1e3932 !important;
    text-shadow: 0 2px 4px rgba(30, 57, 50, 0.15) !important;
  `;

  const message = document.createElement("p");
  message.textContent = "► ChatGPT access has been blocked by GPTracker";
  message.style.cssText = `
    font-size: 0.875rem !important; 
    margin-bottom: 1rem !important; 
    color: #1e3932 !important; 
    opacity: 0.8 !important; 
    line-height: 1.6 !important;
    text-shadow: 0 1px 1px rgba(30, 57, 50, 0.08) !important;
  `;

  const info = document.createElement("p");
  info.textContent =
    "► This website is currently blocked to help you manage your usage. You can disable blocking from the GPTracker extension popup.";
  info.style.cssText = `
    font-size: 0.75rem !important; 
    color: #1e3932 !important; 
    opacity: 0.7 !important; 
    margin-bottom: 1.5rem !important; 
    line-height: 1.5 !important;
  `;


  const branding = document.createElement("div");
  branding.textContent = "► Blocked by GPTracker";
  branding.style.cssText = `
    margin-top: 1rem !important; 
    font-size: 0.75rem !important; 
    color: #1e3932 !important; 
    opacity: 0.6 !important;
  `;

  container.appendChild(icon);
  container.appendChild(title);
  container.appendChild(message);
  container.appendChild(info);
  container.appendChild(branding);

  overlay.appendChild(container);
  document.documentElement.appendChild(overlay);


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
