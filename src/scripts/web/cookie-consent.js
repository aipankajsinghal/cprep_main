// Cookie consent logic: stores a JSON cookie for preferences (1 year)
(function () {
  const COOKIE_NAME = 'cprep_cookie_consent';
  const COOKIE_DAYS = 365;
  // Configure your Microsoft Clarity Project ID here (e.g. 'abcd1234')
  // Set to the project ID provided in your snippet.
  const CLARITY_ID = 'v4aln8tcde';

  function readCookie(name) {
    const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return m ? decodeURIComponent(m.pop()) : null;
  }

  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = 'expires=' + d.toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + ';' + expires + ';path=/;SameSite=Lax;Secure';
  }

  function getConsent() {
    try {
      const c = readCookie(COOKIE_NAME);
      return c ? JSON.parse(c) : null;
    } catch {
      return null;
    }
  }

  function saveConsent(obj) {
    setCookie(COOKIE_NAME, JSON.stringify(obj), COOKIE_DAYS);
  }

  function applyConsent(consent) {
    // Hook for enabling/disabling third-party scripts.
    // Example: enable analytics only if consent.analytics === true
    if (consent && consent.analytics) {
      window.__cprep_analytics_enabled = true;
      // Load analytics providers only after consent
      if (CLARITY_ID) loadClarity();
      // Load Google Analytics (gtag) if measurement id exposed
      loadGtag();
    } else {
      window.__cprep_analytics_enabled = false;
    }
    // Marketing flag similarly
    window.__cprep_marketing_enabled = !!(consent && consent.marketing);
  }

  function hideBanner() {
    const el = document.getElementById('cookie-consent');
    const backdrop = document.getElementById('cookie-consent-backdrop');
    if (el) { el.hidden = true; el.style.display = 'none'; }
    if (backdrop) { backdrop.style.display = 'none'; backdrop.setAttribute('aria-hidden', 'true'); }
  }

  function showBanner() {
    const el = document.getElementById('cookie-consent');
    const backdrop = document.getElementById('cookie-consent-backdrop');
    if (el) { el.hidden = false; el.style.display = 'flex'; }
    if (backdrop) { backdrop.style.display = 'block'; backdrop.setAttribute('aria-hidden', 'false'); }
  }

  // Load Microsoft Clarity (safe, idempotent)
  function loadClarity() {
    try {
      if (!CLARITY_ID) return;
      if (window.__clarity_loaded) return;
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;t.setAttribute('data-clarity', i);
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", CLARITY_ID);
      window.__clarity_loaded = true;
    } catch {
      // Clarity failed to load; non-critical
    }
  }

  // Load Google Analytics (gtag) dynamically after consent
  function loadGtag() {
    try {
      if (!window.__GA_MEASUREMENT_ID) return;
      if (window.__ga_loaded) return;
      const id = window.__GA_MEASUREMENT_ID;
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
      document.head.appendChild(s);

      window.dataLayer = window.dataLayer || [];
      function gtag(){window.dataLayer.push(arguments);} // eslint-disable-line no-inner-declarations
      window.gtag = window.gtag || gtag;
      window.gtag('js', new Date());
      window.gtag('config', id, { send_page_view: false });
      window.__ga_loaded = true;
    } catch (e) {
      // Non-critical if GA fails to load
    }
  }

  function init() {
    // Guard against duplicate initialization on View Transitions
    if (window.__cprep_cookie_consent_initialized) {
      // Re-apply consent state (banner already handled)
      const existing = getConsent();
      if (existing) {
        applyConsent(existing);
        hideBanner();
      }
      return;
    }
    window.__cprep_cookie_consent_initialized = true;

    const existing = getConsent();
    if (existing) {
      applyConsent(existing);
      // ensure banner is hidden when consent already exists
      hideBanner();
      return; // do not show banner
    }

    // show banner
    showBanner();

    const btnAccept = document.getElementById('btn-accept');
    const btnReject = document.getElementById('btn-reject');
    const btnManage = document.getElementById('btn-manage');
    const prefs = document.getElementById('cookie-preferences');
    const analytics = document.getElementById('consent-analytics');
    const marketing = document.getElementById('consent-marketing');

    if (btnManage) {
      btnManage.addEventListener('click', () => {
        if (!prefs) return;
        const open = prefs.style.display === 'flex';
        prefs.style.display = open ? 'none' : 'flex';
        prefs.setAttribute('aria-hidden', (!open).toString());
      });
    }

    if (btnAccept) {
      btnAccept.addEventListener('click', () => {
        const consent = { necessary: true, analytics: true, marketing: true, ts: Date.now() };
        saveConsent(consent);
        applyConsent(consent);
        hideBanner();
      });
    }

    if (btnReject) {
      btnReject.addEventListener('click', () => {
        const consent = { necessary: true, analytics: false, marketing: false, ts: Date.now() };
        saveConsent(consent);
        applyConsent(consent);
        hideBanner();
      });
    }

    // toggles inside preferences
    if (analytics) analytics.addEventListener('change', () => {
      const a = !!analytics.checked;
      const m = !!(marketing && marketing.checked);
      const consent = { necessary: true, analytics: a, marketing: m, ts: Date.now() };
      saveConsent(consent);
      applyConsent(consent);
    });

    if (marketing) marketing.addEventListener('change', () => {
      const a = !!(analytics && analytics.checked);
      const m = !!marketing.checked;
      const consent = { necessary: true, analytics: a, marketing: m, ts: Date.now() };
      saveConsent(consent);
      applyConsent(consent);
    });

    // clicking backdrop hides preferences but not banner
    const backdrop = document.getElementById('cookie-consent-backdrop');
    if (backdrop) backdrop.addEventListener('click', () => {
      const p = document.getElementById('cookie-preferences');
      if (p && p.style.display === 'flex') { p.style.display = 'none'; p.setAttribute('aria-hidden', 'true'); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-apply on Astro View Transitions
  document.addEventListener('astro:after-swap', init);
})();
