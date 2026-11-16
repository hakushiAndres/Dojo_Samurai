'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/js/news-share.js'), 'utf8');

function fixture(navigator = {}, choice = 'granted', legacyCopy = true) {
    let document;
    function element(dataset = {}) {
        return {dataset, hidden: true, textContent: '', listeners: {}, attrs: {},
            addEventListener(type, fn) { this.listeners[type] = fn; },
            setAttribute(key, value) { this.attrs[key] = value; },
            focus() { document.activeElement = this; },
            closest() { return this; }, select() {}, setSelectionRange() {}, remove() { this.removed = true; }
        };
    }
    const component = element(), trigger = element(), menu = element(), status = element();
    const options = ['whatsapp', 'facebook', 'copy'].map(shareMethod => element({shareMethod}));
    menu.contains = target => options.includes(target);
    menu.querySelectorAll = () => options;
    component.contains = target => [component, trigger, menu, ...options].includes(target);
    component.querySelector = selector => ({'.news-share__trigger': trigger, '.news-share__menu': menu, '.news-share__status': status})[selector];
    document = {readyState: 'complete', listeners: {}, activeElement: trigger, fields: [],
        body: {appendChild(field) { document.fields.push(field); }},
        createElement: () => element(), execCommand: () => legacyCopy,
        querySelectorAll: () => [component],
        querySelector: selector => ({'link[rel="canonical"]': {href: 'https://www.samuraijkavalemana.cl/noticias/prueba/'},
            '.single-article-header h1': {textContent: '  Karate & JKA  '}, 'meta[name="description"]': {content: 'Una descripción breve.'}})[selector],
        addEventListener(type, fn) { this.listeners[type] = fn; }
    };
    const events = [];
    const window = {DojoConsent: {getChoice: () => choice}, gtag: (...args) => events.push(args)};
    vm.runInNewContext(source, {document, navigator, window, URL});
    return {component, trigger, menu, status, options, document, events, window,
        click: () => trigger.listeners.click(),
        choose: index => menu.listeners.click({target: options[index]})};
}

test('all public articles contain one component after prose/photos and before contact, using existing metadata', () => {
    const articles = JSON.parse(fs.readFileSync(path.join(root, 'data/noticias.json'))).filter(a => a.status !== 'draft');
    for (const article of articles) {
        const slug = article.slug || article.id;
        const html = fs.readFileSync(path.join(root, 'dist/noticias', slug, 'index.html'), 'utf8');
        assert.equal((html.match(/class="news-share"/g) || []).length, 1);
        assert.ok(html.indexOf('class="news-share"') > html.indexOf('class="single-article-body"'));
        assert.ok(html.indexOf('class="news-share"') < html.indexOf('<!-- Call to Action Footer -->'));
        assert.ok(html.includes('Consultar por WhatsApp'));
        assert.ok(html.includes(`<link rel="canonical" href="https://www.samuraijkavalemana.cl/noticias/${slug}/"`));
        assert.ok(html.includes(`${article.title}\n`));
        assert.ok(html.includes('src="/assets/js/news-share.js?v=1.0"'));
        assert.ok(fs.existsSync(path.join(root, 'dist/assets/js/news-share.js')));
        assert.match(html, /type="button" class="news-share__trigger" aria-expanded="false" aria-controls="news-share-options"/);
    }
});

test('generated pages preserve the complete previous HTML except the sharing component and its script', () => {
    const baseline = execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, 'show', 'HEAD:build.js'], {cwd: root, encoding: 'utf8'});
    const generator = baseline.slice(baseline.indexOf('function generateArticleHtml(article)'), baseline.indexOf('function generatePillarHtml('));
    const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));
    const context = {escapeHtml, hospitalSlug: 'karate-defensa-personal-hospital-quilpue'};
    vm.createContext(context);
    vm.runInContext(generator, context);
    for (const article of JSON.parse(fs.readFileSync(path.join(root, 'data/noticias.json'))).filter(a => a.status !== 'draft')) {
        const html = fs.readFileSync(path.join(root, 'dist/noticias', article.slug || article.id, 'index.html'), 'utf8');
        const stripped = html.replace(/                <section class="news-share"[\s\S]*?<\/section>\r?\n\r?\n/, '')
            .replace('    <script defer src="/assets/js/news-share.js?v=1.0"></script>\n', '');
        assert.equal(stripped.replace(/\r\n/g, '\n'), context.generateArticleHtml(article).replace(/\r\n/g, '\n'));
    }
});

test('native sharing is invoked synchronously with title, description and canonical; event only after success', async () => {
    let payload, finish;
    const f = fixture({canShare: data => !!data.url, share: data => { payload = data; return new Promise(resolve => { finish = resolve; }); }});
    const pending = f.click();
    assert.equal(payload.title, 'Karate & JKA');
    assert.equal(payload.text, 'Una descripción breve.');
    assert.equal(payload.url, 'https://www.samuraijkavalemana.cl/noticias/prueba/');
    assert.equal(f.events.length, 0);
    finish(); await pending;
    assert.deepEqual(JSON.parse(JSON.stringify(f.events)), [['event', 'share_news', {content_type: 'noticia', content_slug: 'prueba', share_method: 'native'}]]);
    assert.equal(f.menu.hidden, true);
});

