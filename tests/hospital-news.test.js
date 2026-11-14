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
const listingApi = require('../assets/js/news-listing');
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
    assert.match(listing, /class="news-card news-hero-card\s*" data-id="karate-defensa-personal-hospital-quilpue"/);
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
        allNewsArticles: source, noticiasGridContainer: container, activeCategory: 'all', searchQuery: '', listingApi
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

const listingHtml = () => fs.readFileSync(path.join(root, 'dist/noticias.html'), 'utf8');
const initialCards = html => html.match(/<!-- NOTICIAS_INICIO -->([\s\S]*?)<!-- NOTICIAS_FIN -->/)[1];
const listingSnapshot = html => JSON.parse(html.match(/<script type="application\/json" id="news-listing-data">([\s\S]*?)<\/script>/)[1]);
const cardIds = html => [...html.matchAll(/<article\b[^>]*data-id="([^"]+)"/g)].map(match => match[1]);

test('initial HTML contains every public card exactly once in shared order, without manual or draft cards', () => {
    const html = listingHtml();
    const snapshot = listingSnapshot(html);
    const expected = listingApi.selectArticles(source).map(a => a.id);
    assert.deepEqual(cardIds(initialCards(html)), expected);
    assert.deepEqual(snapshot.map(a => a.id), expected);
    assert.equal(expected[0], slug);
    assert.equal(new Set(expected).size, expected.length);
    assert.equal(initialCards(html).trim(), listingApi.renderCards(snapshot).trim());
    assert.doesNotMatch(JSON.stringify(snapshot), /publicationChecks|publicationMode/);
    const template = fs.readFileSync(path.join(root, 'noticias.html'), 'utf8');
    assert.equal(cardIds(template).length, 0);
    assert.ok(template.includes('<!-- NOTICIAS_INICIO -->'));
});

test('future publications use featured priority, publication/event date and a deterministic slug tie-break', () => {
    const make = (id, fields = {}) => ({...article, id, slug:id, datePublished:'2026-11-14', ...fields});
    const fixture = [
        make('zeta'), make('alfa'),
        make('future-featured', {datePublished:'2027-01-01'}),
        make('event-fallback', {datePublished:undefined, date:'2026-12-01'}),
        make('newer-unfeatured', {featured:false, datePublished:'2028-01-01'}),
        make('excluded-draft', {status:'draft', datePublished:'2030-01-01'})
    ];
    const original = fixture.slice();
    const expected = ['future-featured','event-fallback','alfa','zeta','newer-unfeatured'];
    assert.deepEqual(listingApi.selectArticles(fixture).map(a=>a.id), expected);
    assert.deepEqual(listingApi.selectArticles([...fixture].reverse()).map(a=>a.id), expected);
    assert.deepEqual(cardIds(listingApi.renderCards(fixture)), expected);
    assert.deepEqual(fixture, original);
});

// Execute the actual news initialization and event handlers, with the built
// snapshot and initial cards. Width cannot alter a single shared DOM order.
function startListing({width = 1440, snapshot, missingApi = false} = {}) {
    const html = listingHtml();
    const elements = new Map();
    const element = (id, extra = {}) => {
        const handlers = {};
        const node = {handlers, addEventListener: (event, handler) => { handlers[event] = handler; }, ...extra};
        elements.set(id, node); return node;
    };
    const grid = element('noticias-grid-container', {innerHTML: initialCards(html)});
    const search = element('news-search-input', {value:''});
    element('news-listing-data', {textContent: snapshot === undefined ? JSON.stringify(listingSnapshot(html)) : snapshot});
    const categories = ['all','Comunidad','Eventos','Torneos'].map(category => element(category, {
        classList: {add(){},remove(){}}, getAttribute: () => category
    }));
    let fetches = 0;
    const context = {
        window: {innerWidth:width,location:{search:''}},
        document: {getElementById:id=>elements.get(id)||null,querySelectorAll:()=>categories,addEventListener(){}},
        URLSearchParams, console:{warn(){},log(){}}, setTimeout(){},
        fetch: () => { fetches++; throw new Error('Listing must not fetch stale fallback data'); }
    };
    vm.createContext(context);
    if (!missingApi) {
        vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/news-listing.js'), 'utf8'), context);
        vm.runInContext('window.DojoNewsListing = DojoNewsListing;', context);
    }
    const client = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
    const start = client.indexOf("    if (!document.getElementById('home-news-grid')");
    const end = client.lastIndexOf('});');
    vm.runInContext('(function(){\n' + client.slice(start,end) + '\n})();', context);
    return {grid, search, categories, context, fetches:()=>fetches};
}

