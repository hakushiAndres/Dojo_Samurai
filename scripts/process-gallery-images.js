#!/usr/bin/env node
'use strict';

// Internal preparation only. Never edits gallery data, stages files or publishes.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const originals = path.join(root, 'assets', 'galeria', 'web');
const output = path.join(root, 'assets', 'galeria');

async function main() {
    let sharp;
    try { sharp = require('sharp'); }
    catch { throw new Error('Esta herramienta necesita Sharp en el entorno local. No se instala automáticamente ni es necesario para npm run build.'); }
    const args = process.argv.slice(2);
    const mode = args[0] || '--inventory';
    if (!['--inventory', '--process'].includes(mode) || args.length > 2 || (mode === '--inventory' && args.length > 1)) {
        throw new Error('Uso: node scripts/process-gallery-images.js --inventory | --process [mapping.json]');
    }
    const files = fs.readdirSync(originals).filter(name => /\.jpe?g$/i.test(name)).sort();
    if (mode === '--inventory') {
        for (const name of files) {
            const file = path.join(originals, name);
            const meta = await sharp(file).metadata();
            const rotated = [5, 6, 7, 8].includes(meta.orientation);
            const width = rotated ? meta.height : meta.width;
            const height = rotated ? meta.width : meta.height;
            console.log(JSON.stringify({ name, width, height, orientation: width > height ? 'landscape' : width < height ? 'portrait' : 'square', ratio: +(width / height).toFixed(4), bytes: fs.statSync(file).size }));
        }
        console.log(`${files.length} JPG/JPEG. Inventario únicamente; no se generó ni publicó ninguna fotografía.`);
        return;
    }
    const mapping = JSON.parse(fs.readFileSync(path.resolve(root, args[1] || 'scripts/gallery-selection.json'), 'utf8'));
    if (!Array.isArray(mapping) || !mapping.length) throw new Error('El mapping debe ser una selección manual no vacía.');
    const names = new Set();
    const inputPath = item => path.join(item.sourceDirectory === 'optimized' ? output : originals, item.source);
    // Validate the entire mapping before generating any derivative.
    for (const item of mapping) {
        const validSource = item.sourceDirectory === 'optimized'
            ? /^[a-z0-9-]+\.webp$/.test(item.source) && fs.existsSync(inputPath(item))
            : item.sourceDirectory === undefined && files.includes(item.source);
        if (!validSource || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.name) || names.has(item.name)
            || !Number.isInteger(item.longEdge) || item.longEdge < 320 || item.longEdge > 2400
            || !Number.isInteger(item.quality) || item.quality < 40 || item.quality > 95
            || !Number.isInteger(item.previewWidth) || item.previewWidth < 240 || item.previewWidth > item.longEdge) {
            throw new Error(`Entrada de mapping inválida: ${JSON.stringify(item)}`);
        }
        names.add(item.name);
    }
    let originalTotal = 0;
    let baseTotal = 0;
    let previewTotal = 0;
    for (const item of mapping) {
        const input = inputPath(item);
        const originalBytes = fs.statSync(input).size;
        originalTotal += originalBytes;
        for (const preview of [false, true]) {
            const name = `${item.name}${preview ? `-${item.previewWidth}w` : ''}.webp`;
            const destination = path.join(output, name);
            const pipeline = sharp(input).rotate().resize(preview
                ? { width: item.previewWidth, withoutEnlargement: true }
                : { width: item.longEdge, height: item.longEdge, fit: 'inside', withoutEnlargement: true });
            const exists = fs.existsSync(destination);
            if (!exists) {
                const sourceMetadata = await sharp(input).metadata();
                if (!preview && item.sourceDirectory === 'optimized' && Math.max(sourceMetadata.width, sourceMetadata.height) <= item.longEdge) {
                    // Preserve an already optimized fallback byte for byte.
                    fs.copyFileSync(input, destination);
                } else await pipeline.webp({ quality: item.quality, effort: 6 }).toFile(destination);
            }
            const meta = await sharp(destination).metadata();
            const expected = await pipeline.toBuffer({ resolveWithObject: true });
            if (meta.format !== 'webp' || meta.width !== expected.info.width || meta.height !== expected.info.height) {
                throw new Error(`El derivado existente ${name} no coincide con el mapping; revisarlo manualmente. No se sobrescribió.`);
            }
            const bytes = fs.statSync(destination).size;
            if (preview) previewTotal += bytes; else baseTotal += bytes;
            console.log(`${exists ? 'Conservado' : 'Generado'} ${name}: ${meta.width}x${meta.height}; original ${originalBytes} B → ${bytes} B; reducción ${(100 * (1 - bytes / originalBytes)).toFixed(2)}%`);
        }
    }
    console.log(JSON.stringify({ selected: mapping.length, originalBytes: originalTotal, baseBytes: baseTotal, previewBytes: previewTotal, totalDerivativeBytes: baseTotal + previewTotal, reductionPercent: +(100 * (1 - (baseTotal + previewTotal) / originalTotal)).toFixed(2) }));
    console.log('La selección pública sigue siendo manual en data/galeria.json. No se modificaron originales ni derivados existentes.');
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
