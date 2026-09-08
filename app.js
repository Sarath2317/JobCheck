(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const els = {
    tabs: $$(".tab"),
    panels: $$(".tab-panel"),
    jobText: $("#jobText"),
    jobUrl: $("#jobUrl"),
    jobEmail: $("#jobEmail"),
    dotText: $("#dotText"),
    dotUrl: $("#dotUrl"),
    dotEmail: $("#dotEmail"),
    charCount: $("#charCount"),
    inputSummary: $("#inputSummary"),
    analyzeBtn: $("#analyzeBtn"),
    sampleBtn: $("#sampleBtn"),
    formError: $("#formError"),
    reportCard: $("#reportCard"),
    emptyReport: $("#emptyReport"),
    reportResults: $("#reportResults"),
    reportState: $("#reportState"),
    caseId: $("#caseId"),
    riskStamp: $("#riskStamp"),
    verdictNote: $("#verdictNote"),
    riskScore: $("#riskScore"),
    riskMeter: $("#riskMeter"),
    meterFill: $("#meterFill"),
    flagCount: $("#flagCount"),
    flagList: $("#flagList"),
    analysisSummary: $("#analysisSummary"),
    verifyList: $("#verifyList"),
    copyBtn: $("#copyBtn"),
    newCaseBtn: $("#newCaseBtn"),
    clearHistoryBtn: $("#clearHistoryBtn"),
    historyEmpty: $("#historyEmpty"),
    historyList: $("#historyList"),
    howBtn: $("#howBtn"),
    howSection: $("#howSection"),
    toast: $("#toast")
  };

  const HISTORY_KEY = "jobcheck-history-v1";
  const FREE_MAIL = new Set(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "proton.me", "protonmail.com", "icloud.com", "rediffmail.com"]);
  const SHORTENERS = new Set(["bit.ly", "tinyurl.com", "t.co", "rb.gy", "cutt.ly", "shorturl.at", "is.gd", "rebrand.ly"]);
  const SUSPICIOUS_TLDS = new Set(["xyz", "top", "click", "work", "live", "buzz", "monster", "rest", "cam", "gq", "tk"]);

  const TEXT_RULES = [
    {
      id: "payment",
      title: "Payment or deposit requested",
      points: 40,
      pattern: /\b(registration fee|processing fee|security deposit|training fee|pay (?:us|now|first)|send (?:money|payment)|upi|gift card|crypto(?:currency)?|refundable deposit)\b/i,
      detail: "Legitimate employers generally do not require candidates to pay to receive a job."
    },
    {
      id: "secrets",
      title: "Private credentials requested",
      points: 60,
      pattern: /\b(otp|one[ -]?time password|password|pin number|cvv|bank login|net banking|card details|internet banking)\b/i,
      detail: "An employer should never ask for passwords, OTPs, PINs, or card security details."
    },
    {
      id: "banking",
      title: "Bank or identity details requested early",
      points: 16,
      pattern: /\b(bank account|account number|aadhaar|aadhar|pan card|passport copy|identity proof|id proof|cancelled cheque)\b/i,
      detail: "Sensitive identity or bank information should not be shared before independently verifying the employer and process."
    },
    {
      id: "urgency",
      title: "Pressure to act immediately",
      points: 12,
      pattern: /\b(urgent(?:ly)?|immediately|act now|limited slots?|today only|within (?:an? )?hour|last chance|respond now|join today)\b/i,
      detail: "Artificial urgency can prevent candidates from checking the company and offer carefully."
    },
    {
      id: "instant-hire",
      title: "Hiring without a normal interview",
      points: 13,
      pattern: /\b(no interview|without interview|direct joining|instant joining|selected immediately|you(?:'| a)re hired|offer letter ready|guaranteed job)\b/i,
      detail: "Instant selection or guaranteed hiring is unusual for most genuine roles."
    },
    {
      id: "too-good",
      title: "Unrealistic earnings or easy-work promise",
      points: 12,
      pattern: /\b(earn (?:₹|rs\.?|inr|\$)?\s?\d|make (?:₹|rs\.?|inr|\$)?\s?\d|huge salary|unlimited income|easy money|work (?:only )?\d+ hours?|no experience (?:needed|required)|100% guaranteed)\b/i,
      detail: "High earnings with little work, no experience, or guaranteed results deserve extra verification."
    },
    {
      id: "messaging",
      title: "Recruitment moved to private messaging",
      points: 9,
      pattern: /\b(whatsapp|telegram|signal)\b/i,
      detail: "Messaging apps may be used legitimately, but an app-only hiring process makes identity harder to verify."
    },
    {
      id: "remote-vague",
      title: "Vague remote-work opportunity",
      points: 7,
      pattern: /\b(work from home|remote job|part[ -]?time)\b/i,
      detail: "Remote or part-time work is not suspicious by itself, but vague offers in these categories are frequently impersonated."
    },
    {
      id: "link-pressure",
      title: "Unverified link or download requested",
      points: 12,
      pattern: /\b(click (?:this|the) link|download (?:the )?(?:app|file|form)|install (?:the )?app|open attachment|complete verification link)\b/i,
      detail: "Unexpected links, apps, and attachments can be used for credential theft or malware."
    }
  ];

  function switchTab(name, focus = false) {
    els.tabs.forEach((tab) => {
      const active = tab.dataset.tab === name;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    els.panels.forEach((panel) => { panel.hidden = panel.id !== `panel-${name}`; });
  }

  els.tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
    tab.addEventListener("keydown", (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const next = (index + direction + els.tabs.length) % els.tabs.length;
      switchTab(els.tabs[next].dataset.tab, true);
    });
  });

  function normalizedInputs() {
    return {
      text: els.jobText.value.trim(),
      url: els.jobUrl.value.trim(),
      email: els.jobEmail.value.trim().toLowerCase()
    };
  }

  function updateInputState() {
    const input = normalizedInputs();
    els.dotText.classList.toggle("filled", Boolean(input.text));
    els.dotUrl.classList.toggle("filled", Boolean(input.url));
    els.dotEmail.classList.toggle("filled", Boolean(input.email));
    els.charCount.textContent = `${els.jobText.value.length.toLocaleString()} characters`;
    const count = [input.text, input.url, input.email].filter(Boolean).length;
    els.inputSummary.textContent = count
      ? `${count} evidence ${count === 1 ? "field" : "fields"} ready for analysis.`
      : "Add any evidence you have. One field is enough to begin.";
    els.formError.textContent = "";
  }

  [els.jobText, els.jobUrl, els.jobEmail].forEach((input) => input.addEventListener("input", updateInputState));

  function getDomain(value) {
    if (!value) return "";
    try {
      const normalized = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`;
      return new URL(normalized).hostname.toLowerCase().replace(/^www\./, "");
    } catch (_) {
      return "";
    }
  }

  function registrableHint(domain) {
    const parts = domain.split(".").filter(Boolean);
    return parts.length > 1 ? parts.slice(-2).join(".") : domain;
  }

  function analyze(inputs) {
    const flags = [];
    let score = 0;
    let urlDomain = "";
    let emailDomain = "";

    TEXT_RULES.forEach((rule) => {
      if (!['remote-vague', 'too-good', 'messaging'].includes(rule.id) && inputs.text.split(/(?:[.!?;\n]|\bbut\b|\bhowever\b)/i).some((clause) => {
        const match = rule.pattern.exec(clause);
        if (!match) return false;
        const before = clause.slice(Math.max(0, match.index - 90), match.index);
        const after = clause.slice(match.index + match[0].length, match.index + match[0].length + 35);
        return !/\b(?:never|do not|don't|will not|won't|no|without|avoid)\b[^,]{0,70}$/i.test(before)
          && !/^\s*(?:is|are)?\s*(?:not required|not requested|never required)/i.test(after);
      })) {
        flags.push({ title: rule.title, detail: rule.detail, points: rule.points });
        score += rule.points;
      }
    });

    if (inputs.text) {
      const detailSignals = [
        /\b(company|organization|employer)\b/i,
        /\b(responsibilit|requirement|qualification|experience|skills?)\b/i,
        /\b(location|onsite|on-site|hybrid|remote)\b/i,
        /\b(interview|application|apply)\b/i
      ].filter((pattern) => pattern.test(inputs.text)).length;

      if (inputs.text.length < 120 || detailSignals < 2) {
        flags.push({
          title: "Job details are incomplete or vague",
          detail: "The message does not provide enough specific information about the employer, role, requirements, or hiring process.",
          points: 0,
          informational: true
        });
      }

      const contacts = inputs.text.match(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/ig) || [];
      if (!inputs.email && contacts.length) inputs.email = contacts[0].toLowerCase();
    }

    if (inputs.url) {
      urlDomain = getDomain(inputs.url);
      if (!urlDomain) {
        flags.push({ title: "Job URL is not valid", detail: "The submitted address could not be parsed as a normal website URL.", points: 14 });
        score += 14;
      } else {
        const parsedUrl = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(inputs.url) ? inputs.url : `https://${inputs.url}`);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          flags.push({title: 'Unsupported link protocol', detail: 'Use an ordinary HTTP or HTTPS job listing. Do not execute this link.', points: 30});
          score += 30;
        }
        if (parsedUrl.protocol === "http:") {
          flags.push({ title: "Job link is not encrypted", detail: "The address uses HTTP instead of HTTPS, so information sent to it may not be protected.", points: 8 });
          score += 8;
        }
        if (SHORTENERS.has(urlDomain)) {
          flags.push({ title: "Shortened link hides its destination", detail: "The final website cannot be known from the submitted shortened address alone.", points: 14 });
          score += 14;
        }
        if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(urlDomain)) {
          flags.push({ title: "Website uses a raw IP address", detail: "Legitimate recruiting pages normally use a recognizable company domain.", points: 18 });
          score += 18;
        }
        if (urlDomain.includes("xn--") || inputs.url.includes("@")) {
          flags.push({ title: "Link contains misleading address characters", detail: "This pattern can make a link appear to belong to a different website.", points: 22 });
          score += 22;
        }
        const tld = urlDomain.split(".").pop();
        if (SUSPICIOUS_TLDS.has(tld)) {
          flags.push({ title: "Website uses an unusual top-level domain", detail: `The .${tld} ending is not proof of fraud, but it deserves additional verification.`, points: 9 });
          score += 9;
        }
        if ((urlDomain.match(/-/g) || []).length >= 2 || /(?:career|job|hire|recruit).*(?:career|job|hire|recruit)/i.test(urlDomain)) {
          flags.push({ title: "Website domain looks imitative", detail: "Repeated hiring words or several dashes can be used to create a look-alike recruiting domain.", points: 10 });
          score += 10;
        }
      }
    }

    if (inputs.email) {
      const emailMatch = inputs.email.match(/^[^\s@]+@([^\s@]+\.[^\s@]+)$/);
      if (!emailMatch) {
        flags.push({ title: "Sender email is not valid", detail: "The submitted sender address does not follow a normal email format.", points: 14 });
        score += 14;
      } else {
        emailDomain = emailMatch[1].toLowerCase();
        if (FREE_MAIL.has(emailDomain)) {
          flags.push({ title: "Offer came from a free email service", detail: "A recruiter using a personal inbox is harder to connect to the company they claim to represent.", points: 15 });
          score += 15;
        }
        if ((emailDomain.match(/-/g) || []).length >= 2 || /(?:career|job|hire|recruit).*(?:career|job|hire|recruit)/i.test(emailDomain)) {
          flags.push({ title: "Sender domain looks imitative", detail: "The email domain uses a pattern commonly seen in unofficial or look-alike recruiting addresses.", points: 11 });
          score += 11;
        }
      }
    }

    if (urlDomain && emailDomain && urlDomain !== emailDomain) {
      flags.push({
        title: "Sender and job-link domains do not match",
        detail: `The email uses ${emailDomain}, while the job link uses ${urlDomain}. Recruiting platforms and subdomains can differ legitimately. Confirm the relationship through the employer's official careers page; matching names do not prove ownership.`,
        points: 0,
        informational: true
      });
    }

    if (!inputs.text) {
      flags.push({
        title: "Job message was not included",
        detail: "The role, salary, requirements, and instructions could not be checked. Add the full message for a stronger result.",
        points: 0,
        informational: true
      });
    }
    if (!inputs.url && !inputs.email) {
      flags.push({
        title: "Recruiter identity cannot be compared",
        detail: "Add a sender email or job URL to check whether the contact details support the claimed employer.",
        points: 0,
        informational: true
      });
    }

    score = Math.min(100, score);
    const level = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
    const insufficient = inputs.text.length < 120;
    const label = level === "high" ? "HIGH RISK" : level === "medium" ? "CAUTION" : insufficient ? "INSUFFICIENT EVIDENCE" : "LOW SIGNALS · UNVERIFIED";
    const note = level === "high"
      ? "Do not pay, click, or share documents until the employer is independently verified."
      : level === "medium"
        ? "Pause and confirm the employer through an independent official source."
        : insufficient ? "There is too little job content to assess this offer. Add the full message." : "Few warning signals were found. This employer and offer remain unverified.";

    const verification = [
      "Find the company's official website yourself—do not rely only on links in the message.",
      "Confirm the job appears on the company's official careers page or verified profile.",
      "Contact the company through a phone number or email you found independently."
    ];
    if (flags.some((flag) => /payment|deposit/i.test(flag.title))) verification.unshift("Do not send money. Genuine employers should not charge you for a job.");
    if (flags.some((flag) => /private|bank|identity/i.test(flag.title))) verification.unshift("Do not share OTPs, passwords, bank logins, or unnecessary identity documents.");
    if (urlDomain) verification.push(`Check when ${urlDomain} was created and whether the company publicly uses it.`);
    if (emailDomain) verification.push(`Ask the company to confirm that ${emailDomain} is an authorized recruiting domain.`);

    const strongFlags = flags.filter((flag) => !flag.informational);
    let summary;
    if (!strongFlags.length) {
      summary = "The submitted evidence did not match a strong rule-based scam pattern. That does not confirm the offer is genuine: JobCheck cannot contact the employer, inspect company records, or open the submitted link. Verify the organization independently before taking action.";
    } else if (level === "high") {
      summary = `This offer combines ${strongFlags.length} meaningful warning ${strongFlags.length === 1 ? "sign" : "signs"}. The most serious issue is ${strongFlags[0].title.toLowerCase()}. Treat the offer as unsafe until the claimed employer confirms it through an independently found official channel.`;
    } else {
      summary = `JobCheck found ${strongFlags.length} warning ${strongFlags.length === 1 ? "sign" : "signs"}, led by ${strongFlags[0].title.toLowerCase()}. The evidence is not enough to label the offer genuine or fraudulent, so verify the employer and hiring process before continuing.`;
    }

    return { score, insufficient, level: insufficient && score < 30 ? 'unknown' : level, label, note, flags, verification: [...new Set(verification)].slice(0, 6), summary, inputs, urlDomain, emailDomain };
  }

  function newCaseId() {
    const date = new Date();
    const day = date.toISOString().slice(0, 10).replaceAll("-", "");
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    return `JC-${day}-${suffix}`;
  }

  function renderReport(report, caseId, options = {}) {
    els.reportCard.classList.remove("risk-low", "risk-medium", "risk-high", "risk-unknown");
    els.reportCard.classList.add(`risk-${report.level}`);
    els.emptyReport.hidden = true;
    els.reportResults.hidden = false;
    els.reportState.textContent = "CASE ANALYZED";
    els.caseId.textContent = caseId;
    els.riskStamp.textContent = report.label;
    els.verdictNote.textContent = report.note;
    els.riskScore.textContent = report.score;
    els.riskMeter.setAttribute("aria-valuenow", String(report.score));
    els.riskMeter.setAttribute("aria-valuetext", `${report.score} out of 100, ${report.label.toLowerCase()}`);
    requestAnimationFrame(() => { els.meterFill.style.width = `${report.score}%`; });
    els.flagCount.textContent = `${report.flags.length} ${report.flags.length === 1 ? "FLAG" : "FLAGS"}`;

    els.flagList.replaceChildren();
    if (!report.flags.length) {
      const clear = document.createElement("div");
      clear.className = "clear-item";
      clear.innerHTML = "<span>✓</span><div>No rule-based warning signs matched the submitted evidence.</div>";
      els.flagList.append(clear);
    } else {
      report.flags.forEach((flag) => {
        const item = document.createElement("div");
        item.className = "flag-item";
        const icon = document.createElement("span");
        icon.className = "flag-icon";
        icon.textContent = flag.informational ? "i" : "!";
        const copy = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = flag.title;
        const detail = document.createElement("p");
        detail.textContent = flag.detail;
        copy.append(title, detail);
        const points = document.createElement("span");
        points.className = "flag-points";
        points.textContent = `+${flag.points}`;
        item.append(icon, copy, points);
        els.flagList.append(item);
      });
    }

    els.analysisSummary.textContent = report.summary;
    els.verifyList.replaceChildren();
    report.verification.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      els.verifyList.append(li);
    });

    window.currentJobCheckReport = { ...report, caseId };
    if (!options.skipHistory && document.querySelector('#saveConsent').checked) saveHistory(report, caseId);
    if (!options.noScroll && window.matchMedia("(max-width: 1020px)").matches) {
      els.reportCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function runAnalysis() {
    const inputs = normalizedInputs();
    if (!inputs.text && !inputs.url && !inputs.email) {
      els.formError.textContent = "Add a job message, URL, or sender email first.";
      els.jobText.focus();
      return;
    }
    if (inputs.email && !/^\S+@\S+\.\S+$/.test(inputs.email)) {
      switchTab("email");
      els.formError.textContent = "Enter the complete sender email address.";
      els.jobEmail.focus();
      return;
    }
    const report = analyze(inputs);
    renderReport(report, newCaseId());
  }

  function resetCase() {
    els.jobText.value = "";
    els.jobUrl.value = "";
    els.jobEmail.value = "";
    els.formError.textContent = "";
    els.caseId.textContent = "NEW CASE";
    els.reportState.textContent = "AWAITING EVIDENCE";
    els.reportCard.classList.remove("risk-low", "risk-medium", "risk-high", "risk-unknown");
    document.querySelector('#saveConsent').checked = false;
    els.meterFill.style.width = "0";
    els.emptyReport.hidden = false;
    els.reportResults.hidden = true;
    switchTab("text");
    updateInputState();
    window.currentJobCheckReport = null;
    els.jobText.focus();
  }

  function reportTitle(report) {
    if (report.inputs.text) {
      const firstLine = report.inputs.text.split(/\n|\.|!/)[0].trim();
      return firstLine.slice(0, 72) || "Job message check";
    }
    return report.urlDomain || report.emailDomain || "Job offer check";
  }

  function readHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveHistory(report, caseId) {
    const item = {
      ...report,
      caseId,
      title: reportTitle(report),
      createdAt: new Date().toISOString()
    };
    const history = readHistory().filter((entry) => entry.caseId !== caseId);
    history.unshift(item);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 9))); } catch (_) { showToast('Storage unavailable. This report was not saved.'); }
    renderHistory();
  }

  function renderHistory() {
    const history = readHistory();
    els.historyList.replaceChildren();
    els.historyEmpty.hidden = history.length > 0;
    els.clearHistoryBtn.hidden = history.length === 0;
    history.forEach((entry) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "history-item";
      button.setAttribute("aria-label", `Open ${entry.caseId}, risk score ${entry.score}`);
      const score = document.createElement("span");
      score.className = `history-score ${entry.level}`;
      score.textContent = entry.score;
      const copy = document.createElement("span");
      copy.className = "history-copy";
      const title = document.createElement("strong");
      title.textContent = entry.title;
      const meta = document.createElement("small");
      meta.textContent = `${entry.label} · ${new Date(entry.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;
      copy.append(title, meta);
      const arrow = document.createElement("span");
      arrow.className = "history-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "›";
      button.append(score, copy, arrow);
      button.addEventListener("click", () => {
        els.jobText.value = entry.inputs.text || "";
        els.jobUrl.value = entry.inputs.url || "";
        els.jobEmail.value = entry.inputs.email || "";
        updateInputState();
        renderReport(entry, entry.caseId, { skipHistory: true });
        els.reportCard.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      els.historyList.append(button);
    });
  }

  function copyReport() {
    const report = window.currentJobCheckReport;
    if (!report) return;
    const lines = [
      `JOBCHECK REPORT — ${report.caseId}`,
      `Risk score: ${report.score}/100 (${report.label})`,
      "",
      "Warning signs:",
      ...(report.flags.length ? report.flags.map((flag) => `- ${flag.title}: ${flag.detail}`) : ["- No rule-based warning signs matched."]),
      "",
      "Investigator's notes:",
      report.summary,
      "",
      "Verify before acting:",
      ...report.verification.map((step) => `- ${step}`),
      "",
      "JobCheck is a first check, not proof that an offer is genuine or fraudulent."
    ];
    const text = lines.join("\n");
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => showToast("Report copied")).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    try { document.execCommand("copy"); showToast("Report copied"); } catch (_) { showToast("Could not copy report"); }
    area.remove();
  }

  let toastTimer;
  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add("show");
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2200);
  }

  function loadSample() {
    els.jobText.value = "URGENT WORK FROM HOME OFFER! You are selected immediately without interview. Earn ₹35,000 per week with no experience required. Pay a refundable registration fee of ₹2,999 today to confirm your slot. Send your Aadhaar, bank account details and OTP on WhatsApp. Click the link and install our verification app.";
    els.jobUrl.value = "http://company-careers-job.xyz/apply";
    els.jobEmail.value = "fast.hiring.team@gmail.com";
    updateInputState();
    switchTab("text");
    els.jobText.focus();
    showToast("Scam example loaded");
  }

  els.analyzeBtn.addEventListener("click", runAnalysis);
  els.sampleBtn.addEventListener("click", loadSample);
  els.newCaseBtn.addEventListener("click", resetCase);
  els.copyBtn.addEventListener("click", copyReport);
  els.howBtn.addEventListener("click", () => els.howSection.scrollIntoView({ behavior: "smooth" }));
  els.clearHistoryBtn.addEventListener("click", () => {
    if (!window.confirm("Clear all saved JobCheck reports from this device?")) return;
    try { localStorage.removeItem(HISTORY_KEY); } catch (_) { showToast('Could not clear history: browser storage is unavailable.'); return; }
    renderHistory();
    showToast("History cleared");
  });

  [els.jobText, els.jobUrl, els.jobEmail].forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") runAnalysis();
    });
  });

  updateInputState();
  renderHistory();
})();
