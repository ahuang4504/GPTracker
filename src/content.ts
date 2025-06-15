console.log("ChatGPT visited - content script loaded");

chrome.runtime.sendMessage({
  type: "GPT_VISITED",
});
