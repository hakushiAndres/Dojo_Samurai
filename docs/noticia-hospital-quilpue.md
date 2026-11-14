# Noticia Hospital de Quilpué — destacada con fotografías

Evento: 2026-11-11. Publicación original: 2026-11-14.
Actualización fotográfica: 2026-11-14. Categoría: Comunidad.
URL: https://www.samuraijkavalemana.cl/noticias/karate-defensa-personal-hospital-quilpue/

Se actualiza exclusivamente la noticia existente: `featured: true`, etiqueta
`ACTIVIDAD DEL DOJO` y `publicationMode: photos`. Se mantienen slug, título,
descripción SEO, fechas originales y prosa aprobada. Las noticias anteriores
conservan todos sus datos e indicadores featured. El listado ordena primero las
destacadas y, entre ellas, por datePublished o date descendente.

## Autorización y protección de datos

El usuario confirmó en la solicitud de esta actualización que cuenta con la
autorización de difusión de los participantes, incluida la menor. Por esa
confirmación se registran participants y minorGuardian en true. No se han creado
consentimientos individuales ni se afirma disponer de documentos de respaldo.

Se revisaron visualmente las tres fotografías y ampliaciones de los certificados.
Se pixelaron selectivamente nombres, firmas y texto personal de los certificados:
seis áreas en la foto grupal (incluye certificados superpuestos), una en el saludo
y una en la entrega. No se modificaron rostros ni se generó contenido artificial.
Se preservaron composición, dimensiones, colores y contexto de la ceremonia.
certificatesReviewed se registra en true por esa revisión y ocultación, sin
interpretarlo como autorización adicional para divulgar datos personales.

Los archivos publicados son las tres WebP seleccionadas y sus variantes -800w.
La grupal mide 1280 × 720; su variante, 800 × 450. Las interiores miden 720 × 1280;
sus variantes -800w se regeneraron a 450 × 800. Los descriptores srcset reflejan
el ancho real, aunque el sufijo del nombre sea heredado.
Los originales sin ocultación y el paquete suministrado permanecen locales,
fuera del commit y de dist. No se publica el paquete original ni scratch.

## Presentación y controles

La grupal es la única portada del artículo, de la tarjeta y de OG, Twitter y
NewsArticle. Se muestran saludo y entrega como interiores con ALT, dimensiones,
srcset, sizes, lazy loading, decoding async y pies de foto. No se repite la portada.
El build sigue rechazando el modo photos si falta cualquiera de los tres controles.
El modo text-only continúa disponible y excluye fotografías y referencias del
HTML y JSON públicos. Los controles internos no se incluyen en el JSON público.

NewsArticle mantiene datePublished y utiliza dateModified para la actualización.
Al realizarse ambos cambios el 2026-11-14, sus fechas coinciden. Canonical y URL
permanecen sin cambios. El sitemap mantiene la URL y la fecha correctas.

## Validación y despliegue

Ejecutar npm.cmd run build, node --check build.js, node --check script.js,
node --test tests/gallery.test.js, node --test tests/hospital-news.test.js y
git diff --check. Las pruebas comprueban privacidad, tres fotografías y variantes,
metadatos, primer puesto destacado en el renderizador real y Galería V2.
Se comparan Home, Happy Hours, prosa aprobada y noticias anteriores con el estado previo.
Publicar por push a origin/main y la integración Git existente de
samurai12/dojo-samurai; comprobar READY y los recursos públicos.
