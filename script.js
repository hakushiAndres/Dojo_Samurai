document.addEventListener('DOMContentLoaded', () => {
    // Notice Modal Pop-up (Aviso Importante al Cargar)
    const noticeOverlay = document.getElementById('notice-modal-overlay');
    const closeNoticeBtn = document.getElementById('close-notice-modal');
    const confirmNoticeBtn = document.getElementById('confirm-notice-btn');

    if (noticeOverlay) {
        const isNoticeClosed = sessionStorage.getItem('dojo_notice_closed') === 'true';

        if (!isNoticeClosed) {
            setTimeout(() => {
                noticeOverlay.classList.add('active');
            }, 300);
        }

        const dismissNotice = () => {
            noticeOverlay.classList.remove('active');
            sessionStorage.setItem('dojo_notice_closed', 'true');
        };

        if (closeNoticeBtn) closeNoticeBtn.addEventListener('click', dismissNotice);
        if (confirmNoticeBtn) confirmNoticeBtn.addEventListener('click', dismissNotice);

        noticeOverlay.addEventListener('click', (e) => {
            if (e.target === noticeOverlay) {
                dismissNotice();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && noticeOverlay.classList.contains('active')) {
                dismissNotice();
            }
        });
    }

    // Real-time SVG Kanji Stroke Animation (Shotokan / 松濤館)
    const kanjiSvg = document.querySelector('.kanji-svg');
    if (kanjiSvg) {
        const paths = kanjiSvg.querySelectorAll('path');
        paths.forEach((path, index) => {
            const length = Math.ceil(path.getTotalLength());
            path.style.setProperty('--path-length', length);
            path.style.strokeDasharray = length;
            path.style.strokeDashoffset = length;
            path.style.animationDelay = `${index * 0.07}s`;
        });

        setTimeout(() => {
            kanjiSvg.classList.add('animated');
        }, 150);
    }

    // Promotional Flyout Widget Logic (with localStorage persistence)
    const flyoutCard = document.getElementById('promo-flyout-widget');
    const closeFlyoutBtn = document.getElementById('close-flyout');
    const reopenBubble = document.getElementById('promo-reopen-bubble');

    if (flyoutCard && closeFlyoutBtn && reopenBubble) {
        const isClosed = localStorage.getItem('dojo_promo_closed') === 'true';

        if (isClosed) {
            // User previously closed the card; show minimized bubble directly
            reopenBubble.classList.add('visible');
        } else {
            // 1.5 seconds delay before entrance animation for first-time visitors
            setTimeout(() => {
                flyoutCard.classList.add('active');
            }, 1500);
        }

        // Close flyout card, save preference in localStorage & show reopen bubble
        closeFlyoutBtn.addEventListener('click', () => {
            flyoutCard.classList.remove('active');
            localStorage.setItem('dojo_promo_closed', 'true');
            setTimeout(() => {
                reopenBubble.classList.add('visible');
            }, 300);
        });

        // Re-open flyout card from bubble trigger
        reopenBubble.addEventListener('click', () => {
            reopenBubble.classList.remove('visible');
            flyoutCard.classList.add('active');
        });
    }

    // Inyo Symbol Tooltip Touch/Click Toggle
    const inyoContainer = document.querySelector('.inyo-symbol-container');
    const inyoTooltip = document.querySelector('.inyo-tooltip');

    if (inyoContainer) {
        inyoContainer.addEventListener('click', (e) => {
            // If clicking on the tooltip card itself while open, close it immediately
            if (inyoTooltip && inyoTooltip.contains(e.target)) {
                e.stopPropagation();
                inyoContainer.classList.remove('active');
                return;
            }
            inyoContainer.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!inyoContainer.contains(e.target)) {
                inyoContainer.classList.remove('active');
            }
        });
    }

    // Back to Top Button Functionality
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        }, { passive: true });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Mobile menu toggle
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links a');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        links.forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                }
            });
        });
    }

    // Form Validation & Dynamic Submit Button State
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('form-message');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const messageInput = document.getElementById('message');
    const charCountSpan = document.getElementById('char-count');
    const submitBtn = document.getElementById('submit-btn');

    // Email validation regex
    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Dynamic Form Validation Function
    const validateForm = () => {
        if (!nameInput || !emailInput || !phoneInput || !messageInput || !submitBtn) return false;

        const nameVal = nameInput.value.trim();
        const emailVal = emailInput.value.trim();
        const phoneVal = phoneInput.value.trim();
        const messageVal = messageInput.value.trim();

        const isNameValid = nameVal.length >= 2;
        const isEmailValid = isValidEmail(emailVal);
        const isPhoneValid = phoneVal.length >= 8;
        const isMessageValid = messageVal.length > 0 && messageVal.length <= 500;

        const isFormValid = isNameValid && isEmailValid && isPhoneValid && isMessageValid;

        if (isFormValid) {
            submitBtn.removeAttribute('disabled');
        } else {
            submitBtn.setAttribute('disabled', 'true');
        }

        return isFormValid;
    };

    // Live character counter & input validation listeners
    if (messageInput && charCountSpan) {
        messageInput.addEventListener('input', () => {
            const charLength = messageInput.value.length;
            charCountSpan.textContent = charLength;
            if (charLength >= 500) {
                charCountSpan.classList.add('limit-reached');
            } else {
                charCountSpan.classList.remove('limit-reached');
            }
            validateForm();
        });
    }

    [nameInput, emailInput, phoneInput].forEach(input => {
        if (input) {
            input.addEventListener('input', validateForm);
            input.addEventListener('blur', validateForm);
        }
    });

    // Helper function to sanitize user inputs against XSS injections
    const sanitizeInput = (str) => {
        if (typeof str !== 'string') return '';
        return str.replace(/[<>]/g, '').trim();
    };

    let lastSubmitTime = 0;

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // 1. Anti-Spam Honeypot Verification
            const hpInput = document.getElementById('website_hp');
            if (hpInput && hpInput.value !== '') {
                // Silent block for automated bots
                formMessage.textContent = '¡Gracias! Tu mensaje ha sido procesado.';
                formMessage.className = 'form-message';
                contactForm.reset();
                return;
            }

            // 2. Client-Side Submission Cooldown (Rate Limiting)
            const now = Date.now();
            if (now - lastSubmitTime < 15000) { // 15 seconds cooldown
                formMessage.textContent = 'Por favor espera unos segundos antes de enviar otro mensaje.';
                formMessage.className = 'form-message error';
                return;
            }
            
            if (!validateForm()) {
                formMessage.textContent = 'Por favor completa todos los campos correctamente.';
                formMessage.className = 'form-message error';
                return;
            }

            // 3. Input Sanitization
            const nameVal = sanitizeInput(nameInput.value);
            const emailVal = sanitizeInput(emailInput.value);
            const phoneVal = sanitizeInput(phoneInput.value);
            const messageVal = sanitizeInput(messageInput.value);

            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Enviando...';
            submitBtn.setAttribute('disabled', 'true');
            lastSubmitTime = Date.now();

            const formData = new FormData();
            formData.append('name', nameVal);
            formData.append('email', emailVal);
            formData.append('phone', phoneVal);
            formData.append('message', messageVal);
            formData.append('_subject', 'Nuevo Mensaje de Contacto - Dojo Samurai Villa Alemana');
            formData.append('_template', 'table');
            formData.append('_captcha', 'false');

            fetch("https://formsubmit.co/ajax/samurai.jka.valemana@gmail.com", {
                method: "POST",
                headers: { 
                    'Accept': 'application/json'
                },
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('FormSubmit HTTP status: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                submitBtn.textContent = originalText;
                contactForm.reset();
                if (charCountSpan) charCountSpan.textContent = '0';
                validateForm(); // Re-disable submit button after reset
                
                formMessage.textContent = '¡Gracias! Tu mensaje ha sido enviado exitosamente. Nos pondremos en contacto pronto.';
                formMessage.className = 'form-message';
                
                setTimeout(() => {
                    formMessage.className = 'form-message hidden';
                    formMessage.textContent = '';
                }, 6000);
            })
            .catch(error => {
                console.error('FormSubmit Error:', error);
                submitBtn.textContent = originalText;
                validateForm();
                
                // Show fallback message and open WhatsApp automatically as instant backup
                formMessage.textContent = 'Procesando mensaje por WhatsApp... Redirigiendo...';
                formMessage.className = 'form-message';

                setTimeout(() => {
                    const waMsg = encodeURIComponent(`Hola Dojo Samurai, me gustaría enviar una consulta:\n- Nombre: ${nameVal}\n- Correo: ${emailVal}\n- Teléfono: ${phoneVal}\n- Mensaje: ${messageVal}`);
                    window.open(`https://wa.me/56942825617?text=${waMsg}`, '_blank');
                    contactForm.reset();
                    if (charCountSpan) charCountSpan.textContent = '0';
                    validateForm();
                }, 1200);
            });
        });
    }

    // Gallery Filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    const photosGrid = document.getElementById('photos-grid');
    const videosGrid = document.getElementById('videos-grid');

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add active to clicked
                btn.classList.add('active');
                
                const filter = btn.getAttribute('data-filter');
                if (filter === 'photos') {
                    photosGrid.style.display = 'grid';
                    videosGrid.style.display = 'none';
                    // Pause all videos
                    const videos = videosGrid.querySelectorAll('video');
                    videos.forEach(v => v.pause());
                } else if (filter === 'videos') {
                    photosGrid.style.display = 'none';
                    videosGrid.style.display = 'grid';
                }
            });
        });
    }

    // Lightbox Functionality
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');
    const triggers = document.querySelectorAll('.lightbox-trigger');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    let currentImageIndex = 0;

    if (lightbox && lightboxImg && closeBtn) {
        triggers.forEach((img, index) => {
            img.addEventListener('click', () => {
                currentImageIndex = index;
                lightbox.classList.add('active');
                lightboxImg.src = img.src;
            });
        });

        const showImage = (index) => {
            if (index < 0) currentImageIndex = triggers.length - 1;
            else if (index >= triggers.length) currentImageIndex = 0;
            else currentImageIndex = index;
            
            lightboxImg.src = triggers[currentImageIndex].src;
        };

        if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentImageIndex - 1); });
        if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentImageIndex + 1); });

        const closeLightbox = () => {
            lightbox.classList.remove('active');
            setTimeout(() => {
                lightboxImg.src = '';
            }, 300);
        };

        closeBtn.addEventListener('click', closeLightbox);
        
        // Close on clicking outside the image
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        // Close on Escape key, and navigate with arrows
        document.addEventListener('keydown', (e) => {
            if (lightbox.classList.contains('active')) {
                if (e.key === 'Escape') closeLightbox();
                if (e.key === 'ArrowLeft') showImage(currentImageIndex - 1);
                if (e.key === 'ArrowRight') showImage(currentImageIndex + 1);
            }
        });
    }

    // ==========================================
    // Hybrid News / Blog System Module
    // ==========================================
    const defaultNewsData = [
        {
            "id": "campeonato-zona-central-jka-2026",
            "slug": "campeonato-zona-central-jka-2026",
            "title": "Destacada participación del Dojo Samurai en el Campeonato Zona Central JKA",
            "date": "2026-08-10",
            "dateFormatted": "10 de Agosto, 2026",
            "category": "Torneos",
            "author": "Sensei Dojo Samurai",
            "image": "assets/galeria/adultos2.jpg",
            "excerpt": "Nuestros competidores obtuvieron múltiples podios en Kata y Kumite individual y por equipos durante el torneo oficial de la Japan Karate Association.",
            "content": "<p>Con gran orgullo y espíritu marcial, la delegación del <strong>Dojo Samurai</strong> participó en el reciente <strong>Campeonato Zona Central JKA</strong>, reuniendo a los mejores exponentes de la región.</p><p>Nuestros atletas demostraron un nivel técnico excepcional, reflejando meses de arduo entrenamiento, disciplina y dedicación constante bajo los lineamientos de la Japan Karate Association.</p><p>Felicitamos a todos los competidores por su entrega incondicional y por representar con honor los valores fundamentales del Budo en cada combate y exhibición de Kata.</p>",
            "readTime": "3 min de lectura",
            "featured": true
        },
        {
            "id": "nuevo-horario-clases-adultos-2026",
            "slug": "nuevo-horario-clases-adultos-2026",
            "title": "Actualización de Horario Oficial: Clases de Adultos y Jóvenes a las 21:00 hrs",
            "date": "2026-08-11",
            "dateFormatted": "11 de Agosto, 2026",
            "category": "Clases y Horarios",
            "author": "Administración Dojo Samurai",
            "image": "assets/galeria/Clases6.jpg",
            "excerpt": "A partir de esta semana, el bloque oficial para adultos y jóvenes mayores de 18 años se impartirá los días Martes y Jueves de 21:00 a 22:00 hrs.",
            "content": "<p>Informamos a toda nuestra comunidad que el horario del bloque de <strong>Adultos y Jóvenes (desde los 18 años)</strong> ha sido optimizado a los días <strong>Martes y Jueves de 21:00 a 22:00 hrs</strong>.</p><p>Este ajuste permite acomodar de mejor manera los compromisos laborales y académicos de nuestros alumnos, manteniendo la intensidad física y el rigor técnico tradicional que caracteriza al Karate Shotokan JKA.</p><p>Recuerda que tu primera clase de prueba es totalmente gratuita. ¡Te esperamos en nuestro dojo ubicado en Balmaceda 188, Casa 2 (Universo Vipalu)!</p>",
            "readTime": "2 min de lectura",
            "featured": true
        },
        {
            "id": "seminario-tecnico-jka-chile-2026",
            "slug": "seminario-tecnico-jka-chile-2026",
            "title": "Próximo Seminario Técnico e Exámenes de Grado JKA Chile",
            "date": "2026-07-28",
            "dateFormatted": "28 de Julio, 2026",
            "category": "Eventos",
            "author": "Comisión Técnica",
            "image": "assets/galeria/Clases1.jpg",
            "excerpt": "Se confirman las fechas para el seminario técnico y mesa examinadora oficial supervisada por el Sensei Raúl Puchi Zarecht (6to Dan JKA).",
            "content": "<p>Nos complace anunciar la realización del próximo <strong>Seminario Técnico e Exámenes de Grado JKA Chile</strong>, evento fundamental para el avance en la escala de grados Kyu y Dan de nuestra organización.</p><p>El seminario abordará el perfeccionamiento de los principios biomecánicos del <em>Kihon</em>, el análisis profundo de los <em>Sentei Kata</em> y la aplicación práctica en el <em>Kumite</em> tradicional.</p><p>Invitamos a todos los alumnos a mantener su preparación constante y regularidad en los entrenamientos de cara a esta importante evaluación.</p>",
            "readTime": "4 min de lectura",
            "featured": true
        },
        {
            "id": "apertura-inscripciones-noviembre-2026",
            "slug": "apertura-inscripciones-noviembre-2026",
            "title": "Planificación y Preparación para el Bloque Infantil (Noviembre 2026)",
            "date": "2026-07-15",
            "dateFormatted": "15 de Julio, 2026",
            "category": "Comunidad",
            "author": "Dojo Samurai Villa Alemana",
            "image": "assets/galeria/adultos.jpg",
            "excerpt": "Avanzan los preparativos para la apertura oficial de las clases infantiles para niños desde los 8 años a partir de Noviembre de 2026.",
            "content": "<p>En el <strong>Dojo Samurai Villa Alemana</strong> continuamos trabajando en el acondicionamiento de nuestras instalaciones y metodologías pedagógicas para dar la bienvenida al nuevo grupo de Karate Infantil.</p><p>A partir de <strong>Noviembre del 2026</strong> abriremos la etapa de inscripciones y clases de prueba para niños desde los 8 años de edad, promoviendo el respeto, la concentración y el desarrollo psicomotriz a través del Karate-Do.</p><p>Agradecemos a todas las familias su preferencia e interés constante en nuestro proyecto marcial.</p>",
            "readTime": "3 min de lectura",
            "featured": false
        }
    ];

    let allNewsArticles = [...defaultNewsData];

    // Helper to render a single news card HTML
    const createNewsCardHTML = (article) => {
        return `
            <article class="news-card" data-id="${article.id}">
                <div class="news-card-img-wrapper">
                    <img src="${article.image}" alt="${article.title}" class="news-card-img" loading="lazy">
                    <span class="news-category-badge">${article.category}</span>
                </div>
                <div class="news-card-body">
                    <div class="news-card-meta">
                        <span class="news-date">📅 ${article.dateFormatted}</span>
                        <span class="news-read-time">⏱️ ${article.readTime}</span>
                    </div>
                    <h3 class="news-card-title">${article.title}</h3>
                    <p class="news-card-excerpt">${article.excerpt}</p>
                    <button class="news-read-more-btn" data-id="${article.id}">Leer noticia completa ➔</button>
                </div>
            </article>
        `;
    };

    // Modal Reader Logic
    const articleModal = document.getElementById('article-reader-modal');
    const closeArticleBtn = document.getElementById('close-article-modal');
    const closeArticleBottomBtn = document.getElementById('modal-close-bottom');
    const shareWaBtn = document.getElementById('modal-share-wa');

    let currentOpenArticle = null;

    const openArticleModal = (articleId) => {
        const article = allNewsArticles.find(a => a.id === articleId || a.slug === articleId);
        if (!article || !articleModal) return;

        currentOpenArticle = article;
        document.getElementById('modal-article-category').textContent = article.category;
        document.getElementById('modal-article-date').textContent = article.dateFormatted;
        document.getElementById('modal-article-title').textContent = article.title;
        document.getElementById('modal-article-author').textContent = article.author;
        document.getElementById('modal-article-time').textContent = article.readTime;
        document.getElementById('modal-article-image').src = article.image;
        document.getElementById('modal-article-body').innerHTML = article.content;

        articleModal.classList.remove('hidden');
        articleModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeArticleModal = () => {
        if (!articleModal) return;
        articleModal.classList.remove('active');
        setTimeout(() => {
            articleModal.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);
    };

    if (closeArticleBtn) closeArticleBtn.addEventListener('click', closeArticleModal);
    if (closeArticleBottomBtn) closeArticleBottomBtn.addEventListener('click', closeArticleModal);
    if (articleModal) {
        articleModal.addEventListener('click', (e) => {
            if (e.target === articleModal) closeArticleModal();
        });
    }

    if (shareWaBtn) {
        shareWaBtn.addEventListener('click', () => {
            if (!currentOpenArticle) return;
            const text = encodeURIComponent(`Noticia Dojo Samurai Villa Alemana:\n*${currentOpenArticle.title}*\n${currentOpenArticle.excerpt}\nLee más en: https://www.samuraijkavalemana.cl/noticias`);
            window.open(`https://wa.me/?text=${text}`, '_blank');
        });
    }

    // Render Homepage 3 Latest Articles
    const homeNewsContainer = document.getElementById('home-news-grid');
    if (homeNewsContainer) {
        const latestThree = allNewsArticles.slice(0, 3);
        homeNewsContainer.innerHTML = latestThree.map(createNewsCardHTML).join('');

        homeNewsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-id]');
            if (btn) {
                const id = btn.getAttribute('data-id');
                openArticleModal(id);
            }
        });
    }

    // Render Full News Listing Page (/noticias)
    const noticiasGridContainer = document.getElementById('noticias-grid-container');
    const newsSearchInput = document.getElementById('news-search-input');
    const newsFilterBtns = document.querySelectorAll('.news-filter-btn');

    if (noticiasGridContainer) {
        let activeCategory = 'all';
        let searchQuery = '';

        const filterAndRenderNoticias = () => {
            let filtered = allNewsArticles.filter(art => {
                const matchesCat = activeCategory === 'all' || art.category === activeCategory;
                const matchesSearch = searchQuery === '' || 
                    art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    art.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesCat && matchesSearch;
            });

            if (filtered.length === 0) {
                noticiasGridContainer.innerHTML = `
                    <div class="news-no-results" style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;">
                        <span class="no-results-icon" style="font-size: 3rem; display: block; margin-bottom: 1rem;">🔎</span>
                        <h3 style="color: #0f172a; margin-bottom: 0.5rem;">No se encontraron noticias</h3>
                        <p style="color: #64748b;">Intenta con otra palabra clave o selecciona otra categoría.</p>
                    </div>
                `;
            } else {
                noticiasGridContainer.innerHTML = filtered.map(createNewsCardHTML).join('');
            }
        };

        filterAndRenderNoticias();

        if (newsSearchInput) {
            newsSearchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.trim();
                filterAndRenderNoticias();
            });
        }

        newsFilterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                newsFilterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeCategory = btn.getAttribute('data-category');
                filterAndRenderNoticias();
            });
        });

        noticiasGridContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-id]');
            if (btn) {
                const id = btn.getAttribute('data-id');
                openArticleModal(id);
            }
        });

        // Check URL parameter for direct article auto-open (e.g. noticias.html?article=campeonato-zona-central-jka-2026)
        const urlParams = new URLSearchParams(window.location.search);
        const articleParam = urlParams.get('article') || urlParams.get('id');
        if (articleParam) {
            setTimeout(() => {
                openArticleModal(articleParam);
            }, 400);
        }
    }

    // Try fetching external JSON data asynchronously to stay updated dynamically
    fetch('data/noticias.json')
        .then(res => {
            if (!res.ok) throw new Error('Noticias JSON offline');
            return res.json();
        })
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                allNewsArticles = data;
                if (homeNewsContainer) {
                    homeNewsContainer.innerHTML = allNewsArticles.slice(0, 3).map(createNewsCardHTML).join('');
                }
                if (noticiasGridContainer) {
                    noticiasGridContainer.innerHTML = allNewsArticles.map(createNewsCardHTML).join('');
                }
            }
        })
        .catch(err => {
            console.log('Using pre-bundled news articles data.');
        });
});
