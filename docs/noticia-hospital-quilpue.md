# Noticia Hospital de Quilpué — publicación textual

Evento: 2026-11-11. Publicación: 2026-11-14. Categoría: Comunidad.
URL: https://www.samuraijkavalemana.cl/noticias/karate-defensa-personal-hospital-quilpue/

Se activa únicamente esta entrada con `status: published` y `publicationMode: text-only`.
El texto aprobado permanece intacto en el origen. El build omite las figuras
fotográficas en HTML y JSON públicos. Se conserva literalmente la prosa aprobada,
incluida su mención a las fotografías de la jornada, aunque estas quedan retenidas.
La tarjeta y los metadatos sociales usan el emblema JKA ya existente en el sitio:
`assets/ui/animacion/jka_logo.png` (84 × 84). No se utiliza la portada fotográfica.

## Privacidad

No hay constancia verificada de autorizaciones. Los tres controles de
`publicationChecks` siguen en `false`, sin registrar permisos inexistentes:
- Difusión de participantes identificables, incluidas personas en reflejos.
- Autorización del representante de la menor.
- Revisión y autorización de información personal visible en certificados.

La revisión previa documentó texto personal visible en la fotografía de entrega.
No se considera resuelto. Las seis WebP y el paquete original permanecen locales,
sin stage, commit ni copia a dist. El build excluye la carpeta Hospital-Quilpue
salvo que el modo sea `photos` y los tres controles estén verificados.

## Mecanismo

El build valida estado, fechas reales y modo de publicación antes de reemplazar
dist. El modo `photos` requiere los tres controles; `text-only` mantiene el bloqueo
de las fotografías y proyecta una versión pública sin sus figuras ni referencias.
NewsArticle, article:published_time y sitemap usan datePublished; la fecha visible
conserva la del evento. El JSON público omite controles internos y modo de publicación.

`node build.js --preview-news` genera una vista local en scratch/quilpue-preview,
separada de dist. Los borradores se omiten del sitemap y usan noindex/nofollow.
No compartir vistas de borradores con material pendiente de autorización.

Validación: npm.cmd run build, node --check build.js, node --check script.js,
node --test tests/gallery.test.js tests/hospital-news.test.js y git diff --check.
La publicación se realiza mediante push a origin/main y la integración Git existente
del proyecto samurai12/dojo-samurai, sin crear un proyecto adicional.
