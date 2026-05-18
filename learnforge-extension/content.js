// content.js — LearnForge Content Scraper
// Injected into the active tab to extract meaningful page content

(function () {
  "use strict";

  // ── Selectors to SKIP (noise) ─────────────────────────────────────────────
  const SKIP_SELECTORS = [
    "nav", "header", "footer", ".navbar", ".nav", ".header", ".footer",
    ".sidebar", ".side-nav", ".breadcrumb", ".breadcrumbs",
    ".cookie", ".cookie-banner", ".consent", ".gdpr",
    ".ad", ".advertisement", ".banner",
    ".comment", ".comments", ".social-share", ".share-buttons",
    "script", "style", "noscript", "iframe",
    ".pagination", ".pager",
    ".menu", ".dropdown", "[role='navigation']", "[role='banner']",
    ".skip-link", ".skip-to", "#skip",
    ".toast", ".notification-bar", ".alert-banner",
  ];

  // ── Selectors to PREFER (content-rich) ───────────────────────────────────
  const CONTENT_SELECTORS = [
    // Generic content areas
    "article", "main", "[role='main']", ".content", ".main-content",
    ".article-body", ".post-content", ".entry-content",

    // TryHackMe specific
    ".room-task", ".task-description", ".task-content",
    ".question-hint", ".room-content", "[class*='task']",
    "[class*='room']", "[class*='question']",

    // HackTheBox
    ".challenge-description", ".writeup", "[class*='challenge']",
    "[class*='machine']",

    // PortSwigger / Web Security Academy
    ".section-content", ".lab-instructions", "[class*='lab']",
    "[class*='learning']",

    // MDN
    ".article-content", "#content", ".main-page-content",

    // LeetCode
    "[class*='description']", "[class*='content']",

    // MS Learn
    ".content-container", ".module-content", ".unit-body",
    "[class*='module']", "[class*='unit']",

    // Coursera
    ".rc-Passage", ".rc-Body", "[class*='lesson']",

    // Generic fallback
    ".lesson", ".course-content", ".tutorial",
    ".documentation", ".guide", ".learn",
  ];

  // ── Headings and text elements to extract ────────────────────────────────
  const TEXT_TAGS = ["h1","h2","h3","h4","h5","h6","p","li","dt","dd","blockquote","pre","code","td","th"];

  function isHidden(el) {
    const style = window.getComputedStyle(el);
    return style.display === "none"
      || style.visibility === "hidden"
      || style.opacity === "0"
      || el.offsetParent === null;
  }

  function shouldSkip(el) {
    for (const sel of SKIP_SELECTORS) {
      try {
        if (el.matches?.(sel) || el.closest?.(sel)) return true;
      } catch (_) {}
    }
    return false;
  }

  function extractText(root) {
    const chunks = [];
    const seen = new Set();

    // Walk all relevant text nodes
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode(node) {
          if (shouldSkip(node)) return NodeFilter.FILTER_REJECT;
          if (isHidden(node)) return NodeFilter.FILTER_SKIP;
          if (TEXT_TAGS.includes(node.tagName?.toLowerCase())) return NodeFilter.FILTER_ACCEPT;
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      const text = node.innerText?.trim() || node.textContent?.trim() || "";
      if (!text || text.length < 5) continue;
      if (seen.has(text)) continue;
      seen.add(text);

      const tag = node.tagName.toLowerCase();
      if (tag.startsWith("h")) {
        chunks.push(`\n## ${text}\n`);
      } else if (tag === "pre" || tag === "code") {
        chunks.push(`\`\`\`\n${text}\n\`\`\``);
      } else {
        chunks.push(text);
      }
    }

    return chunks.join("\n").replace(/\n{3,}/g, "\n\n");
  }

  function scrape() {
    let contentRoot = null;

    // Try preferred content selectors first
    for (const sel of CONTENT_SELECTORS) {
      try {
        const el = document.querySelector(sel);
        if (el && !isHidden(el)) {
          contentRoot = el;
          break;
        }
      } catch (_) {}
    }

    // Fallback to body
    if (!contentRoot) contentRoot = document.body;

    const rawText = extractText(contentRoot);
    const wordCount = rawText.split(/\s+/).filter(Boolean).length;

    // Also grab meta description for context
    const metaDesc = document.querySelector('meta[name="description"]')?.content || "";
    const pageTitle = document.title || document.querySelector("h1")?.textContent?.trim() || "";

    return {
      title: pageTitle,
      url: window.location.href,
      text: (metaDesc ? `Context: ${metaDesc}\n\n` : "") + rawText,
      wordCount,
    };
  }

  // Run scrape and return result
  return scrape();
})();
