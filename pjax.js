(() => {
  "use strict";

  if (window.__USM_PJAX_READY__) return;
  window.__USM_PJAX_READY__ = true;

  const PUBLIC_PAGES = new Set([
    "/",
    "/index.html",
    "/contact.html",
    "/presse.html",
    "/mentions.html",
    "/page-dynamique.html"
  ]);

  const PAGE_CACHE = new Map();
  let activeController = null;
  let navigationId = 0;

  const sameOrigin = (url) => url.origin === window.location.origin;

  function normalizePath(pathname) {
    if (!pathname || pathname === "/") return "/";
    return pathname.endsWith("/") ? `${pathname}index.html` : pathname;
  }

  function isPublicPage(url) {
    const path = normalizePath(url.pathname);
    return PUBLIC_PAGES.has(path);
  }

  function isSameDocument(url) {
    return sameOrigin(url) &&
      normalizePath(url.pathname) === normalizePath(window.location.pathname) &&
      url.search === window.location.search;
  }


  function isServiceSoftNavigation(url) {
    if (!sameOrigin(url)) return false;
    if (normalizePath(window.location.pathname) !== "/page-dynamique.html") return false;
    if (normalizePath(url.pathname) !== "/page-dynamique.html") return false;
    if (!url.searchParams.get("id")) return false;
    if (!document.body.classList.contains("service-page")) return false;
    return true;
  }

  function tryServiceSoftNavigation(url, options = {}) {
    if (!isServiceSoftNavigation(url)) return false;
    const serviceApi = window.USMServicePage;
    if (!serviceApi || typeof serviceApi.navigateToService !== "function") return false;
    if (typeof serviceApi.canSoftNavigate === "function" && !serviceApi.canSoftNavigate(url.href)) return false;
    return serviceApi.navigateToService(url.href, options) === true;
  }

  function shouldHandleLink(link, event) {
    if (!link || event.defaultPrevented) return false;
    if (event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (link.target && link.target !== "_self") return false;
    if (link.hasAttribute("download") || link.dataset.noPjax === "true") return false;

    const href = link.getAttribute("href");
    if (!href || href === "#" || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return false;

    let url;
    try { url = new URL(href, window.location.href); }
    catch (_) { return false; }

    if (!sameOrigin(url)) return false;
    if (!isPublicPage(url)) return false;

    // Same-page anchors stay outside PJAX so the custom centered scroll on index
    // remains in charge and does not fight a second scroll handler.
    if (url.hash && isSameDocument(url)) return false;

    return url;
  }

  function setLoading(isLoading) {
    document.documentElement.classList.toggle("usm-pjax-loading", isLoading);
    document.documentElement.setAttribute("aria-busy", isLoading ? "true" : "false");
  }

  function applyAttributes(target, source) {
    Array.from(target.attributes).forEach((attr) => target.removeAttribute(attr.name));
    Array.from(source.attributes).forEach((attr) => target.setAttribute(attr.name, attr.value));
  }

  function syncMeta(selector, nextDoc) {
    const next = nextDoc.head.querySelector(selector);
    const current = document.head.querySelector(selector);

    if (!next && current) {
      current.remove();
      return;
    }
    if (!next) return;

    if (current) {
      current.setAttribute("content", next.getAttribute("content") || "");
    } else {
      document.head.appendChild(next.cloneNode(true));
    }
  }

  function syncHead(nextDoc, url) {
    document.title = nextDoc.title || document.title;

    [
      'meta[name="description"]',
      'meta[name="keywords"]',
      'meta[property="og:title"]',
      'meta[property="og:description"]',
      'meta[property="og:image"]',
      'meta[property="og:url"]',
      'meta[name="twitter:card"]'
    ].forEach((selector) => syncMeta(selector, nextDoc));

    let canonical = document.head.querySelector('link[rel="canonical"]');
    const nextCanonical = nextDoc.head.querySelector('link[rel="canonical"]');
    if (nextCanonical) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = nextCanonical.href;
    }

    const ogUrl = document.head.querySelector('meta[property="og:url"]');
    if (ogUrl && !nextDoc.head.querySelector('meta[property="og:url"]')) {
      ogUrl.content = url.href;
    }
  }

  function extractBody(nextDoc) {
    const nextBody = nextDoc.body.cloneNode(true);
    const deferredScripts = [];

    nextBody.querySelectorAll("script").forEach((script) => {
      const src = script.getAttribute("src") || "";
      if (src.includes("elfsightcdn.com")) deferredScripts.push(src);
      script.remove();
    });

    return { nextBody, deferredScripts };
  }


  const PERSISTENT_PAGE_SELECTORS = [
    "aside.sticky-social-bar",
    "header.navbar",
    "footer.usm-universal-footer"
  ];

  const PERSISTENT_MEDIA_SELECTORS = [
    "#nav-logo-dyn",
    "img.nav-logo-dyn",
    "#footer-logo-dyn"
  ];

  const STABLE_NAV_LOGO_KEY = "__USM_STABLE_NAV_LOGO_SRC__";

  function getMeaningfulImageSrc(img) {
    if (!img) return "";
    const attrSrc = (img.getAttribute("src") || "").trim();
    if (attrSrc) return attrSrc;

    const currentSrc = (img.currentSrc || "").trim();
    if (!currentSrc) return "";

    try {
      const currentUrl = new URL(currentSrc, window.location.href);
      const pageUrl = new URL(window.location.href);
      if (currentUrl.href === pageUrl.href) return "";
    } catch (_) {}

    return currentSrc;
  }

  function rememberNavLogoSrc(img) {
    const src = getMeaningfulImageSrc(img);
    if (!src) return;
    window[STABLE_NAV_LOGO_KEY] = src;
  }

  function restoreNavLogoSrc(img) {
    if (!img) return;
    const currentSrc = getMeaningfulImageSrc(img);
    if (currentSrc) {
      rememberNavLogoSrc(img);
      return;
    }

    const cachedSrc = window[STABLE_NAV_LOGO_KEY];
    if (cachedSrc) img.setAttribute("src", cachedSrc);
  }

  function protectCurrentNavLogo() {
    restoreNavLogoSrc(document.getElementById("nav-logo-dyn"));
  }

  function isPersistentElement(node) {
    return node?.nodeType === Node.ELEMENT_NODE && PERSISTENT_PAGE_SELECTORS.some((selector) => node.matches(selector));
  }

  function isDisposableBodyNode(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.matches("script")) return false;
      return !isPersistentElement(node);
    }
    return node.nodeType === Node.TEXT_NODE || node.nodeType === Node.COMMENT_NODE;
  }

  function copyMediaAttributesWithoutReload(currentMedia, nextMedia) {
    if (!currentMedia || !nextMedia) return;

    const currentSrc = currentMedia.getAttribute('src') || '';
    const nextSrc = nextMedia.getAttribute('src') || '';

    Array.from(currentMedia.attributes).forEach((attr) => {
      if (attr.name !== 'src' && attr.name !== 'srcset') currentMedia.removeAttribute(attr.name);
    });

    Array.from(nextMedia.attributes).forEach((attr) => {
      if ((attr.name === 'src' || attr.name === 'srcset') && !attr.value) return;
      currentMedia.setAttribute(attr.name, attr.value);
    });

    if (!nextSrc && currentSrc) currentMedia.setAttribute('src', currentSrc);
    currentMedia.dataset.noSmooth = 'true';
    currentMedia.classList.remove('dynamic-img', 'loaded', 'usm-smooth-image', 'usm-smooth-image-ready');
  }

  function replaceWithPreservedMedia(currentElement, nextElement) {
    if (!currentElement || !nextElement) return;

    const nextClone = nextElement.cloneNode(true);

    PERSISTENT_MEDIA_SELECTORS.forEach((selector) => {
      const currentMedia = currentElement.querySelector(selector);
      const nextMedia = nextClone.querySelector(selector);
      if (!currentMedia || !nextMedia) return;

      // Keep already decoded logo nodes alive so they do not flash/reload on PJAX navigation.
      copyMediaAttributesWithoutReload(currentMedia, nextMedia);
      nextMedia.parentNode.replaceChild(currentMedia, nextMedia);
    });

    currentElement.replaceWith(nextClone);
  }

  function syncNodeAttributes(currentNode, nextNode) {
    if (!currentNode || !nextNode) return;
    Array.from(currentNode.attributes).forEach((attr) => currentNode.removeAttribute(attr.name));
    Array.from(nextNode.attributes).forEach((attr) => currentNode.setAttribute(attr.name, attr.value));
  }

  function syncNavbarState(currentElement, nextElement) {
    if (!currentElement || !nextElement) return;

    const currentLogo = currentElement.querySelector("#nav-logo-dyn");
    rememberNavLogoSrc(currentLogo);

    // Keep the existing topbar DOM node alive, but refresh its navigation state.
    // Previous patch only copied classes, so a header coming from index.html kept href="#agence"
    // on contact/presse/mentions and the topbar looked broken outside the homepage.
    const currentItems = Array.from(currentElement.querySelectorAll('a[href], button, select'));
    const nextItems = Array.from(nextElement.querySelectorAll('a[href], button, select'));

    currentItems.forEach((currentNode, index) => {
      const nextNode = nextItems[index];
      if (!nextNode || currentNode.tagName !== nextNode.tagName) return;
      syncNodeAttributes(currentNode, nextNode);

      if (currentNode.matches('select') && nextNode.matches('select')) {
        currentNode.innerHTML = nextNode.innerHTML;
        currentNode.value = localStorage.getItem('usm_lang') || nextNode.value || currentNode.value;
      }
    });

    const currentMobileMenu = currentElement.querySelector('#nav-links');
    if (currentMobileMenu) currentMobileMenu.classList.remove('active');

    restoreNavLogoSrc(currentLogo);
  }

  function syncPersistentChrome(nextBody) {
    PERSISTENT_PAGE_SELECTORS.forEach((selector) => {
      const currentElement = document.body.querySelector(selector);
      const nextElement = nextBody.querySelector(selector);

      if (currentElement && nextElement && selector === 'header.navbar') {
        // The top bar must stay physically fixed during PJAX transitions.
        // Replacing it made the logo re-animate and the blurred background pulse.
        syncNavbarState(currentElement, nextElement);
        return;
      }

      if (currentElement && nextElement) {
        replaceWithPreservedMedia(currentElement, nextElement);
        return;
      }

      if (!currentElement && nextElement) {
        const firstScript = document.body.querySelector("script");
        document.body.insertBefore(nextElement.cloneNode(true), firstScript);
      }
    });
  }

  function swapPageContent(nextBody) {
    Array.from(document.body.childNodes).forEach((node) => {
      if (isDisposableBodyNode(node)) node.remove();
    });

    const nextContentNodes = Array.from(nextBody.childNodes).filter(isDisposableBodyNode);
    const footer = document.body.querySelector("footer.usm-universal-footer");
    const firstScript = document.body.querySelector("script");
    const insertionPoint = footer || firstScript;

    nextContentNodes.forEach((node) => {
      document.body.insertBefore(node.cloneNode(true), insertionPoint);
    });
  }

  function loadDeferredScripts(srcList) {
    srcList.forEach((src) => {
      const absolute = new URL(src, window.location.href).href;
      const existing = Array.from(document.scripts).some((scriptNode) => scriptNode.src === absolute);
      if (existing) {
        if (window.eapps && typeof window.eapps.init === "function") {
          try { window.eapps.init(); } catch (_) {}
        }
        return;
      }

      const script = document.createElement("script");
      script.src = absolute;
      script.async = true;
      script.dataset.pjaxExternal = absolute;
      document.head.appendChild(script);
    });
  }

  async function fetchPage(url) {
    const key = url.href;
    if (PAGE_CACHE.has(key)) return PAGE_CACHE.get(key);

    if (activeController) activeController.abort();
    activeController = new AbortController();

    const response = await fetch(url.href, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "Accept": "text/html",
        "X-PJAX": "true"
      },
      signal: activeController.signal
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    PAGE_CACHE.set(key, html);
    return html;
  }

  function scrollAfterNavigation(url, options = {}) {
    const hash = url.hash;
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const target = document.getElementById(id) || document.querySelector(hash);
      if (target) {
        setTimeout(() => target.scrollIntoView({ behavior: options.instant ? "auto" : "smooth", block: "start" }), 120);
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: options.instant ? "auto" : "smooth" });
  }

  async function navigateTo(rawUrl, options = {}) {
    const url = new URL(rawUrl, window.location.href);
    const currentNoHash = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    const targetNoHash = `${url.origin}${url.pathname}${url.search}`;

    if (currentNoHash === targetNoHash && url.hash) {
      history.pushState({ usmPjax: true }, "", url.href);
      scrollAfterNavigation(url);
      return;
    }

    const navId = ++navigationId;

    try {
      setLoading(true);
      document.dispatchEvent(new CustomEvent("usm:pjax-before", { detail: { url } }));

      const html = await fetchPage(url);
      if (navId !== navigationId) return;

      const nextDoc = new DOMParser().parseFromString(html, "text/html");
      if (!nextDoc.body) throw new Error("Document PJAX invalide.");

      const { nextBody, deferredScripts } = extractBody(nextDoc);

      syncHead(nextDoc, url);
      applyAttributes(document.body, nextBody);
      syncPersistentChrome(nextBody);
      swapPageContent(nextBody);
      document.body.classList.add("pjax-page-enter");

      if (!options.replace) history.pushState({ usmPjax: true }, "", url.href);
      else history.replaceState({ usmPjax: true }, "", url.href);

      loadDeferredScripts(deferredScripts);

      requestAnimationFrame(() => {
        document.dispatchEvent(new CustomEvent("usm:page-ready", { detail: { url } }));
        document.dispatchEvent(new CustomEvent("usm:pjax-ready", { detail: { url } }));
        scrollAfterNavigation(url, { instant: options.popstate });
        setTimeout(() => document.body.classList.remove("pjax-page-enter"), 360);
      });
    } catch (error) {
      if (error.name === "AbortError") return;
      console.warn("PJAX indisponible, navigation classique:", error);
      window.location.href = url.href;
    } finally {
      setTimeout(() => setLoading(false), 180);
    }
  }

  function prefetch(rawUrl) {
    try {
      const url = new URL(rawUrl, window.location.href);
      if (!sameOrigin(url) || !isPublicPage(url) || PAGE_CACHE.has(url.href)) return;
      fetch(url.href, {
        method: "GET",
        credentials: "same-origin",
        headers: { "Accept": "text/html", "X-PJAX-Prefetch": "true" }
      })
        .then((response) => response.ok ? response.text() : "")
        .then((html) => { if (html) PAGE_CACHE.set(url.href, html); })
        .catch(() => {});
    } catch (_) {}
  }

  document.addEventListener("load", (event) => {
    const target = event.target;
    if (target?.matches?.("#nav-logo-dyn")) rememberNavLogoSrc(target);
  }, true);

  document.addEventListener("usm:page-ready", protectCurrentNavLogo);
  document.addEventListener("usm:pjax-ready", protectCurrentNavLogo);
  protectCurrentNavLogo();

  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[href]");

    if (link && !event.defaultPrevented) {
      try {
        const serviceUrl = new URL(link.getAttribute("href") || "", window.location.href);
        if (tryServiceSoftNavigation(serviceUrl)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
      } catch (_) {}
    }

    const url = shouldHandleLink(link, event);
    if (!url) return;

    event.preventDefault();
    navigateTo(url.href);
  }, true);

  ["pointerenter", "touchstart", "focusin"].forEach((eventName) => {
    document.addEventListener(eventName, (event) => {
      const link = event.target.closest?.("a[href]");
      const url = link ? shouldHandleLink(link, { ...event, button: 0 }) : null;
      if (url) prefetch(url.href);
    }, { capture: true, passive: true });
  });

  window.addEventListener("popstate", () => {
    const url = new URL(window.location.href);
    if (!isPublicPage(url)) {
      window.location.reload();
      return;
    }
    if (tryServiceSoftNavigation(url, { popstate: true })) return;
    navigateTo(url.href, { replace: true, popstate: true });
  });

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) document.dispatchEvent(new CustomEvent("usm:page-ready", { detail: { url: new URL(window.location.href) } }));
  });
})();