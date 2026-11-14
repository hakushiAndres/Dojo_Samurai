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
    const [publicArticle] = validate(article);
    assert.equal(publicArticle.content, article.content.replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/g, ''));
    assert.doesNotMatch(JSON.stringify(publicArticle), /Hospital-Quilpue/);
    assert.equal(publicArticle.image, 'assets/ui/animacion/jka_logo.png');
    assert.deepEqual(article.publicationChecks, {participants: false, minorGuardian: false, certificatesReviewed: false});
});
test('built article, listing, public data and sitemap publish only the text-only version', () => {
    const html = fs.readFileSync(path.join(root, 'dist/noticias', slug, 'index.html'), 'utf8');
    const listing = fs.readFileSync(path.join(root, 'dist/noticias.html'), 'utf8');
    const json = fs.readFileSync(path.join(root, 'dist/data/noticias.json'), 'utf8');
    const sitemap = fs.readFileSync(path.join(root, 'dist/sitemap.xml'), 'utf8');
    const url = `https://www.samuraijkavalemana.cl/noticias/${slug}/`;
    assert.ok(html.includes(`<link rel="canonical" href="${url}"`));
    assert.ok(html.includes(`property="og:url" content="${url}"`));
    assert.doesNotMatch(html, /noindex|nofollow|Hospital-Quilpue/);
    assert.doesNotMatch(json, /Hospital-Quilpue|publicationChecks|publicationMode/);
    assert.doesNotMatch(listing, /Hospital-Quilpue/);
    assert.ok(listing.includes(`/noticias/${slug}/`));
    assert.ok(sitemap.includes(`<loc>${url}</loc>\n    <lastmod>2026-11-14</lastmod>`));
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(schema['@type'], 'NewsArticle');
    assert.equal(schema.datePublished, '2026-11-14');
    assert.equal(schema.dateModified, '2026-11-14');
    assert.equal(schema.mainEntityOfPage['@id'], url);
    assert.equal(schema.image[0], 'https://www.samuraijkavalemana.cl/assets/ui/animacion/jka_logo.png');
    assert.equal(fs.existsSync(path.join(root, 'dist/assets/noticias/Hospital-Quilpue')), false);
    assert.equal(fs.existsSync(path.join(root, 'dist/assets/noticias/noticia_hospital_quilpue_web')), false);
});