test('desktop and mobile initialization keep the initial order, featured cover and zero duplicate cards', () => {
    const initial = cardIds(initialCards(listingHtml()));
    for (const width of [1440, 375]) {
        const page = startListing({width});
        assert.deepEqual(cardIds(page.grid.innerHTML), initial);
        assert.equal(initial[0], slug);
        assert.equal(new Set(cardIds(page.grid.innerHTML)).size, initial.length);
        const first = page.grid.innerHTML.split('</article>')[0];
        assert.match(first, /news-hero-card/);
        assert.ok(first.includes(article.image));
        assert.ok(first.includes('ACTIVIDAD DEL DOJO'));
        assert.equal(page.fetches(), 0);
    }
});

test('real category and search handlers filter and restore the ordered list without duplicates', () => {
    const page = startListing();
    const click = category => page.categories.find(node=>node.getAttribute()===category).handlers.click();
    click('Comunidad');
    assert.deepEqual(cardIds(page.grid.innerHTML), [slug]);
    page.search.value = '  hospital de quilpué  ';
    page.search.handlers.input({target:page.search});
    assert.deepEqual(cardIds(page.grid.innerHTML), [slug]);
    click('Eventos');
    assert.equal(cardIds(page.grid.innerHTML).length, 0);
    page.search.value = '';
    page.search.handlers.input({target:page.search});
    assert.deepEqual(cardIds(page.grid.innerHTML), source.filter(a=>a.category==='Eventos').map(a=>a.id));
    click('all');
    assert.deepEqual(cardIds(page.grid.innerHTML), cardIds(initialCards(listingHtml())));
    page.search.value = 'distancia y desescalamiento'; // excerpt search
    page.search.handlers.input({target:page.search});
    assert.deepEqual(cardIds(page.grid.innerHTML), [slug]);
});

test('missing enhancement or invalid snapshot preserves initial cards and never restores the legacy fallback', () => {
    for (const options of [{missingApi:true},{snapshot:'{invalid json'},{snapshot:'{}'}]) {
        const page = startListing(options);
        assert.equal(page.grid.innerHTML, initialCards(listingHtml()));
        assert.equal(cardIds(page.grid.innerHTML)[0], slug);
        assert.equal(page.fetches(), 0);
    }
    const draft = {...article, id:'draft-hidden',slug:'draft-hidden',status:'draft'};
    const page = startListing({snapshot:JSON.stringify([...listingSnapshot(listingHtml()),draft])});
    assert.ok(!cardIds(page.grid.innerHTML).includes('draft-hidden'));
    const before = page.grid.innerHTML;
    page.context.window.openArticleModal('unknown-or-draft');
    assert.equal(page.grid.innerHTML, before);
    assert.equal(page.context.window.location.href, undefined);
});

test('listing script versions match content hashes and load shared logic before enhancement', () => {
    const {createHash} = require('crypto');
    const html = listingHtml();
    const assets = ['assets/js/news-listing.js','script.js'];
    const positions = assets.map(file => {
        const hash = createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex').slice(0,12);
        const ref = `<script defer src="/${file}?v=${hash}"></script>`;
        assert.ok(html.includes(ref));
        return html.indexOf(ref);
    });
    assert.ok(positions[0] < positions[1]);
    assert.doesNotMatch(html, /script\.js\?v=95\.0/);
    assert.doesNotMatch(initialCards(html), /@media|innerWidth|mobile/);
});
