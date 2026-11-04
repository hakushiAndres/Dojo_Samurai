'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const vm = require('vm');
const { readGallery, renderGallery, compileGallery } = require('../scripts/gallery-build');
const root = path.resolve(__dirname, '..');
const photos = readGallery(root);

test('build renders real dimensions, responsive sources and one priority image without fetching data', () => {
    const html = renderGallery(photos);
    assert.equal((html.match(/data-gallery-index=/g) || []).length, photos.length);
    assert.equal((html.match(/fetchpriority="high"/g) || []).length, 1);
    assert.equal((html.match(/loading="lazy"/g) || []).length, photos.length - 1);
    assert.equal((html.match(/srcset=/g) || []).length, photos.length);
    assert.equal((html.match(/class="gallery-chapter /g) || []).length, 3);
    assert.equal(photos.filter(photo => photo.layout === 'portrait').length, 4);
    const homepage = compileGallery(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), photos);
    const data = homepage.match(/<script type="application\/json" id="gallery-data">([\s\S]*?)<\/script>/)[1];
    assert.deepEqual(JSON.parse(data), photos);
    assert.ok(!homepage.includes('Cargando fotografías'));
    assert.ok(!html.includes('assets/galeria/web/'));
});

test('gallery contains exactly eleven unique photographs: five published and six additions', () => {
    const published = ['kihon-karate-adultos-01', 'correccion-tecnica-karate-02', 'entrenamiento-grupal-karate-03', 'clase-karate-adultos-04', 'grupo-karate-seiza-05'].map(name => `assets/galeria/${name}.webp`);
    const mapping = JSON.parse(fs.readFileSync(path.join(root, 'scripts/gallery-selection.json'), 'utf8'));
    assert.equal(photos.length, 11);
    assert.equal(mapping.length, 6);
    assert.deepEqual(photos.map(photo => photo.order), Array.from({ length: 11 }, (_, index) => index + 1));
    assert.equal(new Set(photos.map(photo => photo.id)).size, 11);
    assert.equal(new Set(photos.map(photo => photo.image)).size, 11);
    assert.equal(photos[0].image, 'assets/galeria/kihon-karate-adultos-01.webp');
    assert.equal(photos[0].layout, 'wide');
    assert.equal(photos.at(-1).image, 'assets/galeria/grupo-karate-seiza-05.webp');
    for (const photo of photos) for (const image of [photo, ...photo.sources]) assert.ok(fs.existsSync(path.join(root, image.image)));
    assert.deepEqual(new Set(mapping.map(item => item.source)), new Set(['001-66.jpg', '001-67.jpg', '001-84.jpg', '001-130.jpg', '001-131.jpg', '001-132.jpg']));
    for (const image of published) assert.equal(photos.filter(photo => photo.image === image).length, 1);
    const added = photos.filter(photo => !published.includes(photo.image));
    assert.equal(added.length, 6);
    assert.deepEqual(new Set(added.map(photo => photo.image)), new Set(mapping.map(item => `assets/galeria/${item.name}.webp`)));
});

test('editorial order separates similar sequences and the build excludes source originals', () => {
    const mapping = JSON.parse(fs.readFileSync(path.join(root, 'scripts/gallery-selection.json'), 'utf8'));
    const orderFor = source => photos.findIndex(photo => photo.image === `assets/galeria/${mapping.find(item => item.source === source).name}.webp`);
    assert.ok(Math.abs(orderFor('001-66.jpg') - orderFor('001-67.jpg')) > 1);
    const individualSequence = ['001-130.jpg', '001-131.jpg', '001-132.jpg'].map(orderFor).sort((a, b) => a - b);
    for (let index = 1; index < individualSequence.length; index++) assert.ok(individualSequence[index] - individualSequence[index - 1] > 1);
    assert.ok(!fs.existsSync(path.join(root, 'dist', 'assets', 'galeria', 'web')));
    const builtHome = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
    const builtPhotos = JSON.parse(builtHome.match(/<script type="application\/json" id="gallery-data">([\s\S]*?)<\/script>/)[1]);
    assert.deepEqual(builtPhotos, photos);
    assert.equal((builtHome.match(/data-gallery-index=/g) || []).length, 11);
});

test('bad gallery metadata, missing assets and original JPG paths fail before compilation', () => {
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'dojo-gallery-test-'));
    fs.mkdirSync(path.join(temporary, 'data'));
    const write = data => fs.writeFileSync(path.join(temporary, 'data', 'galeria.json'), JSON.stringify(data));
    try {
        const corrupt = structuredClone(photos);
        corrupt[0].order = 2;
        write(corrupt);
        assert.throws(() => readGallery(temporary));
        const original = structuredClone(photos);
        original[0].image = 'assets/galeria/web/001-73.jpg';
        write(original);
        assert.throws(() => readGallery(temporary), /Ruta o dimensiones/);
        write(photos);
        assert.throws(() => readGallery(temporary), /ENOENT/);
    } finally {
        // Only remove the fixture created by this test, after checking its root.
        assert.ok(temporary.startsWith(path.join(os.tmpdir(), 'dojo-gallery-test-')));
        fs.rmSync(temporary, { recursive: true, force: true });
    }
});

