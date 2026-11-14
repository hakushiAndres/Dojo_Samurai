'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const slug = 'karate-defensa-personal-hospital-quilpue';
const source = JSON.parse(fs.readFileSync(path.join(root, 'data/noticias.json'), 'utf8'));
const article = source.find(item => item.slug === slug);
const preamble = fs.readFileSync(path.join(root, 'build.js'), 'utf8').split("const siteUrl =")[0];
function validate(candidate) {
    return vm.runInNewContext(preamble + '\npublicNews;', {
        __dirname: root, process: {argv: []},
        require: name => name === 'fs' ? {readFileSync: () => JSON.stringify([candidate])} : require(name)
    });
}
test('photographic publication fails with each missing privacy approval and invalid dates', () => {
    const approved = { ...article, publicationMode: 'photos', publicationChecks: {participants: true, minorGuardian: true, certificatesReviewed: true} };
    assert.equal(validate(approved).length, 1);
    for (const key of Object.keys(approved.publicationChecks)) {
        assert.throws(() => validate({...approved, publicationChecks: {...approved.publicationChecks, [key]: false}}), /Hospital de Quilpu/);
    }
    for (const datePublished of [null, '2026-02-30', '2026-11-10']) {
        assert.throws(() => validate({...article, datePublished}), /Hospital de Quilpu/);
    }
    assert.throws(() => validate({...article, publicationMode: undefined}), /Hospital de Quilpu/);
});
test('text-only publication removes photo figures and references while retaining approved prose', () => {
    const [publicArticle] = validate({...article, publicationMode: 'text-only', publicationChecks: {participants:false,minorGuardian:false,certificatesReviewed:false}});
    assert.equal(publicArticle.content, article.content.replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/g, ''));
    assert.doesNotMatch(JSON.stringify(publicArticle), /Hospital-Quilpue/);
    assert.equal(publicArticle.image, 'assets/ui/animacion/jka_logo.png');
    assert.deepEqual(article.publicationChecks, {participants: true, minorGuardian: true, certificatesReviewed: true});
});
test('built article, listing, public data and sitemap publish the authorized photographic version', () => {
    const html = fs.readFileSync(path.join(root, 'dist/noticias', slug, 'index.html'), 'utf8');
    const listing = fs.readFileSync(path.join(root, 'dist/noticias.html'), 'utf8');
    const json = fs.readFileSync(path.join(root, 'dist/data/noticias.json'), 'utf8');
    const sitemap = fs.readFileSync(path.join(root, 'dist/sitemap.xml'), 'utf8');
    const url = `https://www.samuraijkavalemana.cl/noticias/${slug}/`;
    assert.ok(html.includes(`<link rel="canonical" href="${url}"`));
    assert.ok(html.includes(`property="og:url" content="${url}"`));
    assert.doesNotMatch(html, /noindex|nofollow/);
    assert.doesNotMatch(json, /publicationChecks|publicationMode/);
    assert.ok(listing.includes('ACTIVIDAD DEL DOJO'));
    assert.match(listing, /class="news-card news-hero-card" data-id="karate-defensa-personal-hospital-quilpue"/);
    assert.equal(article.featured, true);
    assert.equal(article.publicationMode, 'photos');
    assert.ok(listing.includes(`/noticias/${slug}/`));
    assert.ok(sitemap.includes(`<loc>${url}</loc>\n    <lastmod>2026-11-14</lastmod>`));
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(schema['@type'], 'NewsArticle');
    assert.equal(schema.datePublished, '2026-11-14');
    assert.equal(schema.dateModified, '2026-11-14');
    assert.equal(schema.mainEntityOfPage['@id'], url);
    assert.equal(schema.image[0], 'https://www.samuraijkavalemana.cl/' + article.image);
    assert.equal(fs.existsSync(path.join(root, 'dist/assets/noticias/Hospital-Quilpue')), true);
    const images = [...html.matchAll(/<img[^>]+>/g)].map(match => match[0]).filter(tag => tag.includes('Hospital-Quilpue'));
    assert.equal(images.length, 3);
    assert.ok(images[0].includes('cierre-taller-'));
    for (const image of images) {
        assert.match(image, /srcset="[^"]+"/);
        assert.match(image, /sizes="[^"]+"/);
        assert.match(image, /width="\d+" height="\d+"/);
        assert.ok(image.includes('decoding="async"'));
        if (!image.includes('cierre-taller-')) {
            assert.ok(image.includes('loading="lazy"'));
            assert.ok(image.includes('-800w.webp 450w,'));
            assert.ok(image.includes('.webp 720w'));
        }
    }
    assert.ok(html.includes('property="og:image" content="' + schema.image[0] + '"'));
    assert.ok(html.includes('name="twitter:image" content="' + schema.image[0] + '"'));
    const assets = fs.readdirSync(path.join(root, 'dist/assets/noticias/Hospital-Quilpue'));
    assert.equal(assets.length, 6);
    for (const asset of assets) assert.deepEqual(fs.readFileSync(path.join(root, 'dist/assets/noticias/Hospital-Quilpue', asset)), fs.readFileSync(path.join(root, 'assets/noticias/Hospital-Quilpue', asset)));
    assert.equal(fs.existsSync(path.join(root, 'dist/assets/noticias/noticia_hospital_quilpue_web')), false);
});

test('live listing renderer puts the latest featured publication first with institutional badge and responsive cover', () => {
    const client = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
    const renderer = client.slice(client.indexOf('    const createNewsCardHTML ='), client.indexOf('    // Modal Reader Logic'));
    const filtering = client.slice(client.indexOf('    const filterAndRenderNoticias ='), client.indexOf('    let activeCategory ='));
    const container = {innerHTML: ''};
    vm.runInNewContext(renderer + filtering + '\nfilterAndRenderNoticias();', {
        allNewsArticles: source, noticiasGridContainer: container, activeCategory: 'all', searchQuery: ''
    });
    assert.equal(container.innerHTML.match(/data-id="([^"]+)"/)[1], slug);
    const first = container.innerHTML.split('</article>')[0];
    assert.ok(first.includes('ACTIVIDAD DEL DOJO'));
    assert.ok(first.includes('news-hero-card'));
    assert.ok(first.includes('-800w.webp 800w'));
    assert.doesNotMatch(first, /🔥|🏆|📜/);
    const {webpDimensions} = require('../scripts/gallery-build');
    for (const name of fs.readdirSync(path.join(root, 'assets/noticias/Hospital-Quilpue'))) {
        const size = webpDimensions(fs.readFileSync(path.join(root, 'assets/noticias/Hospital-Quilpue', name)));
        assert.deepEqual(size, name.startsWith('cierre-') ? (name.includes('-800w') ? {width:800,height:450} : {width:1280,height:720}) : (name.includes('-800w') ? {width:450,height:800} : {width:720,height:1280}));
    }
});
