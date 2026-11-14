'use strict';
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.DojoNewsListing = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
    const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
    const compareText = (a, b) => a < b ? -1 : a > b ? 1 : 0;
    const articleKey = article => String(article.slug || article.id || '');
    function compareArticles(a, b) {
        return Number(b.featured === true) - Number(a.featured === true)
            || compareText(String(b.datePublished || b.date || ''), String(a.datePublished || a.date || ''))
            || compareText(articleKey(a), articleKey(b));
    }
    function selectArticles(articles, category = 'all', search = '') {
        const query = search.trim().toLowerCase();
        return articles.filter(article => article.status !== 'draft'
            && (category === 'all' || article.category === category)
            && (!query || String(article.title || '').toLowerCase().includes(query)
                || String(article.excerpt || '').toLowerCase().includes(query)))
            .sort(compareArticles);
    }
    const renderCard = (input, index = 0) => {
        const article = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, typeof value === 'string' ? escapeHtml(value) : value]));
        const isFeatured = article.featured === true;
        const isGoldTheme = article.category === 'Aniversario' || article.id.includes('aniversario');
        const themeClass = isGoldTheme ? 'gold-theme' : '';
        const badgeStripText = article.badgeText || (isGoldTheme ? '🏆 DESTACADO DEL MES' : '🔥 NOTICIA DESTACADA');
        const badgeTag = isGoldTheme ? '🏆' : '📜';
        const articleSlug = article.slug || article.id;
        const articleUrl = `/noticias/${articleSlug}/`;
        const hospitalPhoto = articleSlug === 'karate-defensa-personal-hospital-quilpue' && article.image.includes('Hospital-Quilpue/');
        const photoAttributes = hospitalPhoto ? `srcset="${article.imageSmall} 800w, ${article.image} 1280w" sizes="(max-width: 768px) 100vw, 50vw" width="1280" height="720" decoding="async"` : '';

        if (isFeatured) {
            return `
                <article class="news-card news-hero-card ${themeClass}" data-id="${article.id}" style="grid-column: 1 / -1;">
                    <div class="news-hero-badge-strip">
                        <span>${badgeStripText}</span>
                        <span>JKA CHILE 2026</span>
                    </div>
                    <div class="news-hero-grid">
                        <div class="news-hero-img-wrapper">
                            <img src="${article.image}" alt="${article.imageAlt || article.title}" class="news-hero-img" loading="lazy" ${photoAttributes}>
                            <span class="news-category-badge badge-red">${hospitalPhoto ? '' : badgeTag + ' '}${article.category}</span>
                        </div>
                        <div class="news-hero-body">
                            <div class="news-card-meta">
                                <span class="news-date">📅 ${article.dateFormatted}</span>
                                <span class="news-read-time">⏱️ ${article.readTime}</span>
                            </div>
                            <h3 class="news-hero-title">${article.title}</h3>
                            <p class="news-hero-excerpt">${article.excerpt}</p>
                            <div class="news-card-footer-action">
                                <a href="${articleUrl}" class="btn btn-primary news-read-more-btn">
                                    Leer noticia completa ➔
                                </a>
                            </div>
                        </div>
                    </div>
                </article>
            `;
        }

        return `
            <article class="news-card modern-card" data-id="${article.id}">
                <div class="news-card-img-wrapper">
                    <img src="${article.image}" alt="${article.title}" class="news-card-img" loading="lazy">
                    <span class="news-category-badge">🏆 ${article.category}</span>
                </div>
                <div class="news-card-body">
                    <div class="news-card-meta">
                        <span class="news-date">📅 ${article.dateFormatted}</span>
                        <span class="news-read-time">⏱️ ${article.readTime}</span>
                    </div>
                    <h3 class="news-card-title">${article.title}</h3>
                    <p class="news-card-excerpt">${article.excerpt}</p>
                    <a href="${articleUrl}" class="btn btn-primary news-read-more-btn">Leer noticia completa ➔</a>
                </div>
            </article>
        `;
    };


    const renderCards = articles => selectArticles(articles).map(renderCard).join('');
    return { compareArticles, selectArticles, renderCard, renderCards };
});