function viewerFixture(legacy = false) {
    const handlers = new Map();
    let document;
    const node = (name) => {
        const attributes = new Map();
        const classes = new Set(name === 'lightbox' && !legacy ? ['lightbox-editorial'] : []);
        return { name, hidden: false, style: {}, inert: false, tagName: name === 'background' ? 'MAIN' : 'DIV', isConnected: true,
            classList: { contains: c => classes.has(c), add: c => classes.add(c), remove: c => classes.delete(c) },
            setAttribute: (key, value) => attributes.set(key, value), removeAttribute: key => attributes.delete(key),
            getAttribute: key => attributes.get(key), focus() { document.activeElement = this; },
            addEventListener(type, handler) { handlers.set(name + ':' + type, handler); },
            setPointerCapture() {}
        };
    };
    const nodes = Object.fromEntries(['lightbox', 'lightbox-img', 'lightbox-caption', 'lightbox-counter', 'close', 'prev', 'next', 'trigger', 'background'].map(name => [name, node(name)]));
    if (legacy) { delete nodes['lightbox-caption']; delete nodes['lightbox-counter']; }
    document = { activeElement: nodes.trigger, body: { style: { overflow: 'clip' }, children: [nodes.background, nodes.lightbox] },
        getElementById: id => nodes[id], querySelector: selector => ({ '.lightbox-close': nodes.close, '.lightbox-prev': nodes.prev, '.lightbox-next': nodes.next })[selector],
        addEventListener: (type, handler) => handlers.set('document:' + type, handler)
    };
    const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
    const code = source.slice(source.indexOf("    const lightbox = document.getElementById('lightbox');"), source.indexOf('    loadEditorialGallery();'));
    const context = vm.createContext({ document, console });
    vm.runInContext(code + '\nglobalThis.viewer = { openLightboxWithImages, closeLightbox, showCarouselImage };', context);
    return { nodes, document, handlers, viewer: context.viewer };
}

test('viewer navigation wraps; Escape restores focus, scroll state and background access', () => {
    const { nodes, document, handlers, viewer } = viewerFixture();
    viewer.openLightboxWithImages(photos, 0);
    assert.equal(nodes['lightbox-img'].src, photos[0].image);
    assert.equal(nodes['lightbox-counter'].textContent, `01 / ${String(photos.length).padStart(2, '0')}`);
    assert.equal(document.activeElement, nodes.close);
    assert.equal(nodes.background.inert, true);
    const visited = new Set();
    for (let index = 0; index < 11; index++) {
        viewer.showCarouselImage(index);
        visited.add(nodes['lightbox-img'].src);
        assert.equal(nodes['lightbox-img'].src, photos[index].image);
        assert.equal(nodes['lightbox-counter'].textContent, `${String(index + 1).padStart(2, '0')} / 11`);
    }
    assert.equal(visited.size, 11);
    viewer.showCarouselImage(0);
    const key = name => handlers.get('document:keydown')({ key: name, preventDefault() {} });
    key('ArrowLeft');
    assert.equal(nodes['lightbox-img'].src, photos.at(-1).image);
    key('ArrowRight');
    assert.equal(nodes['lightbox-img'].src, photos[0].image);
    nodes.next.focus();
    key('Tab');
    assert.equal(document.activeElement, nodes.close);
    handlers.get('document:keydown')({ key: 'Tab', shiftKey: true, preventDefault() {} });
    assert.equal(document.activeElement, nodes.next);
    key('Escape');
    assert.equal(nodes.lightbox.hidden, true);
    assert.equal(document.activeElement, nodes.trigger);
    assert.equal(document.body.style.overflow, 'clip');
    assert.equal(nodes.background.inert, false);
});

test('touch navigation accepts deliberate horizontal gestures and rejects vertical or cancelled gestures', () => {
    const { nodes, handlers, viewer } = viewerFixture();
    viewer.openLightboxWithImages(photos, 0);
    const start = () => handlers.get('lightbox-img:pointerdown')({ pointerType: 'touch', isPrimary: true, pointerId: 1, clientX: 200, clientY: 200 });
    const end = (x, y) => handlers.get('lightbox-img:pointerup')({ pointerId: 1, clientX: x, clientY: y });
    start(); end(100, 205);
    assert.equal(nodes['lightbox-img'].src, photos[1].image);
    start(); end(110, 350);
    assert.equal(nodes['lightbox-img'].src, photos[1].image);
    start(); handlers.get('lightbox-img:pointercancel')(); end(100, 200);
    assert.equal(nodes['lightbox-img'].src, photos[1].image);
});

test('single image and legacy news images without caption or counter remain supported', () => {
    const { nodes, document, viewer } = viewerFixture(true);
    viewer.openLightboxWithImages([{ image: 'news.webp', alt: 'Noticia' }]);
    assert.equal(nodes.prev.hidden, true);
    assert.equal(nodes.next.hidden, true);
    assert.equal(nodes['lightbox-img'].alt, 'Noticia');
    viewer.closeLightbox();
    assert.equal(document.activeElement, nodes.trigger);
    viewer.openLightboxWithImages(photos, 0);
    viewer.closeLightbox();
    viewer.openLightboxWithImages(photos, 2);
    assert.equal(nodes['lightbox-img'].src, photos[2].image);
});

test('production enhancement reads embedded JSON without a fetch and opens the selected item', async () => {
    let clickHandler;
    let opened;
    const grid = { addEventListener(type, handler) { clickHandler = handler; }, contains: () => true };
    const document = { getElementById: id => id === 'gallery-data' ? { textContent: JSON.stringify(photos) } : null };
    const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
    const code = source.slice(source.indexOf('    // data/galeria.json is the only editorial source.'), source.indexOf('    if (filterBtns.length > 0)'));
    const context = vm.createContext({ document, photosGrid: grid, console, fetch() { throw new Error('Production must not fetch gallery data'); }, openLightboxWithImages(data, index) { opened = { data, index }; } });
    vm.runInContext(code + '\nglobalThis.load = loadEditorialGallery;', context);
    await context.load();
    clickHandler({ target: { closest: () => ({ dataset: { galleryIndex: '2' }, focus() {} }) } });
    assert.equal(opened.index, 2);
    assert.equal(opened.data.length, 11);
    assert.equal(opened.data[2].image, photos[2].image);
});