test('native AbortError is silent; permission and other errors offer fallback without recording success', async () => {
    for (const name of ['AbortError', 'NotAllowedError', 'TypeError']) {
        const f = fixture({share: () => Promise.reject({name})});
        await f.click();
        assert.equal(f.menu.hidden, name === 'AbortError');
        assert.equal(f.status.textContent, '');
        assert.equal(f.events.length, 0);
    }
});

test('absent API and canShare false/throw open keyboard accessible fallback', async () => {
    for (const nav of [{}, {share() { assert.fail(); }, canShare: () => false}, {share() { assert.fail(); }, canShare() { throw Error(); }}]) {
        const f = fixture(nav); await f.click();
        assert.equal(f.menu.hidden, false);
        assert.equal(f.trigger.attrs['aria-expanded'], 'true');
        assert.equal(f.document.activeElement, f.options[0]);
        let prevented = false;
        f.component.listeners.keydown({key: 'Escape', preventDefault() { prevented = true; }});
        assert.equal(prevented, true);
        assert.equal(f.menu.hidden, true);
        assert.equal(f.document.activeElement, f.trigger);
        await f.click(); await f.click();
        assert.equal(f.menu.hidden, true);
    }
});

test('outside click and tabbing away close the disclosure without stealing outside focus', async () => {
    const f = fixture(); await f.click();
    f.document.listeners.click({target: {}});
    assert.equal(f.menu.hidden, true);
    assert.equal(f.document.activeElement, f.trigger);
    await f.click();
    const outside = {}; f.document.activeElement = outside;
    f.component.listeners.focusout({relatedTarget: outside});
    assert.equal(f.menu.hidden, true);
    assert.equal(f.document.activeElement, outside);
});

test('official WhatsApp/Facebook URLs encode title and canonical, with separate method events', async () => {
    const f = fixture();
    const wa = new URL(f.options[0].href), fb = new URL(f.options[1].href);
    assert.equal(wa.origin + wa.pathname, 'https://api.whatsapp.com/send');
    assert.equal(wa.searchParams.get('text'), 'Karate & JKA\nhttps://www.samuraijkavalemana.cl/noticias/prueba/');
    assert.equal(fb.origin + fb.pathname, 'https://www.facebook.com/sharer/sharer.php');
    assert.equal(fb.searchParams.get('u'), 'https://www.samuraijkavalemana.cl/noticias/prueba/');
    for (const index of [0, 1]) { await f.click(); await f.choose(index); }
    assert.deepEqual(f.events.map(e => e[2].share_method), ['whatsapp', 'facebook']);
});

test('Clipboard success is announced only after resolution; failure never reports success', async () => {
    let complete;
    const f = fixture({clipboard: {writeText: url => { assert.match(url, /\/prueba\/$/); return new Promise(resolve => { complete = resolve; }); }}});
    await f.click(); const pending = f.choose(2);
    assert.equal(f.status.textContent, ''); assert.equal(f.events.length, 0);
    complete(); await pending;
    assert.equal(f.status.textContent, 'Enlace copiado');
    assert.equal(f.events[0][2].share_method, 'copy');
    assert.equal(f.document.activeElement, f.trigger);
    const failed = fixture({clipboard: {writeText: () => Promise.reject(Error())}});
    await failed.choose(2);
    assert.equal(failed.status.textContent, 'No se pudo copiar el enlace.');
    assert.equal(failed.events.length, 0);
});

test('legacy copy checks command result and always removes field and restores focus', async () => {
    for (const success of [true, false]) {
        const f = fixture({}, 'granted', success); await f.choose(2);
        assert.equal(f.status.textContent, success ? 'Enlace copiado' : 'No se pudo copiar el enlace.');
        assert.equal(f.document.fields[0].removed, true);
        assert.equal(f.document.activeElement, f.trigger);
    }
});

test('no event with missing, denied or revoked consent, even if gtag remains present', async () => {
    for (const choice of [null, 'denied']) {
        const f = fixture({share: () => Promise.resolve()}, choice);
        await f.click(); await f.choose(0); await f.choose(1); await f.choose(2);
        assert.equal(f.events.length, 0);
    }
    const f = fixture(); f.window.DojoConsent.getChoice = () => 'denied';
    await f.choose(0); assert.equal(f.events.length, 0);
});

test('component keeps local CSP-compatible scripts, reduced-motion-safe styles and existing dependencies', () => {
    const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8').split('/* Editorial sharing, scoped to generated individual news pages. */')[1];
    assert.match(css, /min-height: 44px/);
    assert.match(css, /min-width: 44px/);
    assert.match(css, /:focus-visible/);
    assert.match(css, /@media \(max-width: 480px\)/);
    assert.doesNotMatch(css, /!important|animation:|transition:/);
    assert.doesNotMatch(source, /fetch\(|innerHTML|createElement\('script'\)/);
    for (const file of ['package.json', 'package-lock.json', 'vercel.json', 'script.js', 'analytics-consent.js', 'noticias.html', 'assets/js/news-listing.js']) {
        const previous = execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, 'show', `HEAD:${file}`], {cwd: root});
        assert.equal(fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n'), previous.toString('utf8').replace(/\r\n/g, '\n'), file);
    }
});
