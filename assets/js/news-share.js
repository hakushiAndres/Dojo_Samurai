(function () {
    'use strict';

    function initializeNewsShare() {
        document.querySelectorAll('.news-share').forEach(component => {
            if (component.dataset.initialized) return;
            const trigger = component.querySelector('.news-share__trigger');
            const menu = component.querySelector('.news-share__menu');
            const status = component.querySelector('.news-share__status');
            const options = [...menu.querySelectorAll('.news-share__option')];
            const canonical = document.querySelector('link[rel="canonical"]');
            const heading = document.querySelector('.single-article-header h1');
            if (!canonical || !heading) return;
            const url = new URL(canonical.href);
            const data = {
                title: heading.textContent.trim(),
                text: document.querySelector('meta[name="description"]')?.content || '',
                url: url.href
            };
            const slug = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop());
            options[0].href = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${data.title}\n${data.url}`)}`;
            options[1].href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`;
            component.dataset.initialized = 'true';
            component.hidden = false;
            let sharing = false;

            function track(method) {
                if (window.DojoConsent?.getChoice() === 'granted' && typeof window.gtag === 'function') {
                    window.gtag('event', 'share_news', {
                        content_type: 'noticia', content_slug: slug, share_method: method
                    });
                }
            }
            function close(restoreFocus = true) {
                menu.hidden = true;
                trigger.setAttribute('aria-expanded', 'false');
                if (restoreFocus) trigger.focus();
            }
            function open() {
                menu.hidden = false;
                trigger.setAttribute('aria-expanded', 'true');
                options[0].focus();
            }
            // Called in the click handler, before any await, to retain user activation.
            trigger.addEventListener('click', async () => {
                if (sharing) return;
                status.textContent = '';
                if (!menu.hidden) { close(); return; }
                try {
                    if (typeof navigator.share !== 'function'
                        || (typeof navigator.canShare === 'function' && !navigator.canShare(data))) {
                        open(); return;
                    }
                    sharing = true;
                    await navigator.share(data);
                    track('native');
                } catch (error) {
                    if (error?.name !== 'AbortError') open();
                } finally {
                    sharing = false;
                }
            });
            async function copyLink() {
                if (typeof navigator.clipboard?.writeText === 'function') {
                    await navigator.clipboard.writeText(data.url);
                    return;
                }
                // Legacy browsers: select only the canonical URL in a temporary field.
                const previousFocus = document.activeElement;
                const field = document.createElement('textarea');
                field.value = data.url;
                field.readOnly = true;
                field.className = 'news-share__copy-field';
                field.setAttribute('aria-label', 'Enlace de la noticia');
                document.body.appendChild(field);
                try {
                    field.focus({ preventScroll: true });
                    field.select();
                    field.setSelectionRange(0, field.value.length);
                    if (!document.execCommand('copy')) throw new Error('Copy failed');
                } finally {
                    field.remove();
                    previousFocus?.focus({ preventScroll: true });
                }
            }
            menu.addEventListener('click', async event => {
                const option = event.target.closest('[data-share-method]');
                if (!option) return;
                const method = option.dataset.shareMethod;
                status.textContent = '';
                if (method === 'copy') {
                    option.disabled = true;
                    try {
                        await copyLink();
                        status.textContent = 'Enlace copiado';
                        track('copy');
                    } catch (_) {
                        status.textContent = 'No se pudo copiar el enlace.';
                    } finally {
                        option.disabled = false;
                        close();
                    }
                } else {
                    track(method);
                    close();
                }
            });
            component.addEventListener('keydown', event => {
                if (event.key === 'Escape' && !menu.hidden) {
                    event.preventDefault();
                    close();
                }
            });
            document.addEventListener('click', event => {
                if (!menu.hidden && !component.contains(event.target)) {
                    // Preserve focus on an outside control the user just activated.
                    close(menu.contains(document.activeElement));
                }
            });
            component.addEventListener('focusout', event => {
                if (!menu.hidden && event.relatedTarget && !component.contains(event.relatedTarget)) close(false);
            });
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeNewsShare);
    else initializeNewsShare();
})();
