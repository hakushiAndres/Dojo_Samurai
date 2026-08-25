(function () {
    'use strict';

    const STORAGE_KEY = 'dojo_analytics_consent';
    const CONSENT_VERSION = 1;
    const GA4_ID = 'G-J390P89D7E';
    let analyticsLoaded = false;

    const readConsent = () => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (saved && saved.version === CONSENT_VERSION && ['granted', 'denied'].includes(saved.choice)) {
                return saved.choice;
            }
        } catch (_) {
            // Storage may be unavailable or contain an obsolete value.
        }
        return null;
    };

    const saveConsent = (choice) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                choice,
                version: CONSENT_VERSION,
                updatedAt: new Date().toISOString()
            }));
        } catch (_) {
            // The choice still applies for the current page when storage is unavailable.
        }
    };

    const appendScript = (src, attributes = {}) => {
        if (document.querySelector(`script[src="${src}"]`)) return;
        const script = document.createElement('script');
        script.src = src;
        Object.entries(attributes).forEach(([name, value]) => {
            if (value === true) script.setAttribute(name, '');
            else script.setAttribute(name, value);
        });
        document.head.appendChild(script);
    };

    const loadAnalytics = () => {
        if (analyticsLoaded) return;
        analyticsLoaded = true;

        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', GA4_ID);

        appendScript(`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`, { async: true });
        appendScript('/_vercel/insights/script.js', { defer: true });
        appendScript('/_vercel/speed-insights/script.js', { defer: true });

        document.dispatchEvent(new CustomEvent('dojo:analytics-ready'));
    };

    const removeBanner = () => {
        document.getElementById('analytics-consent-banner')?.remove();
    };

    const applyChoice = (choice) => {
        saveConsent(choice);
        removeBanner();
        if (choice === 'denied' && analyticsLoaded) {
            window.location.reload();
            return;
        }
        if (choice === 'granted') loadAnalytics();
        document.dispatchEvent(new CustomEvent('dojo:consent-updated', { detail: { choice } }));
    };

    const showBanner = () => {
        if (document.getElementById('analytics-consent-banner')) return;
        const banner = document.createElement('aside');
        banner.id = 'analytics-consent-banner';
        banner.className = 'consent-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-modal', 'false');
        banner.setAttribute('aria-labelledby', 'consent-title');
        banner.innerHTML = `
            <div class="consent-banner__content">
                <div class="consent-banner__copy">
                    <p id="consent-title" class="consent-banner__title">Privacidad y analítica</p>
                    <p>Utilizamos analítica opcional para entender cómo se usa el sitio y mejorar su funcionamiento. Puedes aceptar o rechazarla; el sitio seguirá funcionando en ambos casos.</p>
                    <a href="/politica-de-privacidad">Política de privacidad</a>
                </div>
                <div class="consent-banner__actions">
                    <button type="button" class="consent-btn consent-btn--accept" data-consent-choice="granted">Aceptar analítica</button>
                    <button type="button" class="consent-btn consent-btn--reject" data-consent-choice="denied">Rechazar</button>
                </div>
            </div>`;
        banner.addEventListener('click', (event) => {
            const button = event.target.closest('[data-consent-choice]');
            if (button) applyChoice(button.dataset.consentChoice);
        });
        document.body.appendChild(banner);
    };

    window.DojoConsent = {
        getChoice: readConsent,
        open: showBanner,
        reset: () => {
            try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* no-op */ }
            showBanner();
        }
    };

    const initialize = () => {
        const choice = readConsent();
        if (choice === 'granted') loadAnalytics();
        else if (!choice) showBanner();

        document.querySelectorAll('[data-open-consent]').forEach((button) => {
            button.addEventListener('click', showBanner);
        });
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
    else initialize();
})();
