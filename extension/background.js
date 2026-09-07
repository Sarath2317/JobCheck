"use strict";
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "jobcheck-selection", title: "Check selected text with JobCheck",
      contexts: ["selection"], documentUrlPatterns: ["http://*/*", "https://*/*"]
    });
  });
});
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({url: chrome.runtime.getURL("index.html")});
});
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== "jobcheck-selection") return;
  // Transfer only explicitly selected text into a local extension page, never a server URL.
  const text = String(info.selectionText || "").slice(0, 30000);
  chrome.tabs.create({url: chrome.runtime.getURL("index.html") + "#text=" + encodeURIComponent(text)});
});
