// Analytics Tracking & UTM Persistence Script
// Debug: analytics loader present
console.debug('[cprep] analytics.js loaded');

(function () {
  const SESSION_STORAGE_KEY = 'cprep_session_id';
  const UTM_STORAGE_KEY = 'cprep_utm_params';
  const UTM_EXPIRE_DAYS = 30;
  const MAX_DEBUG_EVENTS = 100;

  let abortController = new AbortController();

  function getSessionId() {
    let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
    return sessionId;
  }

  let cachedDeviceType = null;
  function getDeviceType() {
    if (cachedDeviceType) return cachedDeviceType;
    if (typeof window === 'undefined') return 'unknown';
    const width = window.innerWidth;
    if (width < 768) cachedDeviceType = 'mobile';
    else if (width < 1024) cachedDeviceType = 'tablet';
    else cachedDeviceType = 'desktop';
    return cachedDeviceType;
  }

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  let cachedUTMParams = null;
  function getUTMParams() {
    if (cachedUTMParams) return cachedUTMParams;

    const stored = getCookie(UTM_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.expiresAt && Date.now() < parsed.expiresAt) {
          cachedUTMParams = {
            utm_source: parsed.utm_source || null,
            utm_medium: parsed.utm_medium || null,
            utm_campaign: parsed.utm_campaign || null,
            utm_content: parsed.utm_content || null,
            utm_term: parsed.utm_term || null,
          };
          return cachedUTMParams;
        } else {
          deleteCookie(UTM_STORAGE_KEY);
        }
      } catch {
        deleteCookie(UTM_STORAGE_KEY);
      }
    }

    const utm_source = getQueryParam('utm_source');
    const utm_medium = getQueryParam('utm_medium');
    const utm_campaign = getQueryParam('utm_campaign');
    const utm_content = getQueryParam('utm_content');
    const utm_term = getQueryParam('utm_term');

    if (utm_source || utm_medium || utm_campaign || utm_content || utm_term) {
      const utmData = {
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        expiresAt: Date.now() + UTM_EXPIRE_DAYS * 24 * 60 * 60 * 1000,
      };
      setCookie(UTM_STORAGE_KEY, JSON.stringify(utmData), UTM_EXPIRE_DAYS);
      cachedUTMParams = { utm_source, utm_medium, utm_campaign, utm_content, utm_term };
      return cachedUTMParams;
    }

    cachedUTMParams = { utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null, utm_term: null };
    return cachedUTMParams;
  }

  function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }

  function getCookie(name) {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }
    return null;
  }

  function deleteCookie(name) {
    setCookie(name, '', -1);
  }

  function buildEventPayload(eventName, customParams = {}) {
    const utmParams = getUTMParams();
    const pagePath = window.location.pathname;
    const pageParam = pagePath === '/' ? 'home' : pagePath.split('/').filter(Boolean)[0] || 'other';

    return {
      event_name: eventName,
      page_slug: pagePath,
      page_type: pageParam,
      device_type: getDeviceType(),
      session_id: getSessionId(),
      event_timestamp: new Date().toISOString(),
      event_version: '1',
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
      utm_content: utmParams.utm_content,
      utm_term: utmParams.utm_term,
      consent_state: window.__cprep_consent_state || 'none',
      ...customParams,
    };
  }

  window.__cprepTrack = function (eventName, customParams = {}) {
    const payload = buildEventPayload(eventName, customParams);

    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, payload);
    }

    if (!window.__cprep_events) {
      window.__cprep_events = [];
    }
    if (window.__cprep_events.length >= MAX_DEBUG_EVENTS) {
      window.__cprep_events.shift();
    }
    window.__cprep_events.push(payload);
  };

  function trackPageView() {
    window.__cprepTrack('lp_view', { scroll_depth: 0 });
  }

  function trackScrollDepth() {
    const milestones = [25, 50, 75, 100];
    const tracked = new Set();
    const signal = abortController.signal;

    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
      milestones.forEach(milestone => {
        if (scrollPercent >= milestone && !tracked.has(milestone)) {
          tracked.add(milestone);
          window.__cprepTrack('page_scroll', { scroll_depth: milestone });
        }
      });
    }, { passive: true, signal });
  }

  function attachCTATracking() {
    const signal = abortController.signal;
    document.addEventListener('click', (e) => {
      const target = e.target;
      const button = target && target.closest ? target.closest('[data-track-cta]') : null;
      if (button) {
        const location = button.getAttribute('data-cta-location') || 'unknown';
        const text = button.textContent?.trim() || 'CTA';
        const href = button.getAttribute('href') || '#';
        window.__cprepTrack('cta_click', {
          cta_location: location,
          cta_text: text,
          cta_destination: href,
          button_position: 'above_fold',
        });
      }
    }, { capture: true, signal });
  }

  function attachSubjectTracking() {
    const signal = abortController.signal;
    document.addEventListener('click', (e) => {
      const target = e.target;
      const subjectCard = target && target.closest ? target.closest('[data-subject-card]') : null;
      if (subjectCard) {
        const subjectName = subjectCard.getAttribute('data-subject-name') || 'unknown';
        const subjectSlug = subjectCard.getAttribute('data-subject-slug') || 'unknown';
        window.__cprepTrack('subject_click', { subject_name: subjectName, subject_slug: subjectSlug });
      }
    }, { capture: true, signal });
  }

  function attachFAQTracking() {
    const signal = abortController.signal;
    document.addEventListener('change', (e) => {
      const target = e.target;
      const hasDetails = target instanceof HTMLDetailsElement || (target && target.closest && target.closest('details'));
      if (hasDetails) {
        const details = target instanceof HTMLDetailsElement ? target : target.closest('details');
        if (details) {
          const question = details.querySelector('summary')?.textContent?.trim() || 'unknown';
          const questionId = details.getAttribute('data-faq-id') || 'faq_' + Math.random().toString(36).substring(2, 11);
          window.__cprepTrack('faq_expand', { question_text: question, question_id: questionId });
        }
      }
    }, { capture: true, signal });

    document.addEventListener('click', (e) => {
      const target = e.target;
      const summary = target && target.closest ? target.closest('summary') : null;
      if (summary) {
        const details = summary.closest('details');
        if (details && details.hasAttribute('open')) {
          const question = summary.textContent?.trim() || 'unknown';
          const questionId = details.getAttribute('data-faq-id') || 'faq_' + Math.random().toString(36).substring(2, 11);
          window.__cprepTrack('faq_expand', { question_text: question, question_id: questionId });
        }
      }
    }, { capture: true, signal });
  }

  function attachSignupTracking() {
    const signal = abortController.signal;
    document.addEventListener('click', (e) => {
      const target = e.target;
      const signupLink = target && target.closest ? target.closest('[data-track-signup]') : null;
      if (signupLink) {
        window.__cprepTrack('start_signup', { signup_source: signupLink.getAttribute('data-signup-source') || 'cta', signup_page: window.location.pathname });
      }
    }, { capture: true, signal });
  }

  function cleanup() {
    abortController.abort();
    abortController = new AbortController();
    cachedDeviceType = null;
    cachedUTMParams = null;
  }

  function init() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    cleanup();
    trackPageView();
    trackScrollDepth();
    attachCTATracking();
    attachSubjectTracking();
    attachFAQTracking();
    attachSignupTracking();

    window.__cprepGetUTM = getUTMParams;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('astro:after-swap', init);
})();
