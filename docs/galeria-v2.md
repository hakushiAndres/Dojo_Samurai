# Galería Editorial V2 — corrección definitiva: 11 fotografías únicas

Se conservan las cinco fotografías publicadas y se incorporan exactamente seis tomas adicionales: 001-66, 001-67, 001-84, 001-130, 001-131 y 001-132. Las tomas próximas se conservan, pero se separan en la secuencia. No hay entradas para variantes ni copias de los originales ya publicados.

El JPG 001-146.jpg está ausente. Se utiliza directamente el WebP publicado clase-karate-adultos-04.webp, sin sustituirlo por una copia con otro nombre. Los cinco WebP publicados coinciden byte por byte con HEAD. La carpeta fuente permanece intacta y excluida de dist.

## Orden editorial

| Orden | Origen | Estado | Capítulo | Layout | Archivo |
|---:|---|---|---|---|---|
| 1 | 001-73.jpg | Publicada conservada | Entrenamiento | wide | kihon-karate-adultos-01.webp |
| 2 | 001-130.jpg | Adicional | Entrenamiento | portrait | postura-karate-adulto-13.webp |
| 3 | 001-63.jpg | Publicada conservada | Entrenamiento | landscape | entrenamiento-grupal-karate-03.webp |
| 4 | 001-66.jpg | Adicional | Entrenamiento | wide | posiciones-karate-grupo-09.webp |
| 5 | 001-132.jpg | Adicional | Técnica | portrait | posicion-karate-adulto-06.webp |
| 6 | 001-128.jpg | Publicada conservada | Técnica | landscape | correccion-tecnica-karate-02.webp |
| 7 | 001-84.jpg | Adicional | Técnica | portrait | golpe-puno-karate-07.webp |
| 8 | 001-67.jpg | Adicional | Técnica | landscape | practica-tecnica-grupo-10.webp |
| 9 | 001-131.jpg | Adicional | Dojo | portrait | concentracion-karate-adulto-14.webp |
| 10 | 001-146.jpg (WebP conservado) | Publicada conservada | Dojo | landscape | clase-karate-adultos-04.webp |
| 11 | 001-152.jpg | Publicada conservada | Dojo | wide | grupo-karate-seiza-05.webp |

Se mantiene 001-73 como protagonista. Entrenamiento tiene cuatro fotos, Técnica cuatro y Dojo tres. Las cuatro verticales se distribuyen en las posiciones 2, 5, 7 y 9. Las fotos 66/67 están en 4/8; las fotos 130/132/131 están en 2/5/9. El cierre es el grupo en seiza. En escritorio cada vertical se empareja con una horizontal; se conservaron los layouts wide, landscape y portrait. En móvil se utiliza una columna y se respetan las proporciones.

## Alt text

1. Practicantes adultos realizando golpes de puño en una clase de karate
2. Practicante con cinturón negro y las piernas separadas frente a una cortina y un espejo
3. Grupo de practicantes adultos de karate entrenando posiciones y técnicas de brazos
4. Practicantes de karate en posiciones amplias, distribuidos en varias filas
5. Practicante con cinturón negro en posición amplia, con una mano abierta extendida
6. Instructor corrigiendo la posición del brazo de un practicante de karate
7. Practicante adulto ejecutando un golpe de puño con otros alumnos al fondo
8. Grupo de karate trabajando técnicas de brazos con las piernas flexionadas
9. Practicante con cinturón negro flexionando las piernas durante un ejercicio de posición
10. Practicantes de karate durante la clase, con una alumna extendiendo un brazo al fondo
11. Grupo de practicantes de karate sentados en seiza sobre el suelo del dojo

## Archivos y pesos

Todos los archivos siguientes están en assets/galeria/. Cada variante usa el mismo nombre base con sufijo -800w.webp.

