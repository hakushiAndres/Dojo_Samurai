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

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join('\n')}\n</urlset>\n`;
    const sitemapDistPath = path.join(distDir, 'sitemap.xml');
    fs.writeFileSync(sitemapDistPath, sitemapContent, 'utf-8');
    console.log(`✓ Generated dynamic sitemap -> dist/sitemap.xml (${validArticles.length + 3} URLs)`);
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
    const resolvedContent = (article.content || '')
        .replace(/src=["']assets\//g, 'src="../../assets/')
        .replace(/src=["']\/assets\//g, 'src="../../assets/');

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
                <li><a href="../../index.html#shotokan">Shotokan JKA</a></li>
                <li><a href="../../index.html#grados">Grados</a></li>
                <li><a href="../../index.html#classes">Horarios</a></li>
                <li><a href="/noticias">Noticias y Blog</a></li>
                <li><a href="../../index.html#contact">Contacto</a></li>
            </ul>
            <div class="menu-toggle" id="mobile-menu">
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
                        <li><a href="../../index.html#shotokan">Shotokan JKA</a></li>
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
            <ul class="nav-links">
                <li><a href="../index.html#about">Nosotros</a></li>
                <li><a href="/karate-shotokan-jka/" class="active-nav">Shotokan JKA</a></li>
                <li><a href="../index.html#grados">Grados</a></li>
                <li><a href="../index.html#classes">Horarios</a></li>
                <li><a href="/noticias">Noticias y Blog</a></li>
                <li><a href="../index.html#contact">Contacto</a></li>
            </ul>
            <div class="menu-toggle" id="mobile-menu">
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
                    
                    <p class="news-lead-paragraph" style="font-size: 1.15rem; color: #0f172a; line-height: 1.8; margin-bottom: 2rem;">
                        <strong>El Karate-Do Shotokan es uno de los estilos marciales más practicados y respetados en el mundo. Fundamentado en la autoconfianza, el rigor técnico y la superación personal, el Shotokan preserva el principio fundamental del Budo: formar seres humanos integrales antes que competidores.</strong>
                    </p>

                    <!-- Section 1 -->
                    <h2 style="color: #0f172a; font-weight: 800; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem; border-bottom: 2px solid #fee2e2; padding-bottom: 0.5rem;">
                        1. ¿Qué es el Karate Shotokan Tradicional?
                    </h2>
                    <p>
                        El Karate-Do Shotokan es un arte marcial tradicional originario de Okinawa y perfeccionado en Japón continental. Se distingue técnicamente por sus posturas sólidas, movimientos lineales potentes, expansivos y una dinámica biomecánica enfocada en la transmisión eficiente de la energía corporal (<em>Kime</em>).
                    </p>
                    <p>
                        A diferencia de enfoques puramente deportivos, el Shotokan tradicional mantiene como eje orientador la formación moral y el dominio propio. La palabra <em>Karate-Do</em> se traduce como "El camino de la mano vacía", enfatizando la autodefensa sin armas y la purificación del ego.
                    </p>

                    <!-- Section 2 -->
                    <h2 style="color: #0f172a; font-weight: 800; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem; border-bottom: 2px solid #fee2e2; padding-bottom: 0.5rem;">
                        2. Orígenes e Historia: El Legado de Gichin Funakoshi
                    </h2>
                    <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: center; margin: 1.5rem 0;">
                        <img src="../assets/ui/animacion/Funakoshi1.webp" alt="Maestro Gichin Funakoshi fundador del Karate Shotokan tradicional" style="max-width: 240px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <div style="flex: 1; min-width: 260px;">
                            <p style="margin-top: 0;">
                                El maestro <strong>Gichin Funakoshi</strong> (1868-1957) es reconocido mundialmente como el padre del Karate-Do moderno. Nacido en Shuri, Okinawa, sintetizó las enseñanzas de los grandes maestros Ankō Asato y Ankō Itosu.
                            </p>
                            <p>
                                En <strong>1922</strong>, Funakoshi realizó la primera demostración pública oficial de karate en Tokio por invitación del Ministerio de Educación de Japón, dando inicio a la difusión masiva del arte.
                            </p>
                        </div>
                    </div>
                    <p>
                        El nombre <strong>Shotokan</strong> nació del seudónimo poético <em>Shoto</em> ("ondas de pino" o "viento entre los pinos") con el que Funakoshi firmaba sus escritos, y <em>kan</em> ("dojo" o "sala de entrenamiento"). En <strong>1939</strong> se erigió el primer dojo oficial bajo este nombre en Tokio.
                    </p>
                    <p>
                        Funakoshi resumió la esencia espiritual de su enseñanza en la famosa premisa: <em>"Karate ni sente nashi"</em> (En el Karate no existe el primer ataque), recordando que el practicante debe ser siempre un defensor de la paz.
                    </p>

                    <!-- Section 3 -->
                    <h2 style="color: #0f172a; font-weight: 800; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem; border-bottom: 2px solid #fee2e2; padding-bottom: 0.5rem;">
                        3. La Japan Karate Association (JKA)
                    </h2>
                    <p>
                        La <strong>Japan Karate Association (JKA)</strong> (<em>Nihon Karate Kyokai</em>) fue constituida oficialmente en <strong>noviembre de 1948</strong> por prominentes alumnos senior del maestro Funakoshi (entre ellos Masatoshi Nakayama), con el propósito de institucionalizar, preservar y regular los estándares técnicos y de juzgamiento del Karate Shotokan en Japón y el mundo.
                    </p>
                    <div class="news-highlight-box" style="background: rgba(185,28,28,0.04); border-left: 4px solid #b91c1c; padding: 1.25rem 1.5rem; border-radius: 12px; margin: 1.5rem 0;">
                        <h4 style="margin-top: 0; color: #b91c1c; font-weight: 800; font-size: 1.1rem; margin-bottom: 0.5rem;">🎌 La JKA como Estándar Internacional</h4>
                        <p style="margin: 0; color: #0f172a; font-size: 0.98rem; line-height: 1.6;">
                            La JKA es reconocida mundialmente como la guardiana suprema de la tradición Shotokan (<em>The Keeper of Karate's Highest Tradition</em>). Sus programas de acreditación rigurosa garantizan la uniformidad en examinaciones de grado Dan, licencias de instructor, juez y examinador internacional.
                        </p>
                    </div>

                    <!-- Section 4 -->
                    <h2 style="color: #0f172a; font-weight: 800; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem; border-bottom: 2px solid #fee2e2; padding-bottom: 0.5rem;">
                        4. Los Tres Pilares del Entrenamiento: Kihon, Kata y Kumite
                    </h2>
                    <p>
                        La metodología de la JKA concibe la formación marcial como un trípode indisoluble donde cada elemento nutre y valida a los demás:
                    </p>
                    
                    <h3 style="color: #0f172a; font-size: 1.25rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem;">
                        🥋 Kihon: Fundamentos Técnicos
                    </h3>
                    <p>
                        Es la práctica repetitiva y consciente de las técnicas básicas: posturas (<em>dachi</em>), bloqueos (<em>uke</em>), golpes de puño (<em>tsuki</em>) y patadas (<em>geri</em>). El Kihon desarrolla alineación estructural, potencia, velocidad y memoria neuromuscular.
                    </p>

                    <h3 style="color: #0f172a; font-size: 1.25rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem;">
                        📜 Kata: Forma y Aplicación
                    </h3>
                    <p>
                        Los Katas son secuencias predeterminadas de movimientos defensivos y ofensivos contra oponentes imaginarios. En el Shotokan JKA se estudian 26 Katas principales. El análisis de su aplicación práctica real se conoce como <em>Bunkai</em>.
                    </p>

                    <h3 style="color: #0f172a; font-size: 1.25rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem;">
                        ⚔️ Kumite: Distancia, Control y Combate
                    </h3>
                    <p>
                        Es el trabajo con compañero para aplicar las técnicas bajo escenarios de presión progresiva. Inicia con formas estructuradas a tres o cinco pasos (<em>Gohon / Sanbon Kumite</em>), evoluciona al combate a un paso (<em>Ippon Kumite</em>) y culmina en el combate libre controlado (<em>Jiyu Kumite</em>).
                    </p>

                    <!-- Section 5 -->
                    <h2 style="color: #0f172a; font-weight: 800; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem; border-bottom: 2px solid #fee2e2; padding-bottom: 0.5rem;">
                        5. El Dojo Kun: Filosofía y Código Marcial
                    </h2>
                    <p>
                        El <strong>Dojo Kun</strong> es el código ético establecido para guiar la conducta de los practicantes dentro y fuera del dojo. Consta de cinco principios, precedidos tradicionalmente por la palabra <em>Hitotsu</em> (Uno/Primero), señalando que todos los principios tienen igual jerarquía e importancia:
                    </p>

                    <div class="dojokun-list" style="margin: 1.5rem 0;">
                        <div class="dojokun-item" style="display: flex; gap: 1rem; align-items: center; margin-bottom: 0.75rem; padding: 0.85rem; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
                            <span style="background: #b91c1c; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem;">1</span>
                            <p style="margin: 0; font-weight: 700; color: #0f172a;">Intentar perfeccionar el carácter (一、人格完成に努むること)</p>
                        </div>
                        <div class="dojokun-item" style="display: flex; gap: 1rem; align-items: center; margin-bottom: 0.75rem; padding: 0.85rem; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
                            <span style="background: #b91c1c; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem;">2</span>
                            <p style="margin: 0; font-weight: 700; color: #0f172a;">Ser correcto, leal y puntual (一、誠の道を守ること)</p>
                        </div>
                        <div class="dojokun-item" style="display: flex; gap: 1rem; align-items: center; margin-bottom: 0.75rem; padding: 0.85rem; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
                            <span style="background: #b91c1c; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem;">3</span>
                            <p style="margin: 0; font-weight: 700; color: #0f172a;">Tratar de superarse (一、努力の精神を養うこと)</p>
                        </div>
                        <div class="dojokun-item" style="display: flex; gap: 1rem; align-items: center; margin-bottom: 0.75rem; padding: 0.85rem; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
                            <span style="background: #b91c1c; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem;">4</span>
                            <p style="margin: 0; font-weight: 700; color: #0f172a;">Respetar a los demás (一、礼儀を重んずること)</p>
                        </div>
                        <div class="dojokun-item" style="display: flex; gap: 1rem; align-items: center; margin-bottom: 0.75rem; padding: 0.85rem; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
                            <span style="background: #b91c1c; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem;">5</span>
                            <p style="margin: 0; font-weight: 700; color: #0f172a;">Abstenerse de procederes violentos (一、血気の勇を戒むること)</p>
                        </div>
                    </div>

                    <!-- Section 6 -->
                    <h2 style="color: #0f172a; font-weight: 800; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem; border-bottom: 2px solid #fee2e2; padding-bottom: 0.5rem;">
                        6. Sistema de Grados y Progresión Técnica JKA
                    </h2>
                    <p>
                        La progresión del practicante se rige por un riguroso sistema de evaluaciones:
                    </p>
                    <ul>
                        <li><strong>Grados Kyu (Cinturones de Aprendizaje):</strong> Desde 10º Kyu (blanco) hasta 1º Kyu (marrón). Reflejan la adquisición progresiva del temario técnico oficial de la JKA.</li>
                        <li><strong>Grados Dan (Cinturón Negro):</strong> Inician en 1er Dan (<em>Shodan</em>). Representan el comienzo de la madurez marcial y el compromiso permanente con la práctica.</li>
                    </ul>
                    <div style="text-align: center; margin: 2rem 0;">
                        <img src="../assets/ui/grados_jka.png" alt="Esquema oficial de grados Karate Shotokan JKA Chile" style="max-width: 100%; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                    </div>

                    <!-- Section 7 -->
                    <h2 style="color: #0f172a; font-weight: 800; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem; border-bottom: 2px solid #fee2e2; padding-bottom: 0.5rem;">
                        7. Formación en Dojo Samurai JKA Villa Alemana
                    </h2>
                    <p>
                        <strong>Dojo Samurai JKA Villa Alemana</strong> es una organización deportiva marcial dedicada a la enseñanza del Karate-Do Shotokan tradicional. Como filial oficial del <strong>Honbu Dojo Samurai Viña del Mar</strong>, nuestras actividades y exámenes están respaldados por la supervisión técnica de <strong>Sensei Raúl Puchi Zarecht (6to Dan JKA)</strong>.
                    </p>
                    <p>
                        Nuestras clases presenciales se imparten en las instalaciones del <strong>Centro Universo VIPALU</strong>, ubicado en <em>Balmaceda 188, Casa 2, Villa Alemana</em>. Actualmente, nuestro programa de entrenamiento está dirigido a <strong>jóvenes y adultos desde los 18 años de edad</strong>.
                    </p>

                    <!-- Section 8 -->
                    <div style="margin-top: 3rem; padding: 2rem; background: rgba(185, 28, 28, 0.04); border-left: 4px solid #b91c1c; border-radius: 14px; display: flex; flex-direction: column; gap: 1rem;">
                        <h3 style="margin: 0; color: #b91c1c; font-size: 1.35rem; font-weight: 800;">
                            🥋 Entrena Karate Shotokan JKA en Villa Alemana
                        </h3>
                        <p style="margin: 0; color: #334155; font-size: 1.05rem; line-height: 1.6;">
                            Te invitamos a formar parte de nuestras clases de Karate Shotokan JKA para jóvenes y adultos (Martes y Jueves 21:00 - 22:00 hrs). ¡Tu primera clase de prueba es totalmente gratuita!
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
            </div>
        </div>
    </footer>

    <script defer src="../script.js?v=92.0"></script>
</body>
</html>`;
}

console.log('✅ Static build complete! dist/index.html, article pages, and pillar page are ready.');

