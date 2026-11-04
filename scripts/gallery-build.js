'use strict';

const fs = require('fs');
const path = require('path');
const sectionIds = { Entrenamiento: 'entrenamiento', 'Técnica': 'tecnica', Dojo: 'dojo' };
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

// Read WebP dimensions without adding an image library to the production build.
function webpDimensions(buffer) {
    if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') throw new Error('No es un archivo WebP.');
    for (let offset = 12; offset + 8 <= buffer.length;) {
        const type = buffer.toString('ascii', offset, offset + 4);
        const length = buffer.readUInt32LE(offset + 4);
        const start = offset + 8;
        if (start + length > buffer.length) throw new Error('WebP truncado.');
        if (type === 'VP8X' && length >= 10) return { width: buffer.readUIntLE(start + 4, 3) + 1, height: buffer.readUIntLE(start + 7, 3) + 1 };
        if (type === 'VP8 ' && length >= 10) return { width: buffer.readUInt16LE(start + 6) & 0x3fff, height: buffer.readUInt16LE(start + 8) & 0x3fff };
        if (type === 'VP8L' && length >= 5) return { width: 1 + buffer[start + 1] + ((buffer[start + 2] & 63) << 8), height: 1 + (buffer[start + 2] >> 6) + (buffer[start + 3] << 2) + ((buffer[start + 4] & 15) << 10) };
        offset = start + length + (length % 2);
    }
    throw new Error('No se encontraron dimensiones WebP.');
}

function readGallery(root) {
    const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'galeria.json'), 'utf8'));
    if (!Array.isArray(data) || !data.length) throw new Error('La galería necesita una selección editorial.');
    const photos = [...data].sort((a, b) => a.order - b.order);
    const ids = new Set();
    const images = new Set();
    const sections = new Set();
    let previousSection;
    function validateImage(image) {
        if (!/^assets\/galeria\/[a-z0-9-]+\.webp$/.test(image.image) || !Number.isInteger(image.width) || !Number.isInteger(image.height) || image.width < 1 || image.height < 1) throw new Error(`Ruta o dimensiones inválidas: ${image.image}`);
        const meta = webpDimensions(fs.readFileSync(path.join(root, image.image)));
        if (meta.width !== image.width || meta.height !== image.height) throw new Error(`Dimensiones incorrectas: ${image.image}`);
    }
    photos.forEach((photo, index) => {
        if (!/^[a-z0-9-]+$/.test(photo.id) || ids.has(photo.id) || images.has(photo.image) || photo.order !== index + 1
            || !Object.hasOwn(sectionIds, photo.section) || !['wide', 'landscape', 'portrait'].includes(photo.layout)
            || typeof photo.alt !== 'string' || photo.alt.trim().length < 15 || typeof photo.description !== 'string' || photo.description.length > 180) {
            throw new Error(`Ficha de galería inválida: ${photo.id}`);
        }
        if (index === 0 && (photo.layout !== 'wide' || photo.width <= photo.height)) throw new Error('La protagonista debe ser horizontal y wide.');
        if (photo.layout === 'portrait' && photo.width >= photo.height) throw new Error(`La fotografía ${photo.id} debe ser vertical.`);
        if (photo.section !== previousSection) {
            if (sections.has(photo.section)) throw new Error('Los capítulos deben mantenerse consecutivos.');
            sections.add(photo.section);
            previousSection = photo.section;
        }
        ids.add(photo.id);
        images.add(photo.image);
        validateImage(photo);
        if (!Array.isArray(photo.sources) || !photo.sources.length) throw new Error(`Falta variante responsive: ${photo.id}`);
        const widths = new Set([photo.width]);
        for (const variant of photo.sources) {
            validateImage(variant);
            if (variant.width >= photo.width || widths.has(variant.width) || Math.abs(variant.width / variant.height - photo.width / photo.height) > .01) throw new Error(`Variante incompatible: ${variant.image}`);
            widths.add(variant.width);
        }
    });
    return photos;
}

function imageSizes(photo) {
    const mobile = '(max-width: 767px) calc(100vw - 40px)';
    if (photo.layout === 'wide') return `${mobile}, (max-width: 1199px) calc(100vw - 64px), 1136px`;
    if (photo.layout === 'portrait') return `${mobile}, (max-width: 1199px) calc((100vw - 96px) / 3), 357px`;
    return `${mobile}, (max-width: 1199px) calc((100vw - 96px) * 2 / 3), 747px`;
}

function renderGallery(photos) {
    const sections = [...new Set(photos.map(photo => photo.section))];
    return sections.map((section, chapter) => {
        const id = sectionIds[section];
        const figures = photos.filter(photo => photo.section === section).map(photo => {
            const index = photos.indexOf(photo);
            const srcset = [...photo.sources, photo].sort((a, b) => a.width - b.width).map(source => `${source.image} ${source.width}w`).join(', ');
            return `<figure class="gallery-photo gallery-photo--${photo.layout}" style="--photo-ratio: ${photo.width} / ${photo.height}">
                <button type="button" class="gallery-photo-button" data-gallery-index="${index}" aria-label="${escapeHtml(`Ampliar fotografía ${index + 1} de ${photos.length}: ${photo.alt}`)}">
                    <img src="${escapeHtml(photo.image)}" srcset="${escapeHtml(srcset)}" sizes="${escapeHtml(imageSizes(photo))}" alt="${escapeHtml(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="${index === 0 ? 'eager' : 'lazy'}"${index === 0 ? ' fetchpriority="high"' : ''} decoding="async">
                </button>
            </figure>`;
        }).join('\n');
        return `<section class="gallery-chapter gallery-chapter--${id}" aria-labelledby="gallery-chapter-${id}">
            <h3 class="gallery-chapter-title" id="gallery-chapter-${id}"><span aria-hidden="true">${String(chapter + 1).padStart(2, '0')}</span>${escapeHtml(section)}</h3>
            <div class="gallery-editorial-grid">${figures}</div>
        </section>`;
    }).join('\n');
}

function compileGallery(homepage, photos) {
    const start = '<!-- GALERIA_V2_START -->';
    const end = '<!-- GALERIA_V2_END -->';
    const first = homepage.indexOf(start);
    const last = homepage.indexOf(end);
    if (first < 0 || last <= first) throw new Error('Faltan los marcadores de Galería V2 en la Home.');
    const json = JSON.stringify(photos).replace(/</g, '\\u003c');
    return homepage.slice(0, first + start.length) + '\n' + renderGallery(photos) + `\n<script type="application/json" id="gallery-data">${json}</script>\n` + homepage.slice(last);
}

module.exports = { readGallery, renderGallery, compileGallery, imageSizes, webpDimensions };
