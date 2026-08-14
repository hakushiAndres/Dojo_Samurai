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
    'sitemap.xml',
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
            console.log(`✓ Generated article page -> dist/noticias/${slug}/index.html`);
        });
    } catch (err) {
        console.error('Error generating static article pages:', err);
    }
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
                <li><a href="../../noticias.html">Noticias y Blog</a></li>
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
                <a href="../../noticias.html" style="color: #b91c1c; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem;">
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
                        <li><a href="../../noticias.html">Noticias y Blog</a></li>
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

console.log('✅ Static build complete! dist/index.html and article pages are ready.');