| Orden | WebP base | Dimensiones base | Bytes base | Dimensiones variante | Bytes variante |
|---:|---|---:|---:|---:|---:|
| 1 | kihon-karate-adultos-01.webp | 1800 × 1200 | 214146 | 800 × 533 | 37824 |
| 2 | postura-karate-adulto-13.webp | 1067 × 1600 | 253720 | 800 × 1200 | 92438 |
| 3 | entrenamiento-grupal-karate-03.webp | 1600 × 1067 | 185530 | 800 × 534 | 37424 |
| 4 | posiciones-karate-grupo-09.webp | 1600 × 1067 | 210566 | 800 × 533 | 42658 |
| 5 | posicion-karate-adulto-06.webp | 1067 × 1600 | 294178 | 800 × 1200 | 113548 |
| 6 | correccion-tecnica-karate-02.webp | 1600 × 1067 | 154302 | 800 × 534 | 26960 |
| 7 | golpe-puno-karate-07.webp | 1067 × 1600 | 198032 | 800 × 1200 | 89864 |
| 8 | practica-tecnica-grupo-10.webp | 1600 × 1067 | 211892 | 800 × 533 | 43396 |
| 9 | concentracion-karate-adulto-14.webp | 1067 × 1600 | 256084 | 800 × 1200 | 97256 |
| 10 | clase-karate-adultos-04.webp | 1600 × 1067 | 184274 | 800 × 534 | 29262 |
| 11 | grupo-karate-seiza-05.webp | 1600 × 1067 | 217590 | 800 × 534 | 51870 |

Bases: **2380314 bytes**. Variantes: **662500 bytes**. Almacenamiento de los 22 archivos referenciados: **3042814 bytes**. Son alternativas de srcset, no descarga inicial conjunta. La protagonista usa eager/fetchpriority high; las otras diez lazy. Todas usan decoding async y dimensiones explícitas. La selección del tamaño depende de viewport y DPR. No se hizo upscale ni se recortaron físicamente las imágenes.

## Datos y automatización

data/galeria.json es la única selección editorial. scripts/gallery-selection.json contiene solamente las seis incorporaciones y sus nombres semánticos. La herramienta process-gallery-images.js conserva los derivados existentes y no publica ni modifica el JSON automáticamente. Se reutilizaron las seis bases y sus variantes ya preparadas; no se sobrescribieron. Sharp está disponible localmente; no se instalaron nuevas dependencias y el build no lo requiere. Los derivados de iteraciones anteriores no utilizados se conservan en el workspace, fuera de la selección y del mapping; no se hizo limpieza de assets.

scripts/gallery-build.js valida las rutas y las dimensiones WebP, y el build genera HTML y JSON embebido. El cliente usa exactamente la misma colección en el visor. La Home fuente conserva una carga alternativa del JSON por HTTP. Los capítulos son Entrenamiento, Técnica y Dojo, sin atribuir kata o kumite.

## Lightbox y accesibilidad

El visor recorre once imágenes, con contadores 01 / 11 a 11 / 11. Conserva navegación circular, anterior/siguiente, flechas, Escape, ciclo Tab/Shift+Tab, retorno de foco, fondo inert, restauración de scroll y swipe. Las variantes no son entradas independientes. Se mantiene el fondo casi negro y reduced-motion. Los botones y alt text siguen siendo accesibles.

## Validación y comparación

Build correcto; ocho pruebas aprobadas; checks de sintaxis correctos; git diff --check correcto. Las pruebas comprueban once entradas, órdenes 1–11, IDs/rutas únicos, archivos existentes, seis fuentes exactas, protagonista, separación de secuencias, colección recibida por el visor, los once contadores, foco, teclado y swipe. El JSON servido y el compilado contienen once entradas. Las 22 rutas de imágenes devolvieron HTTP 200, se decodificaron y sus dimensiones/bytes coinciden con los archivos fuente. El acceso HTTP a un original devolvió 404; dist no contiene assets/galeria/web.

```powershell
npm.cmd run build
node --test tests/gallery.test.js
node scripts/preview-gallery.js
```

V2: http://127.0.0.1:4173/#gallery

Actual de HEAD: http://127.0.0.1:4173/actual/#gallery

El servidor solo escucha en loopback; Ctrl+C lo detiene.

El navegador de la sesión sigue indisponible. Las pruebas del visor usan un DOM simulado y no certifican la presentación visual real. En PC revisar las parejas vertical/horizontal, el recorte de la protagonista, la separación de capítulos, el grupo final y foco/teclado del visor. En celular revisar 320, 360, 375, 390 y 768 px, scroll lateral, verticales completas, orientación, safe area, swipe/pinch y retorno de foco. Probar también Videos y una imagen de Noticias por compartir el visor.

No se ejecutaron git add, commit, push ni deploy. No se restauraron ni stagearon torneo1.jpg/torneo2.jpg.
