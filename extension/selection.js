"use strict";
const selectedText = new URLSearchParams(location.hash.slice(1)).get("text");
if (selectedText) {
  // Remove submitted material from the address bar before analysis.
  history.replaceState(null, "", location.pathname);
  const input = document.querySelector("#jobText");
  input.value = selectedText.slice(0, 30000);
  input.dispatchEvent(new Event("input", {bubbles: true}));
  document.querySelector("#analyzeBtn").click();
}
