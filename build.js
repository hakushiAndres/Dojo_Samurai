const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');

console.log('Building static site distribution to dist/...');

// Ensure dist directory exists and is clean
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// List of files and folders to include in dist output
const staticItems = [
    'index.html',
    'noticias.html',
    'styles.css',
    'script.js',
    'analytics-consent.js',
    'politica-de-privacidad.html',
    'robots.txt',
    'site.webmanifest',
    'favicon.ico',
    'favicon-48x48.png',
    'favicon-96x96.png',
    'favicon-192x192.png',
    'apple-touch-icon.png',
    'og-image.jpg',
    'comunicado_oficial_popup.jpg',
    'assets',
    'public',
    'data'
];

staticItems.forEach(item => {
    const src = path.join(rootDir, item);
    const dest = path.join(distDir, item);

    if (fs.existsSync(src)) {
        const stat = fs.statSync(src);
        if (stat.isDirectory()) {
            copyDirSync(src, dest);
        } else {
            fs.copyFileSync(src, dest);
        }
        console.log(`✓ Copied ${item} -> dist/${item}`);
    }
});

function copyDirSync(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Generate individual static HTML pages for news articles
const noticiasJsonPath = path.join(rootDir, 'data', 'noticias.json');
const compiledArticles = [];

if (fs.existsSync(noticiasJsonPath)) {
    try {
        const newsArticles = JSON.parse(fs.readFileSync(noticiasJsonPath, 'utf-8'));
        const noticiasDistDir = path.join(distDir, 'noticias');
        if (!fs.existsSync(noticiasDistDir)) {
            fs.mkdirSync(noticiasDistDir, { recursive: true });
        }

        newsArticles.forEach(article => {
            if (!article.slug && !article.id) return;
            const slug = article.slug || article.id;
            const articleDir = path.join(noticiasDistDir, slug);
            fs.mkdirSync(articleDir, { recursive: true });

            const articleHtml = generateArticleHtml(article);
            const articleFilePath = path.join(articleDir, 'index.html');
            fs.writeFileSync(articleFilePath, articleHtml, 'utf-8');
            
            compiledArticles.push(article);
            console.log(`✓ Generated article page -> dist/noticias/${slug}/index.html`);
        });
    } catch (err) {
        console.error('Error generating static article pages:', err);
    }
}

// Dynamically generate dist/sitemap.xml during build
try {
    const sitemapUrls = [];

    // 1. Home page URL (omitting lastmod as no explicit modification date field exists for Home)
    sitemapUrls.push(`  <url>\n    <loc>https://www.samuraijkavalemana.cl/</loc>\n  </url>`);

    const validArticles = [];
    const dates = [];

    compiledArticles.forEach(article => {
        const slug = article.slug || article.id;
        const generatedFilePath = path.join(distDir, 'noticias', slug, 'index.html');
        
        // Verify physical file existence before adding to sitemap
        if (fs.existsSync(generatedFilePath)) {
            validArticles.push(article);
            if (article.date) {
                dates.push(article.date);
            }
        } else {
            console.error(`❌ Error: Article page dist/noticias/${slug}/index.html missing. Excluded from sitemap.`);
        }
    });

    // Find latest date among valid articles for /noticias/ hub lastmod
    dates.sort((a, b) => b.localeCompare(a));
    const latestDate = dates.length > 0 ? dates[0] : null;

    // 2. News hub URL (/noticias)
    if (latestDate) {
        sitemapUrls.push(`  <url>\n    <loc>https://www.samuraijkavalemana.cl/noticias</loc>\n    <lastmod>${latestDate}</lastmod>\n  </url>`);
    } else {
        sitemapUrls.push(`  <url>\n    <loc>https://www.samuraijkavalemana.cl/noticias</loc>\n  </url>`);
    }

    // 3. Individual news article URLs
    validArticles.forEach(article => {
        const slug = article.slug || article.id;
        const articleUrl = `https://www.samuraijkavalemana.cl/noticias/${slug}/`;
        if (article.date) {
            sitemapUrls.push(`  <url>\n    <loc>${articleUrl}</loc>\n    <lastmod>${article.date}</lastmod>\n  </url>`);
        } else {
            sitemapUrls.push(`  <url>\n    <loc>${articleUrl}</loc>\n  </url>`);
        }
    });

    // 4. Educational Pillar Page URL (/karate-shotokan-jka/)
    sitemapUrls.push(`  <url>\n    <loc>https://www.samuraijkavalemana.cl/karate-shotokan-jka/</loc>\n    <lastmod>2026-08-14</lastmod>\n  </url>`);

    // 5. Privacy policy
    sitemapUrls.push(`  <url>\n    <loc>https://www.samuraijkavalemana.cl/politica-de-privacidad</loc>\n    <lastmod>2026-08-25</lastmod>\n  </url>`);

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join('\n')}\n</urlset>\n`;
    const sitemapDistPath = path.join(distDir, 'sitemap.xml');
    fs.writeFileSync(sitemapDistPath, sitemapContent, 'utf-8');
    console.log(`✓ Generated dynamic sitemap -> dist/sitemap.xml (${validArticles.length + 4} URLs)`);
} catch (err) {
    console.error('Error generating dynamic sitemap.xml:', err);
}

// Generate static pillar page for Karate Shotokan JKA
try {
    const pillarDistDir = path.join(distDir, 'karate-shotokan-jka');
    if (!fs.existsSync(pillarDistDir)) {
        fs.mkdirSync(pillarDistDir, { recursive: true });
    }
    const pillarHtml = generateShotokanPillarHtml();
    const pillarFilePath = path.join(pillarDistDir, 'index.html');
    fs.writeFileSync(pillarFilePath, pillarHtml, 'utf-8');
    console.log(`✓ Generated pillar page -> dist/karate-shotokan-jka/index.html`);
} catch (err) {
    console.error('Error generating static pillar page:', err);
}

function generateArticleHtml(article) {
    const slug = article.slug || article.id;
    const fullUrl = `https://www.samuraijkavalemana.cl/noticias/${slug}/`;
    const imageUrl = `https://www.samuraijkavalemana.cl/${article.image}`;
    const authorName = article.author || 'Dojo Samurai Villa Alemana';
    
    // Resolve relative asset paths in content HTML
    let resolvedContent = (article.content || '')
        .replace(/src=["']assets\//g, 'src="../../assets/')
        .replace(/src=["']\/assets\//g, 'src="../../assets/');

    // Contextual internal link (max 1 per article) to pillar page /karate-shotokan-jka/
    if (slug === 'xv-seminario-tecnico-jka-vina-del-mar-2026-shihan-mitsuo-inoue') {
        resolvedContent = resolvedContent.replace(
            'Japan Karate Association',
            '<a href="/karate-shotokan-jka/" style="color: #b91c1c; font-weight: 600; text-decoration: underline;">Japan Karate Association</a>'
        );
    } else if (slug === '50-aniversario-dojo-samurai-jka-vina-del-mar') {
        resolvedContent = resolvedContent.replace(
            'Karate Do Shotokan JKA',
            '<a href="/karate-shotokan-jka/" style="color: #b91c1c; font-weight: 600; text-decoration: underline;">Karate Do Shotokan JKA</a>'
        );
    }

    // Enrich article body images with explicit dimensions, loading="lazy", and decoding="async"
    resolvedContent = resolvedContent
        .replace(
            /src=["']\.\.\/\.\.\/assets\/noticias\/Seminario\/INOUE_2026\.jpg["']/g,
            'src="../../assets/noticias/Seminario/INOUE_2026.jpg" width="2160" height="2700" loading="lazy" decoding="async"'
        )
        .replace(
            /src=["']\.\.\/\.\.\/assets\/noticias\/Aniversario\/IMG-20260810-WA0001\.webp["']/g,
            'src="../../assets/noticias/Aniversario/IMG-20260810-WA0001.webp" width="1600" height="1204" loading="lazy" decoding="async"'
        )
        .replace(
            /src=["']\.\.\/\.\.\/assets\/noticias\/Aniversario\/IMG-20260810-WA0002\.webp["']/g,
            'src="../../assets/noticias/Aniversario/IMG-20260810-WA0002.webp" width="1204" height="1600" loading="lazy" decoding="async"'
        )
        .replace(
            /src=["']\.\.\/\.\.\/assets\/noticias\/Aniversario\/IMG-20260810-WA0005\.webp["']/g,
            'src="../../assets/noticias/Aniversario/IMG-20260810-WA0005.webp" width="1600" height="1204" loading="lazy" decoding="async"'
        )
        .replace(
            /src=["']\.\.\/\.\.\/assets\/noticias\/Aniversario\/IMG-20260810-WA0006\.webp["']/g,
            'src="../../assets/noticias/Aniversario/IMG-20260810-WA0006.webp" width="1600" height="1204" loading="lazy" decoding="async"'
        )
        .replace(
            /src=["']\.\.\/\.\.\/assets\/noticias\/Aniversario\/IMG-20260810-WA0007\.webp["']/g,
            'src="../../assets/noticias/Aniversario/IMG-20260810-WA0007.webp" width="1600" height="1204" loading="lazy" decoding="async"'
        )
        .replace(
            /src=["']\.\.\/\.\.\/assets\/noticias\/Aniversario\/IMG-20260810-WA0008\.webp["']/g,
            'src="../../assets/noticias/Aniversario/IMG-20260810-WA0008.webp" width="1204" height="1600" loading="lazy" decoding="async"'
        );

    const ldJson = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": article.title,
        "image": [imageUrl],
        "datePublished": article.date,
        "dateModified": article.date,
        "author": {
            "@type": "Organization",
            "name": authorName,
            "url": "https://www.samuraijkavalemana.cl/"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Dojo Samurai JKA Villa Alemana",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.samuraijkavalemana.cl/assets/ui/animacion/jka_logo.png"
            }
        },
        "description": article.excerpt,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": fullUrl
        }
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.title} | Dojo Samurai JKA Villa Alemana</title>
    <meta name="description" content="${article.excerpt}">
    <meta name="author" content="${authorName}">
    <meta name="robots" content="index, follow, max-image-preview:large">

    <!-- Canonical URL -->
    <link rel="canonical" href="${fullUrl}" />

    <!-- Open Graph Meta Tags -->
    <meta property="og:type" content="article" />
    <meta property="og:locale" content="es_CL" />
    <meta property="og:site_name" content="Dojo Samurai Villa Alemana" />
    <meta property="og:title" content="${article.title}" />
    <meta property="og:description" content="${article.excerpt}" />
    <meta property="og:url" content="${fullUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:alt" content="${article.title}" />

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${article.title}" />
    <meta name="twitter:description" content="${article.excerpt}" />
    <meta name="twitter:image" content="${imageUrl}" />

    <!-- App Favicons -->
    <link rel="icon" type="image/x-icon" href="../../favicon.ico">
    <link rel="icon" type="image/png" sizes="48x48" href="../../favicon-48x48.png">
    <link rel="icon" type="image/png" sizes="96x96" href="../../favicon-96x96.png">
    <link rel="icon" type="image/png" sizes="192x192" href="../../favicon-192x192.png">
    <link rel="apple-touch-icon" sizes="180x180" href="../../apple-touch-icon.png">
    <link rel="manifest" href="../../site.webmanifest">

    <!-- Stylesheets & Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap"></noscript>
    <link rel="stylesheet" href="../../styles.css?v=92.0">

    <!-- Optional analytics are loaded only after the visitor grants consent. -->
    <script defer src="/analytics-consent.js?v=1.0"></script>

    <!-- Schema.org NewsArticle JSON-LD -->
    <script type="application/ld+json">
${JSON.stringify(ldJson, null, 4)}
    </script>
</head>
<body>
    <!-- Main Navigation Header -->
    <nav id="navbar" class="main-nav">
        <div class="nav-container">
            <a href="../../index.html#hero" class="logo">
                <span class="logo-icon"><img src="../../assets/ui/animacion/jka_logo.png" alt="Logo JKA" width="35" height="35" decoding="async"></span> Dojo Samurai JKA Villa Alemana
            </a>
            <ul class="nav-links">
                <li><a href="../../index.html#about">Nosotros</a></li>
                <li><a href="/karate-shotokan-jka/">Shotokan JKA</a></li>
                <li><a href="../../index.html#grados">Grados</a></li>
                <li><a href="../../index.html#classes">Horarios</a></li>
                <li><a href="/noticias">Noticias y Blog</a></li>
                <li><a href="../../index.html#contact">Contacto</a></li>
            </ul>
            <div class="menu-toggle" id="mobile-menu" role="button" aria-label="Abrir menú de navegación" aria-expanded="false" aria-controls="nav-links" tabindex="0">
                <span class="bar"></span>
                <span class="bar"></span>
                <span class="bar"></span>
            </div>
        </div>
    </nav>

    <!-- Main Article Page Content -->
    <main style="padding-top: 100px; padding-bottom: 4rem; min-height: 80vh; background: #f8fafc;">
        <div class="container" style="max-width: 860px; margin: 0 auto; padding: 0 1.5rem;">
            <!-- Navigation Back Breadcrumb -->
            <div style="margin-bottom: 1.5rem; display: flex; gap: 1rem; align-items: center; font-size: 0.95rem; flex-wrap: wrap;">
                <a href="/noticias" style="color: #b91c1c; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem;">
                    ← Volver a Noticias y Blog
                </a>
                <span style="color: #94a3b8;">|</span>
                <a href="../../index.html" style="color: #64748b; text-decoration: none;">Inicio</a>
            </div>

            <article class="single-article-card" style="background: #ffffff; border-radius: 20px; padding: 2.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                <header class="single-article-header" style="margin-bottom: 2rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 1.5rem;">
                    <div style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap;">
                        <span class="badge badge-solid" style="background: #b91c1c; color: #ffffff; padding: 0.35rem 0.85rem; border-radius: 20px; font-weight: 700; font-size: 0.85rem;">
                            ${article.category}
                        </span>
                        <span style="color: #64748b; font-size: 0.9rem;">📅 ${article.dateFormatted}</span>
                        <span style="color: #64748b; font-size: 0.9rem;">⏱️ ${article.readTime}</span>
                    </div>
                    <h1 style="font-size: 2rem; font-weight: 800; color: #0f172a; line-height: 1.3; margin-bottom: 1rem;">
                        ${article.title}
                    </h1>
                    <p style="color: #64748b; font-size: 0.95rem; font-weight: 600;">
                        Publicado por: <span style="color: #0f172a;">${authorName}</span>
                    </p>
                </header>

                <div class="single-article-body" style="color: #334155; font-size: 1.05rem; line-height: 1.8;">
                    ${resolvedContent}
                </div>

                <!-- Call to Action Footer -->
                <div style="margin-top: 3rem; padding: 1.75rem; background: rgba(185, 28, 28, 0.04); border-left: 4px solid #b91c1c; border-radius: 14px; display: flex; flex-direction: column; gap: 1rem;">
                    <h3 style="margin: 0; color: #b91c1c; font-size: 1.25rem; font-weight: 800;">
                        🥋 ¡Entrena Karate Shotokan JKA en Villa Alemana!
                    </h3>
                    <p style="margin: 0; color: #334155; font-size: 1rem; line-height: 1.6;">
                        Únete a nuestras clases presenciales para jóvenes y adultos (desde los 18 años) en Balmaceda 188, Casa 2 (Gimnasio VIPALU). ¡Primera clase de prueba totalmente gratuita!
                    </p>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem;">
                        <a href="https://wa.me/56942825617?text=Hola,%20le%C3%AD%20el%20art%C3%ADculo%20'${encodeURIComponent(article.title)}'%20y%20me%20gustar%C3%ADa%20solicitar%20informaci%C3%B3n%20para%20una%20clase%20de%20prueba" 
                           target="_blank" rel="noopener noreferrer" 
                           style="background: #25d366; color: #ffffff; padding: 0.75rem 1.4rem; border-radius: 10px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; box-shadow: 0 4px 15px rgba(37,211,102,0.3);">
                            💬 Consultar por WhatsApp
                        </a>
                        <a href="../../index.html#contact" 
                           style="background: #0f172a; color: #ffffff; padding: 0.75rem 1.4rem; border-radius: 10px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem;">
                            ✉️ Ver Horarios y Ubicación
                        </a>
                    </div>
                </div>
            </article>
        </div>
    </main>

    <!-- Institutional Site Footer -->
    <footer id="footer" class="site-footer">
        <div class="container footer-container">
            <div class="footer-grid">
                <div class="footer-col footer-brand-col">
                    <h3 class="footer-brand-title">DOJO SAMURAI VILLA ALEMANA</h3>
                    <p class="footer-brand-desc">
                        Promoviendo el Karate-Do tradicional de la Japan Karate Association (JKA) en Villa Alemana. Formación integral, salud y disciplina marcial.
                    </p>
                </div>
                <div class="footer-col">
                    <h4 class="footer-col-title">NAVEGACIÓN</h4>
                    <ul class="footer-links-list">
                        <li><a href="../../index.html#about">Nosotros</a></li>
                        <li><a href="/karate-shotokan-jka/">Shotokan JKA</a></li>
                        <li><a href="../../index.html#grados">Grados</a></li>
                        <li><a href="../../index.html#classes">Horarios</a></li>
                        <li><a href="/noticias">Noticias y Blog</a></li>
                        <li><a href="../../index.html#contact">Contacto</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4 class="footer-col-title">UBICACIÓN & CONTACTO</h4>
                    <ul class="footer-contact-list">
                        <li>
                            <a href="https://wa.me/56942825617?text=¡Hola!%20Me%20gustaría%20pedir%20información%20sobre%20las%20clases%20de%20Karate" target="_blank" rel="noopener noreferrer">
                                <span class="footer-list-icon">💬</span> WhatsApp (+56 9 4282 5617)
                            </a>
                        </li>
                        <li>
                            <a href="mailto:samurai.jka.valemana@gmail.com">
                                <span class="footer-list-icon">✉️</span> samurai.jka.valemana@gmail.com
                            </a>
                        </li>
                        <li>
                            <div class="footer-location-item">
                                <span class="footer-list-icon">📍</span>
                                <span>Balmaceda 188, casa 2, Universo Vipalu, Villa Alemana</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom-bar">
                <p class="copyright-text">&copy; 2026 Dojo Samurai Villa Alemana. Todos los derechos reservados.</p>
                <p><a href="/politica-de-privacidad">Política de privacidad</a> · <button type="button" class="footer-consent-link" data-open-consent>Preferencias de analítica</button></p>
            </div>
        </div>
    </footer>

    <script defer src="../../script.js?v=92.0"></script>
</body>
</html>`;
}

function generateShotokanPillarHtml() {
    const fullUrl = "https://www.samuraijkavalemana.cl/karate-shotokan-jka/";
    const imageUrl = "https://www.samuraijkavalemana.cl/og-image.jpg";

    const graphSchema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage",
                "@id": "https://www.samuraijkavalemana.cl/karate-shotokan-jka/#webpage",
                "url": fullUrl,
                "name": "Karate-Do Shotokan JKA: Historia, Principios y Tradición | Dojo Samurai",
                "description": "Descubre la historia, filosofía y técnica del Karate-Do Shotokan JKA. Conoce el legado de Gichin Funakoshi, el Dojo Kun y la formación en Dojo Samurai Villa Alemana.",
                "isPartOf": {
                    "@type": "WebSite",
                    "@id": "https://www.samuraijkavalemana.cl/#website",
                    "url": "https://www.samuraijkavalemana.cl/",
                    "name": "Dojo Samurai Villa Alemana"
                }
            },
            {
                "@type": "BreadcrumbList",
                "@id": "https://www.samuraijkavalemana.cl/karate-shotokan-jka/#breadcrumb",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Inicio",
                        "item": "https://www.samuraijkavalemana.cl/"
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Karate Shotokan JKA",
                        "item": fullUrl
                    }
                ]
            }
        ]
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Karate Shotokan JKA: Historia y Principios | Dojo Samurai</title>
    <meta name="description" content="Descubre la historia, filosofía y técnica del Karate-Do Shotokan JKA. Conoce el legado de Gichin Funakoshi, el Dojo Kun y la formación en Dojo Samurai Villa Alemana.">
    <meta name="author" content="Dojo Samurai Villa Alemana">
    <meta name="robots" content="index, follow, max-image-preview:large">

    <!-- Canonical URL -->
    <link rel="canonical" href="${fullUrl}" />

    <!-- Open Graph Meta Tags -->
    <meta property="og:type" content="article" />
    <meta property="og:locale" content="es_CL" />
    <meta property="og:site_name" content="Dojo Samurai Villa Alemana" />
    <meta property="og:title" content="Karate-Do Shotokan JKA: Historia, Principios y Tradición" />
    <meta property="og:description" content="Descubre la historia, filosofía y técnica del Karate-Do Shotokan JKA. Conoce el legado de Gichin Funakoshi, el Dojo Kun y la formación marcial." />
    <meta property="og:url" content="${fullUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:alt" content="Insignia oficial Japan Karate Association JKA Chile" />

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Karate-Do Shotokan JKA: Historia, Principios y Tradición" />
    <meta name="twitter:description" content="Referencia educativa e institucional sobre el Karate-Do Shotokan JKA y el Dojo Samurai Villa Alemana." />
    <meta name="twitter:image" content="${imageUrl}" />

    <!-- App Favicons -->
    <link rel="icon" type="image/x-icon" href="../favicon.ico">
    <link rel="icon" type="image/png" sizes="48x48" href="../favicon-48x48.png">
    <link rel="icon" type="image/png" sizes="96x96" href="../favicon-96x96.png">
    <link rel="icon" type="image/png" sizes="192x192" href="../favicon-192x192.png">
    <link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon.png">
    <link rel="manifest" href="../site.webmanifest">

    <!-- Stylesheets & Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap"></noscript>
    <link rel="stylesheet" href="../styles.css?v=92.0">

    <!-- Optional analytics are loaded only after the visitor grants consent. -->
    <script defer src="/analytics-consent.js?v=1.0"></script>

    <!-- Schema.org WebPage & BreadcrumbList JSON-LD -->
    <script type="application/ld+json">
${JSON.stringify(graphSchema, null, 4)}
    </script>
</head>
<body>
    <!-- Main Navigation Header -->
    <nav id="navbar" class="main-nav">
        <div class="nav-container">
            <a href="../index.html#hero" class="logo">
                <span class="logo-icon"><img src="../assets/ui/animacion/jka_logo.png" alt="Logo JKA" width="35" height="35" decoding="async"></span> Dojo Samurai JKA Villa Alemana
            </a>
            <ul class="nav-links" id="nav-links">
                <li><a href="../index.html#about">Nosotros</a></li>
                <li><a href="/karate-shotokan-jka/" class="active-nav">Shotokan JKA</a></li>
                <li><a href="../index.html#grados">Grados</a></li>
                <li><a href="../index.html#dojokun">Dojo Kun</a></li>
                <li><a href="../index.html#classes">Horarios</a></li>
                <li><a href="../index.html#tournaments">Torneos</a></li>
                <li><a href="/noticias">Noticias</a></li>
                <li><a href="../index.html#gallery">Galería</a></li>
                <li><a href="../index.html#location">Ubicación</a></li>
                <li><a href="../index.html#contact">Contacto</a></li>
            </ul>
            <div class="menu-toggle" id="mobile-menu" role="button" aria-label="Abrir menú de navegación" aria-expanded="false" aria-controls="nav-links" tabindex="0">
                <span class="bar"></span>
                <span class="bar"></span>
                <span class="bar"></span>
            </div>
        </div>
    </nav>

    <!-- Main Article Page Content -->
    <main style="padding-top: 100px; padding-bottom: 4rem; min-height: 80vh; background: #f8fafc;">
        <div class="container" style="max-width: 900px; margin: 0 auto; padding: 0 1.5rem;">
            <!-- Navigation Back Breadcrumb -->
            <div style="margin-bottom: 1.5rem; display: flex; gap: 0.75rem; align-items: center; font-size: 0.95rem; flex-wrap: wrap;">
                <a href="../index.html" style="color: #64748b; text-decoration: none; font-weight: 500;">
                    Inicio
                </a>
                <span style="color: #cbd5e1;">›</span>
                <span style="color: #b91c1c; font-weight: 700;">Karate-Do Shotokan JKA</span>
            </div>

            <article class="single-article-card" style="background: #ffffff; border-radius: 20px; padding: 2.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                <header class="single-article-header" style="margin-bottom: 2.5rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 1.75rem;">
                    <div style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap;">
                        <span class="badge badge-solid" style="background: #b91c1c; color: #ffffff; padding: 0.35rem 0.85rem; border-radius: 20px; font-weight: 700; font-size: 0.85rem;">
                            🥋 Guía Educativa e Institucional
                        </span>
                        <span style="color: #64748b; font-size: 0.9rem;">📚 Referencia Marcial JKA</span>
                    </div>
                    <h1 style="font-size: 2.2rem; font-weight: 800; color: #0f172a; line-height: 1.3; margin-bottom: 1rem;">
                        Karate-Do Shotokan JKA: Historia, Principios y Tradición
                    </h1>
                    <p style="color: #64748b; font-size: 1rem; font-weight: 600;">
                        Publicado por: <span style="color: #0f172a;">Dojo Samurai JKA Villa Alemana</span>
                    </p>
                </header>

                <div class="single-article-body" style="color: #334155; font-size: 1.05rem; line-height: 1.8;">
                    
                    <!-- Lead Paragraph -->
                    <p class="news-lead-paragraph" style="font-size: 1.15rem; color: #0f172a; line-height: 1.8; margin-bottom: 2rem;">
                        <strong>El Karate-Do Shotokan JKA es una disciplina marcial tradicional orientada a la formación integral del ser humano. A través del rigor técnico, la etiqueta marcial y la superación constante, el Shotokan preserva el espíritu genuino del Budo: perfeccionar el carácter y promover el autocontrol antes que la confrontación.</strong>
                    </p>

                    <!-- Section 1 -->
                    <h2 style="color: #0f172a; font-weight: 800; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem; border-bottom: 2px solid #fee2e2; padding-bottom: 0.5rem;">
                        1. ¿Qué es el Karate Shotokan Tradicional?
                    </h2>
                    <p>
                        El Karate-Do Shotokan es una de las escuelas marciales más difundidas y respetadas globalmente. Originado en Okinawa y estructurado metodológicamente en Japón continental, se caracteriza por sus posturas estables, la generación biomecánica de potencia (<em>Kime</em>), el uso dinámico de la cadera (<em>Koshi no Kaiten</em>) y la ejecución limpia de técnicas lineales de ataque y defensa.
                    </p>
                    <p>
                        El término <em>Karate-Do</em> significa literalmente "El camino de la mano vacía", reflejando tanto la naturaleza de un sistema de autodefensa sin armas como una filosofía de desapego del ego. Más allá del ámbito físico, la práctica busca cultivar la compostura mental, la templanza y el respeto mutuo en todo momento.
                    </p>

                    <!-- Section 2 -->
                    <h2 style="color: #0f172a; font-weight: 800; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem; border-bottom: 2px solid #fee2e2; padding-bottom: 0.5rem;">
                        2. Orígenes e Historia: El Legado de Gichin Funakoshi
                    </h2>
                    <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: center; margin: 1.5rem 0;">
                        <img src="../assets/ui/animacion/Funakoshi1.webp" alt="Maestro Gichin Funakoshi promotor del Karate Shotokan tradicional" width="473" height="648" loading="lazy" decoding="async" style="max-width: 240px; height: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <div style="flex: 1; min-width: 260px;">
                            <p style="margin-top: 0;">
                                El maestro <strong>Gichin Funakoshi</strong> (1868-1957), nacido en Shuri, Okinawa, fue la figura fundamental en la transmisión y desarrollo del arte que posteriormente se consolidó como Shotokan. Tras formarse en Okinawa bajo la tutela de los maestros Ankō Asato y Ankō Itosu, Funakoshi dedicó su vida a sistematizar la enseñanza del karate e integrarlo en la educación física e intelectual.
                            </p>
                            <p>
                                En <strong>1922</strong>, Funakoshi realizó la primera demostración pública oficial de karate en Tokio por invitación del Ministerio de Educación de Japón, hito que marcó el inicio de la expansión masiva del arte marcial en Japón continental.
                            </p>
                        </div>
                    </div>
                    <p>
                        Etimológicamente, la palabra <strong>Shotokan</strong> combina el seudónimo poético <em>Shoto</em> (松濤, que se traduce como "ondas de pino" o "el viento entre los pinos"), con el cual Funakoshi firmaba sus escritos y poemas de juventud, y el vocablo <em>Kan</em> (館, que significa "edificio", "salón" o "casa de entrenamiento"). De este modo, <em>Shotokan</em> se entiende literalmente como <strong>"La casa o el salón de Shoto"</strong>, nombre con el que sus estudiantes bautizaron el primer dojo oficial establecido en Tokio en <strong>1939</strong>.
                    </p>
                    <p>
                        Funakoshi inmortalizó el propósito moral de su instrucción en la premisa: <em>"Karate ni sente nashi"</em> (En el Karate no existe el primer ataque), subrayando que el conocimiento técnico debe acompañarse siempre de la prudencia, la cortesía y la búsqueda de la paz.
                    </p>

                    <!-- Section 3 -->
                    <h2 style="color: #0f172a; font-weight: 800; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem; border-bottom: 2px solid #fee2e2; padding-bottom: 0.5rem;">
                        3. La Japan Karate Association (JKA)
                    </h2>
                    <p>
                        La <strong>Japan Karate Association (JKA)</strong> (<em>Nihon Karate Kyokai</em>) fue fundada en <strong>noviembre de 1948</strong> y desempeñó un papel fundamental en la sistematización, enseñanza y difusión internacional del Karate Shotokan.
                    </p>
                    <p>
                        A través de su histórico programa de formación de instructores y su normativa técnica uniforme, la JKA ha impulsado la preservación de los valores tradicionales del Budo, promoviendo estándares de exigencia en la práctica, evaluaciones de grado y capacitación marcial a nivel global.
                    </p>

                    <!-- Section 4 -->
                    <h2 style="color: #0f172a; font-weight: 800; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem; border-bottom: 2px solid #fee2e2; padding-bottom: 0.5rem;">
                        4. Los Tres Pilares del Entrenamiento: Kihon, Kata y Kumite
                    </h2>
                    <p>
                        La práctica del Karate Shotokan JKA se estructura sobre tres pilares interconectados que aseguran un desarrollo técnico progresivo y seguro:
                    </p>
                    
                    <h3 style="color: #0f172a; font-size: 1.25rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem;">
                        🥋 Kihon: Fundamentos y Construcción Técnica
                    </h3>
                    <p>
                        El <strong>Kihon</strong> es la práctica consciente y repetitiva de las técnicas básicas: posturas (<em>dachi</em>), desplazamientos, bloqueos (<em>uke</em>), golpes de puño (<em>tsuki</em>), ataques de mano abierta (<em>uchi</em>) y patadas (<em>geri</em>). En el Kihon se ejercitan la alineación corporal, la trayectoria precisa, el equilibrio, la velocidad, la potencia, la coordinación y el control del impacto. Constituye la base indispensable sobre la que se construyen la forma y el combate.
                    </p>

                    <h3 style="color: #0f172a; font-size: 1.25rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem;">
                        📜 Kata: Estructura, Expresión y Aplicación
                    </h3>
                    <p>
                        El <strong>Kata</strong> es una secuencia formal predeterminada que integra desplazamientos, giros, cambios de dirección, ritmo, control de la respiración y concentración mental. Lejos de ser una rutina estática, el Kata encierra la memoria técnica y táctica de la escuela. El estudio de sus aplicaciones prácticas reales frente a situaciones de autodefensa se denomina <em>Bunkai</em> o <em>Oyo</em>.
                    </p>

                    <h3 style="color: #0f172a; font-size: 1.25rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem;">
                        ⚔️ Kumite: Aplicación Práctica y Etiqueta Marcial
                    </h3>
                    <p>
                        El <strong>Kumite</strong> es el trabajo con compañero donde se ponen a prueba la distancia adecuada (<em>Ma-ai</em>), la oportunidad o timing (<em>De-ai</em>), la capacidad de reacción, la precisión técnica y el autocontrol absoluto para no causar daño.
                    </p>
                    <p style="margin-bottom: 0.5rem;">
                        La JKA aplica una progresión pedagógica gradual que garantiza el aprendizaje seguro:
                    </p>
                    <ul style="margin-top: 0.25rem; margin-bottom: 1.5rem;">
                        <li><strong>Gohon / Sanbon Kumite:</strong> Combate estructurado a cinco o tres pasos para fijar distancia y bloqueos básicos.</li>
                        <li><strong>Kihon Ippon Kumite:</strong> Combate básico a un paso con ataque prefijado para entrenar la respuesta inmediata con máxima potencia y control.</li>
                        <li><strong>Jiyu Ippon Kumite:</strong> Combate semi-libre a un paso con movilidad continua y distancia real.</li>
                        <li><strong>Jiyu Kumite:</strong> Combate libre supervisado donde se aplican combinaciones tácticas bajo estricto autocontrol y normas de etiqueta marcial.</li>
                    </ul>

                    <!-- Section 5: Unity -->
                    <div class="news-highlight-box" style="background: rgba(15, 23, 42, 0.03); border-left: 4px solid #0f172a; padding: 1.25rem 1.5rem; border-radius: 12px; margin: 2rem 0;">
                        <h3 style="margin-top: 0; color: #0f172a; font-weight: 800; font-size: 1.2rem; margin-bottom: 0.5rem;">
                            🔄 La Unidad Formativa: Kihon + Kata + Kumite
                        </h3>
                        <p style="margin: 0; color: #334155; font-size: 1rem; line-height: 1.7;">
                            Kihon, Kata y Kumite no representan disciplinas aisladas ni independientes. Forman una <strong>tríada pedagógica indivisible</strong>: el <em>Kihon</em> construye la técnica, el <em>Kata</em> la organiza y expresa en movimiento formal, y el <em>Kumite</em> la valida en el intercambio dinámico con un compañero. El dominio en uno fortalece inevitablemente a los otros dos.
                        </p>
                    </div>

                    <!-- Section 6: Dojo Kun -->
                    <h2 style="color: #0f172a; font-weight: 800; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem; border-bottom: 2px solid #fee2e2; padding-bottom: 0.5rem;">
                        5. El Dojo Kun: Filosofía y Código Marcial
                    </h2>
                    <p>
                        El <strong>Dojo Kun</strong> es el conjunto de principios filosóficos formulados para orientar el comportamiento del estudiante tanto dentro del dojo como en su vida personal y social. Cada precepto comienza con el término <em>Hitotsu</em> (Uno / Primero), denotando que cada principio posee la misma máxima prioridad espiritual:
                    </p>

                    <div class="dojokun-list" style="margin: 1.5rem 0;">
                        <div class="dojokun-item" style="display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; padding: 1rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                            <span style="background: #b91c1c; color: white; min-width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.95rem; margin-top: 0.2rem;">1</span>
                            <div>
                                <p style="margin: 0; font-weight: 800; color: #0f172a; font-size: 1.05rem;">Intentar perfeccionar el carácter (一、人格完成に努むること)</p>
                                <p style="margin: 0.35rem 0 0 0; color: #64748b; font-size: 0.95rem; line-height: 1.5;">El objetivo final del Karate-Do no reside en la victoria física, sino en el cultivo del honor, la madurez emocional y la integridad personal.</p>
                            </div>
                        </div>
                        <div class="dojokun-item" style="display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; padding: 1rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                            <span style="background: #b91c1c; color: white; min-width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.95rem; margin-top: 0.2rem;">2</span>
                            <div>
                                <p style="margin: 0; font-weight: 800; color: #0f172a; font-size: 1.05rem;">Ser sincero y leal (一、誠の道を守ること)</p>
                                <p style="margin: 0.35rem 0 0 0; color: #64748b; font-size: 0.95rem; line-height: 1.5;">Actuar con honestidad en la palabra y el compromiso técnico, manteniendo la lealtad hacia la enseñanza, los compañeros y la verdad.</p>
                            </div>
                        </div>
                        <div class="dojokun-item" style="display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; padding: 1rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                            <span style="background: #b91c1c; color: white; min-width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.95rem; margin-top: 0.2rem;">3</span>
                            <div>
                                <p style="margin: 0; font-weight: 800; color: #0f172a; font-size: 1.05rem;">Cultivar el espíritu del esfuerzo (一、努力の精神を養うこと)</p>
                                <p style="margin: 0.35rem 0 0 0; color: #64748b; font-size: 0.95rem; line-height: 1.5;">Perseverar ante las dificultades físicas y mentales con constancia, dedicación y voluntad inquebrantable (<em>Persistencia / Doryoku</em>).</p>
                            </div>
                        </div>
                        <div class="dojokun-item" style="display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; padding: 1rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                            <span style="background: #b91c1c; color: white; min-width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.95rem; margin-top: 0.2rem;">4</span>
                            <div>
                                <p style="margin: 0; font-weight: 800; color: #0f172a; font-size: 1.05rem;">Respetar a los demás (一、礼儀を重んずること)</p>
                                <p style="margin: 0.35rem 0 0 0; color: #64748b; font-size: 0.95rem; line-height: 1.5;">Demostrar cortesía sincera, amabilidad y respeto irrestricto hacia los instructores, compañeros y la sociedad en general.</p>
                            </div>
                        </div>
                        <div class="dojokun-item" style="display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; padding: 1rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                            <span style="background: #b91c1c; color: white; min-width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.95rem; margin-top: 0.2rem;">5</span>
                            <div>
                                <p style="margin: 0; font-weight: 800; color: #0f172a; font-size: 1.05rem;">Desarrollar el autocontrol (一、血気の勇を戒むること)</p>
                                <p style="margin: 0.35rem 0 0 0; color: #64748b; font-size: 0.95rem; line-height: 1.5;">Refrenar los impulsos de violencia e impulsividad irreflexiva, encauzando la fuerza propia con serenidad y responsabilidad moral.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Section 7: Grados -->
                    <h2 style="color: #0f172a; font-weight: 800; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem; border-bottom: 2px solid #fee2e2; padding-bottom: 0.5rem;">
                        6. Sistema de Grados y Progresión Técnica JKA
                    </h2>
                    <p>
                        El sistema de grados estandariza la progresión técnica y personal del estudiante a lo largo de su formación:
                    </p>
                    <ul>
                        <li><strong>Grados Kyu (Etapas de Aprendizaje):</strong> Etapas formacionales previas a los grados Dan, desde 10º Kyu (cinturón blanco) hasta 1º Kyu (cinturón marrón). En esta fase se adquieren las bases biomecánicas, la coordinación y las formas iniciales.</li>
                        <li><strong>Grados Dan (Cinturón Negro):</strong> Niveles avanzados de desarrollo técnico y conocimiento marcial que inician en 1er Dan (<em>Shodan</em>), marcando el comienzo del estudio profundo del Budo.</li>
                    </ul>
                    <div style="margin: 1.5rem 0;">
                        <a href="../index.html#grados" style="color: #b91c1c; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem;">
                            🥋 Ver esquema detallado de grados en la Home ➔
                        </a>
                    </div>
                    <div style="text-align: center; margin: 1.5rem 0 2rem 0;">
                        <img src="../assets/ui/grados_jka.png" alt="Esquema oficial de grados Kyu y Dan Karate Shotokan JKA Chile" width="551" height="513" loading="lazy" decoding="async" style="max-width: 100%; height: auto; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                    </div>

                    <!-- Section 8: What Karate Develops -->
                    <h2 style="color: #0f172a; font-weight: 800; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem; border-bottom: 2px solid #fee2e2; padding-bottom: 0.5rem;">
                        7. ¿Qué desarrolla la práctica del Karate Shotokan?
                    </h2>
                    <p>
                        La práctica continuada y metódica del Karate Shotokan JKA —a través del trabajo integrado de Kihon, Kata y Kumite— contribuye de manera progresiva al desarrollo integral del practicante en múltiples dimensiones:
                    </p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin: 1.5rem 0;">
                        <div style="background: #f8fafc; padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0;">
                            <h4 style="margin: 0 0 0.35rem 0; color: #b91c1c; font-size: 1.05rem;">💪 Desarrollo Físico</h4>
                            <p style="margin: 0; color: #475569; font-size: 0.95rem; line-height: 1.5;">Mejora la coordinación motriz, el equilibrio, la fuerza funcional, la flexibilidad articular, la movilidad corporal y la condición física general.</p>
                        </div>
                        <div style="background: #f8fafc; padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0;">
                            <h4 style="margin: 0 0 0.35rem 0; color: #b91c1c; font-size: 1.05rem;">🧠 Enfoque Mental</h4>
                            <p style="margin: 0; color: #475569; font-size: 0.95rem; line-height: 1.5;">Favorece la concentración, la capacidad de reacción rápida, la memoria neuromuscular y la claridad bajo presión.</p>
                        </div>
                        <div style="background: #f8fafc; padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0;">
                            <h4 style="margin: 0 0 0.35rem 0; color: #b91c1c; font-size: 1.05rem;">🛡️ Formación del Carácter</h4>
                            <p style="margin: 0; color: #475569; font-size: 0.95rem; line-height: 1.5;">Fomenta la disciplina, la perseverancia, el respeto ético, la autoconfianza y el autocontrol emocional.</p>
                        </div>
                    </div>

                    <!-- Section 9: Target Audience -->
                    <h2 style="color: #0f172a; font-weight: 800; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem; border-bottom: 2px solid #fee2e2; padding-bottom: 0.5rem;">
                        8. ¿Para quién es el Karate Shotokan JKA?
                    </h2>
                    <p>
                        La metodología del Karate-Do Shotokan JKA es progresiva y adaptable, convirtiéndola en una práctica de alto valor formativo para diversos perfiles de practicantes:
                    </p>
                    <ul>
                        <li><strong>Personas sin experiencia previa:</strong> Quienes desean iniciarse desde cero en un arte marcial tradicional bajo una enseñanza paso a paso estructurada y segura.</li>
                        <li><strong>Practicantes que retoman el camino:</strong> Quienes entrenaron en el pasado y buscan reacondicionarse y reencontrarse con la disciplina marcial.</li>
                        <li><strong>Practicantes de otros estilos:</strong> Quienes provienen de otras escuelas y desean explorar la biomecánica, precisión y profundidad técnica del Shotokan JKA.</li>
                        <li><strong>Adultos enfocados en salud y superación personal:</strong> Personas interesadas en fortalecer la condición física, flexibilidad, coordinación motor, templanza y manejo del estrés diario.</li>
                    </ul>
                    <p style="background: #fff1f2; border: 1px solid #fecdd3; padding: 0.85rem 1.25rem; border-radius: 10px; color: #9f1239; font-size: 0.95rem; font-weight: 600;">
                        ℹ️ <strong>Información importante sobre nuestra oferta actual:</strong> Las clases en Dojo Samurai JKA Villa Alemana están dirigidas de forma exclusiva a <strong>jóvenes y adultos desde los 18 años de edad</strong>.
                    </p>

                    <!-- Section 10: Dojo Samurai vs VIPALU -->
                    <h2 style="color: #0f172a; font-weight: 800; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem; border-bottom: 2px solid #fee2e2; padding-bottom: 0.5rem;">
                        9. Formación en Dojo Samurai JKA Villa Alemana
                    </h2>
                    <p>
                        <strong>Dojo Samurai JKA Villa Alemana</strong> es una organización deportiva y escuela marcial dedicada a la enseñanza técnica del Karate-Do Shotokan tradicional. La enseñanza del dojo está a cargo de <strong>Andrés Castro Fernández, 2.º Dan JKA</strong>, siguiendo la línea de formación en Karate Shotokan JKA que tiene como maestro y referente técnico a <strong>Sensei Raúl Puchi Zarecht, 6.º Dan JKA</strong>.
                    </p>
                    <p>
                        Nuestras clases presenciales se desarrollan en las instalaciones del <strong>Centro Universo VIPALU</strong>, ubicado en <em>Balmaceda 188, Casa 2, Villa Alemana</em>. El recinto Centro Universo VIPALU actúa únicamente como el recinto físico anfitrión que acoge el espacio de entrenamiento de nuestro dojo.
                    </p>

                    <!-- CTA Box -->
                    <div style="margin-top: 3rem; padding: 2rem; background: rgba(185, 28, 28, 0.04); border-left: 4px solid #b91c1c; border-radius: 14px; display: flex; flex-direction: column; gap: 1rem;">
                        <h3 style="margin: 0; color: #b91c1c; font-size: 1.35rem; font-weight: 800;">
                            🥋 Entrena Karate Shotokan JKA en Villa Alemana
                        </h3>
                        <p style="margin: 0; color: #334155; font-size: 1.05rem; line-height: 1.6;">
                            Te invitamos a integrarte a nuestras clases para jóvenes y adultos (Martes y Jueves de 21:00 a 22:00 hrs). ¡Solicita tu clase de prueba sin costo!
                        </p>
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem;">
                            <a href="https://wa.me/56942825617?text=Hola,%20le%C3%AD%20la%20gu%C3%ADa%20educativa%20de%20Karate%20Shotokan%20JKA%20y%20me%20gustar%C3%ADa%20consultar%20por%20clases" 
                               target="_blank" rel="noopener noreferrer" 
                               style="background: #25d366; color: #ffffff; padding: 0.8rem 1.5rem; border-radius: 10px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; box-shadow: 0 4px 15px rgba(37,211,102,0.3);">
                                💬 Consultar por WhatsApp
                            </a>
                            <a href="../index.html#classes" 
                               style="background: #0f172a; color: #ffffff; padding: 0.8rem 1.5rem; border-radius: 10px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem;">
                                📅 Ver Horarios y Ubicación
                            </a>
                            <a href="/noticias" 
                               style="background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; padding: 0.8rem 1.5rem; border-radius: 10px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem;">
                                📰 Ver Noticias y Eventos
                            </a>
                        </div>
                    </div>

                </div>
            </article>
        </div>
    </main>

    <!-- Institutional Site Footer -->
    <footer id="footer" class="site-footer">
        <div class="container footer-container">
            <div class="footer-grid">
                <div class="footer-col footer-brand-col">
                    <h3 class="footer-brand-title">DOJO SAMURAI VILLA ALEMANA</h3>
                    <p class="footer-brand-desc">
                        Promoviendo el Karate-Do tradicional de la Japan Karate Association (JKA) en Villa Alemana. Formación integral, salud y disciplina marcial.
                    </p>
                </div>
                <div class="footer-col">
                    <h4 class="footer-col-title">NAVEGACIÓN</h4>
                    <ul class="footer-links-list">
                        <li><a href="../index.html#about">Nosotros</a></li>
                        <li><a href="/karate-shotokan-jka/">Shotokan JKA</a></li>
                        <li><a href="../index.html#grados">Grados</a></li>
                        <li><a href="../index.html#classes">Horarios</a></li>
                        <li><a href="/noticias">Noticias y Blog</a></li>
                        <li><a href="../index.html#contact">Contacto</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4 class="footer-col-title">UBICACIÓN & CONTACTO</h4>
                    <ul class="footer-contact-list">
                        <li>
                            <a href="https://wa.me/56942825617?text=¡Hola!%20Me%20gustaría%20pedir%20información%20sobre%20las%20clases%20de%20Karate" target="_blank" rel="noopener noreferrer">
                                <span class="footer-list-icon">💬</span> WhatsApp (+56 9 4282 5617)
                            </a>
                        </li>
                        <li>
                            <a href="mailto:samurai.jka.valemana@gmail.com">
                                <span class="footer-list-icon">✉️</span> samurai.jka.valemana@gmail.com
                            </a>
                        </li>
                        <li>
                            <div class="footer-location-item">
                                <span class="footer-list-icon">📍</span>
                                <span>Balmaceda 188, casa 2, Universo Vipalu, Villa Alemana</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom-bar">
                <p class="copyright-text">&copy; 2026 Dojo Samurai Villa Alemana. Todos los derechos reservados.</p>
                <p><a href="/politica-de-privacidad">Política de privacidad</a> · <button type="button" class="footer-consent-link" data-open-consent>Preferencias de analítica</button></p>
            </div>
        </div>
    </footer>

    <script defer src="../script.js?v=92.0"></script>
</body>
</html>`;
}

console.log('✅ Static build complete! dist/index.html, article pages, and pillar page are ready.');

