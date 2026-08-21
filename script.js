document.addEventListener('DOMContentLoaded', () => {
    // GA4 Event Tracking Helper (Safe execution check)
    const trackGA4Event = (eventName, params = {}) => {
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, params);
        }
    };

    // Delegated Click Event Listener for [data-track-event] semantic attributes
    document.addEventListener('click', (e) => {
        const trackElem = e.target.closest('[data-track-event]');
        if (!trackElem) return;

        // Do NOT process contact form elements via click delegation
        if (trackElem.tagName.toLowerCase() === 'form' || trackElem.id === 'contactForm') return;

        const eventName = trackElem.getAttribute('data-track-event');
        if (!eventName) return;

        const params = {};
        const intent = trackElem.getAttribute('data-track-intent');
        const placement = trackElem.getAttribute('data-track-placement');
        const network = trackElem.getAttribute('data-track-network');
        const account = trackElem.getAttribute('data-track-account');

        if (intent) params.intent = intent;
        if (placement) params.placement = placement;
        if (network) params.network = network;
        if (account) params.account = account;

        trackGA4Event(eventName, params);
    });

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

    // Hero IntersectionObserver: Manage floating elements while Hero is in viewport
    const heroElem = document.getElementById('hero');
    if (heroElem && 'IntersectionObserver' in window) {
        const heroObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    document.body.classList.add('in-hero-view');
                } else {
                    document.body.classList.remove('in-hero-view');
                }
            });
        }, { threshold: 0.1 });

        heroObserver.observe(heroElem);
    }

    // Mobile menu toggle
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links a');

    if (menuToggle && navLinks) {
        const toggleMenu = (e) => {
            if (e) e.stopPropagation();
            const isActive = menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            if (isActive) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        };

        const closeMenu = () => {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        };

        menuToggle.addEventListener('click', toggleMenu);

        menuToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMenu(e);
            }
        });

        links.forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
                closeMenu();
            }
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
                const isSubmissionSuccessful = data && (data.success === true || data.success === 'true');
                if (!isSubmissionSuccessful) {
                    throw new Error('FormSubmit reported unsuccessful submission');
                }

                // GA4 Macroconversion: Lead confirmed via successful FormSubmit response
                trackGA4Event('generate_lead', {
                    form_name: 'contact',
                    placement: 'contact_section'
                });

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

                // GA4 Diagnostic Event (Not a macroconversion)
                trackGA4Event('form_submit_error', {
                    form_name: 'contact',
                    placement: 'contact_section'
                });

                submitBtn.textContent = originalText;
                validateForm();
                
                // Show fallback message and open WhatsApp automatically as instant backup
                formMessage.textContent = 'Procesando mensaje por WhatsApp... Redirigiendo...';
                formMessage.className = 'form-message';

                setTimeout(() => {
                    // GA4 Intent Event: Form fallback to WhatsApp (Not a confirmed lead)
                    trackGA4Event('click_whatsapp', {
                        intent: 'form_fallback',
                        placement: 'contact_form_fallback'
                    });

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

    // Lightbox & Dynamic Carousel Functionality
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    
    let currentCarouselImages = [];
    let currentImageIndex = 0;

    const openLightboxWithImages = (imagesArray, startIndex = 0) => {
        const lb = document.getElementById('lightbox');
        const lbImg = document.getElementById('lightbox-img');
        if (!lb || !lbImg || !imagesArray || imagesArray.length === 0) return;

        currentCarouselImages = imagesArray;
        currentImageIndex = startIndex < 0 ? 0 : (startIndex >= imagesArray.length ? 0 : startIndex);

        lbImg.src = currentCarouselImages[currentImageIndex];
        lb.style.zIndex = '10005';
        lb.classList.add('active');
    };

    const showCarouselImage = (index) => {
        const lbImg = document.getElementById('lightbox-img');
        if (currentCarouselImages.length === 0 || !lbImg) return;

        if (index < 0) currentImageIndex = currentCarouselImages.length - 1;
        else if (index >= currentCarouselImages.length) currentImageIndex = 0;
        else currentImageIndex = index;
        
        lbImg.src = currentCarouselImages[currentImageIndex];
    };

    const closeLightbox = () => {
        const lb = document.getElementById('lightbox');
        const lbImg = document.getElementById('lightbox-img');
        if (!lb) return;
        lb.classList.remove('active');
        setTimeout(() => {
            if (lbImg) lbImg.src = '';
        }, 300);
    };

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showCarouselImage(currentImageIndex - 1); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showCarouselImage(currentImageIndex + 1); });

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
                closeLightbox();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        const lb = document.getElementById('lightbox');
        if (lb && lb.classList.contains('active')) {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') showCarouselImage(currentImageIndex - 1);
            if (e.key === 'ArrowRight') showCarouselImage(currentImageIndex + 1);
        }
    });

    // Gallery Triggers on Homepage
    const galleryTriggers = document.querySelectorAll('.lightbox-trigger');
    if (galleryTriggers.length > 0) {
        const galleryImageSrcs = Array.from(galleryTriggers).map(img => img.src);
        galleryTriggers.forEach((img, index) => {
            img.addEventListener('click', () => {
                openLightboxWithImages(galleryImageSrcs, index);
            });
        });
    }

    // ==========================================
    // Hybrid News / Blog System Module
    // ==========================================
    const defaultNewsData = [
        {
            "id": "xv-seminario-tecnico-jka-vina-del-mar-2026-shihan-mitsuo-inoue",
            "slug": "xv-seminario-tecnico-jka-vina-del-mar-2026-shihan-mitsuo-inoue",
            "title": "¡Todo listo para el XV Seminario Técnico JKA Viña del Mar 2026 junto a Shihan Mitsuo Inoue!",
            "date": "2026-08-13",
            "dateFormatted": "13 de Agosto, 2026",
            "category": "Eventos",
            "author": "Dojo Samurai Villa Alemana",
            "image": "assets/noticias/Seminario/INOUE_2026.jpg",
            "excerpt": "Confirmada la fecha para el magno evento del Karate JKA con la presencia del maestro Shihan Mitsuo Inoue (8° Dan JKA y Senior Advisor). Exámenes de Dan, Instructor y Juez.",
            "readTime": "3 min de lectura",
            "featured": true,
            "badgeText": "🔥 DESTACADO JKA 2026",
            "content": "<p class=\"news-lead-paragraph\"><strong>Nos llena de orgullo y emoción compartir una gran noticia con toda nuestra comunidad y apasionados del karate: Honbu Dojo Samurai JKA Viña del Mar ya tiene todo preparado para llevar a cabo una de las actividades más importantes de nuestro calendario anual.</strong></p><div class=\"news-highlight-box\" style=\"background: rgba(185,28,28,0.06); border-left: 4px solid #b91c1c; padding: 1.25rem 1.5rem; border-radius: 12px; margin: 1.5rem 0;\"><h4 style=\"margin-top: 0; color: #b91c1c; font-weight: 800; font-size: 1.1rem; margin-bottom: 0.5rem;\">📅 Detalle del Evento Principal</h4><p style=\"margin: 0; color: #0f172a; font-size: 1rem; line-height: 1.6;\">Este próximo <strong>sábado 12 y domingo 13 de septiembre de 2026</strong>, se llevará a cabo el <strong>XV Seminario Técnico JKA Viña del Mar</strong>, un encuentro imperdible que contará con la distinguida presencia del maestro <strong>Shihan Mitsuo Inoue (8° Dan JKA y Senior Advisor de la Japan Karate Association)</strong>.</p></div><p>El seminario se realizará en las instalaciones del <strong>Complejo Deportivo de Nueva Aurora</strong> (ubicado en <em>Av. 21 de Mayo 255, Viña del Mar</em>), donde practicantes de distintos niveles podrán entrenar, perfeccionar su técnica y compartir junto a un maestro de trayectoria internacional.</p><div class=\"news-info-card\" style=\"background: #f8fafc; border: 1px solid #e2e8f0; padding: 1.25rem 1.5rem; border-radius: 14px; margin: 1.5rem 0;\"><h4 style=\"margin-top: 0; color: #0f172a; font-weight: 800; font-size: 1.05rem; margin-bottom: 0.5rem;\">📜 Exámenes y Certificaciones Oficiales</h4><p style=\"margin: 0; color: #475569; font-size: 0.96rem; line-height: 1.6;\">Además, en la víspera del seminario —el día <strong>viernes 11 de septiembre</strong>— se llevarán a cabo las examinaciones para <strong>Dan, Instructor y Juez JKA</strong> en las dependencias de <strong>Samurai Honbu Dojo Viña del Mar</strong>.</p></div><p>Mantente atento a nuestro sitio web y a nuestras redes sociales, donde pronto estaremos compartiendo más detalles sobre los horarios específicos, costos e inscripciones. ¡Prepara tu dogi y acompáñanos a vivir un fin de semana lleno de karate y tradición! <em>Ossu.</em></p><div class=\"news-gallery-grid\" style=\"margin-top: 1.5rem;\"><img src=\"assets/noticias/Seminario/INOUE_2026.jpg\" alt=\"XV Seminario Técnico JKA Viña del Mar 2026 Shihan Mitsuo Inoue 8° Dan\" style=\"width:100%; border-radius:14px; max-height: 480px; object-fit: cover;\"></div>"
        },
        {
            "id": "50-aniversario-dojo-samurai-jka-vina-del-mar",
            "slug": "50-aniversario-dojo-samurai-jka-vina-del-mar",
            "title": "50 Años de Dojo Samurai JKA Viña del Mar: Clase Especial y Convivencia con Sensei Raúl Puchi",
            "date": "2026-08-08",
            "dateFormatted": "8 de Agosto, 2026",
            "category": "Aniversario",
            "author": "Dojo Samurai Villa Alemana",
            "image": "assets/noticias/Aniversario/IMG-20260810-WA0001.webp",
            "excerpt": "Celebración histórica de medio siglo del Honbu Dojo Samurai JKA Viña del Mar con una multitudinaria clase máster impartida por Sensei Raúl Puchi (6to Dan JKA) y una emotiva jornada de camaradería.",
            "readTime": "2 min de lectura",
            "featured": true,
            "badgeText": "🏆 DESTACADO DEL MES",
            "content": "<p class=\"news-lead-paragraph\"><strong>¡Celebración histórica de 50 Años de Trayectoria!</strong> El sábado 8 de agosto se realizó una clase especial con motivo de las bodas de oro del <strong>Dojo Samurai JKA Viña del Mar</strong>.</p><div class=\"news-highlight-box\" style=\"background: rgba(15,23,42,0.04); border-left: 4px solid #0f172a; padding: 1.25rem 1.5rem; border-radius: 12px; margin: 1.5rem 0;\"><h4 style=\"margin-top: 0; color: #0f172a; font-weight: 800; font-size: 1.05rem; margin-bottom: 0.5rem;\">🥋 Dirección de la Clase Especial</h4><p style=\"margin: 0; color: #334155; font-size: 0.98rem; line-height: 1.6;\">La clase estuvo magistralmente dirigida por <strong>Sensei Raúl Puchi (6to Dan JKA)</strong>, cuya presencia transmitió profunda energía, técnica y motivación a todos los alumnos asistentes. Posterior a la práctica, se compartió una inolvidable convivencia fraternal.</p></div><p>En este mes de aniversario queremos expresar nuestros más sinceros deseos y felicitaciones para el <strong>Honbu Dojo</strong> y para Sensei Raúl Puchi por sus 50 años de trayectoria ininterrumpida y su inquebrantable compromiso con la enseñanza del Karate Do Shotokan JKA en Chile. <em>Ossu.</em></p><div class=\"news-gallery-grid\" style=\"display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1.5rem;\"><img src=\"assets/noticias/Aniversario/IMG-20260810-WA0001.webp\" alt=\"50 Años Dojo Samurai JKA\" style=\"width:100%; border-radius:12px; height: 180px; object-fit: cover;\"><img src=\"assets/noticias/Aniversario/IMG-20260810-WA0002.webp\" alt=\"Clase Especial Sensei Raúl Puchi\" style=\"width:100%; border-radius:12px; height: 180px; object-fit: cover;\"><img src=\"assets/noticias/Aniversario/IMG-20260810-WA0005.webp\" alt=\"Convivencia 50 Aniversario Dojo Samurai\" style=\"width:100%; border-radius:12px; height: 180px; object-fit: cover;\"><img src=\"assets/noticias/Aniversario/IMG-20260810-WA0006.webp\" alt=\"Alumnos en Clase Aniversario\" style=\"width:100%; border-radius:12px; height: 180px; object-fit: cover;\"><img src=\"assets/noticias/Aniversario/IMG-20260810-WA0007.webp\" alt=\"Celebración Honbu Dojo Samurai\" style=\"width:100%; border-radius:12px; height: 180px; object-fit: cover;\"><img src=\"assets/noticias/Aniversario/IMG-20260810-WA0008.webp\" alt=\"Sensei Raúl Puchi 6to Dan JKA\" style=\"width:100%; border-radius:12px; height: 180px; object-fit: cover;\"></div>"
        }
    ];
    let allNewsArticles = [...defaultNewsData];

    // Helper to render modern news cards HTML (Featured vs Standard)
    const createNewsCardHTML = (article, index = 0) => {
        const isFeatured = article.featured === true;
        const isGoldTheme = article.category === 'Aniversario' || article.id.includes('aniversario');
        const themeClass = isGoldTheme ? 'gold-theme' : '';
        const badgeStripText = article.badgeText || (isGoldTheme ? '🏆 DESTACADO DEL MES' : '🔥 NOTICIA DESTACADA');
        const badgeTag = isGoldTheme ? '🏆' : '📜';
        const articleSlug = article.slug || article.id;
        const articleUrl = `/noticias/${articleSlug}/`;

        if (isFeatured) {
            return `
                <article class="news-card news-hero-card ${themeClass}" data-id="${article.id}" style="grid-column: 1 / -1;">
                    <div class="news-hero-badge-strip">
                        <span>${badgeStripText}</span>
                        <span>JKA CHILE 2026</span>
                    </div>
                    <div class="news-hero-grid">
                        <div class="news-hero-img-wrapper">
                            <img src="${article.image}" alt="${article.title}" class="news-hero-img" loading="lazy">
                            <span class="news-category-badge badge-red">${badgeTag} ${article.category}</span>
                        </div>
                        <div class="news-hero-body">
                            <div class="news-card-meta">
                                <span class="news-date">📅 ${article.dateFormatted}</span>
                                <span class="news-read-time">⏱️ ${article.readTime}</span>
                            </div>
                            <h3 class="news-hero-title">${article.title}</h3>
                            <p class="news-hero-excerpt">${article.excerpt}</p>
                            <div class="news-card-footer-action">
                                <a href="${articleUrl}" class="btn btn-primary news-read-more-btn">
                                    Leer noticia completa ➔
                                </a>
                            </div>
                        </div>
                    </div>
                </article>
            `;
        }

        return `
            <article class="news-card modern-card" data-id="${article.id}">
                <div class="news-card-img-wrapper">
                    <img src="${article.image}" alt="${article.title}" class="news-card-img" loading="lazy">
                    <span class="news-category-badge">🏆 ${article.category}</span>
                </div>
                <div class="news-card-body">
                    <div class="news-card-meta">
                        <span class="news-date">📅 ${article.dateFormatted}</span>
                        <span class="news-read-time">⏱️ ${article.readTime}</span>
                    </div>
                    <h3 class="news-card-title">${article.title}</h3>
                    <p class="news-card-excerpt">${article.excerpt}</p>
                    <a href="${articleUrl}" class="btn btn-primary news-read-more-btn">Leer noticia completa ➔</a>
                </div>
            </article>
        `;
    };

    // Modal Reader Logic
    let currentOpenArticle = null;

    const openArticleModal = (articleId) => {
        let article = allNewsArticles.find(a => a.id === articleId || a.slug === articleId);
        if (!article) {
            article = defaultNewsData.find(a => a.id === articleId || a.slug === articleId) || defaultNewsData[0];
        }
        if (!article) return;

        const modal = document.getElementById('article-reader-modal');
        if (!modal) {
            window.location.href = `noticias.html?article=${articleId}`;
            return;
        }

        currentOpenArticle = article;
        const catEl = document.getElementById('modal-article-category');
        const dateEl = document.getElementById('modal-article-date');
        const titleEl = document.getElementById('modal-article-title');
        const authorEl = document.getElementById('modal-article-author');
        const timeEl = document.getElementById('modal-article-time');
        const imgEl = document.getElementById('modal-article-image');
        const bodyEl = document.getElementById('modal-article-body');

        if (catEl) catEl.textContent = article.category;
        if (dateEl) dateEl.textContent = article.dateFormatted;
        if (titleEl) titleEl.textContent = article.title;
        if (authorEl) authorEl.textContent = article.author;
        if (timeEl) timeEl.textContent = article.readTime;
        if (imgEl) imgEl.src = article.image;
        if (bodyEl) bodyEl.innerHTML = article.content;

        modal.classList.remove('hidden');
        modal.classList.add('active');
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        modal.style.pointerEvents = 'auto';
        document.body.style.overflow = 'hidden';
    };

    window.openArticleModal = openArticleModal;

    const closeArticleModal = () => {
        const modal = document.getElementById('article-reader-modal');
        if (!modal) return;
        modal.classList.remove('active');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    };

    document.addEventListener('click', (e) => {
        const modal = document.getElementById('article-reader-modal');

        // WhatsApp Share Button Click Delegate
        const waShareBtn = e.target.closest('#modal-share-wa');
        if (waShareBtn) {
            e.preventDefault();
            e.stopPropagation();

            const title = document.getElementById('modal-article-title')?.textContent || "50 Años de Dojo Samurai JKA Viña del Mar";
            const currentUrl = window.location.href;
            const messageText = `🥋 *${title}*\n\nLee la noticia completa en Dojo Samurai JKA Villa Alemana:\n${currentUrl}`;

            const encodedText = encodeURIComponent(messageText);
            
            // Universal WhatsApp URL that works on Desktop & Mobile without popup blocking
            const waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;

            const tempLink = document.createElement('a');
            tempLink.href = waUrl;
            tempLink.target = '_blank';
            tempLink.rel = 'noopener noreferrer';
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
            return;
        }

        // Global News Card / Read More Button Click Delegate
        const isAnchorBtn = e.target.closest('a.news-read-more-btn, a[href^="/noticias/"]');
        if (isAnchorBtn) {
            // Allow natural browser navigation to static article page
            return;
        }

        const newsCardOrBtn = e.target.closest('button[data-id]');
        if (newsCardOrBtn && (!modal || !modal.classList.contains('active'))) {
            const articleId = newsCardOrBtn.getAttribute('data-id');
            if (articleId && articleId !== 'null' && articleId !== '') {
                e.preventDefault();
                e.stopPropagation();
                openArticleModal(articleId);
                return;
            }
        }
        
        // Article Modal Image Click -> Open Fullscreen Carousel
        if (modal && modal.classList.contains('active')) {
            const imgTarget = e.target.closest('#modal-article-image, .article-modal-body img');
            if (imgTarget) {
                e.stopPropagation();
                const modalImages = Array.from(modal.querySelectorAll('#modal-article-image, .article-modal-body img'))
                    .map(img => img.src)
                    .filter(src => src && src.length > 0 && !src.includes('jka_logo'));
                
                const clickedIndex = modalImages.indexOf(imgTarget.src);
                openLightboxWithImages(modalImages, clickedIndex !== -1 ? clickedIndex : 0);
                return;
            }

            if (e.target.id === 'close-article-modal' || e.target.id === 'modal-close-bottom' || e.target.closest('#close-article-modal') || e.target.closest('#modal-close-bottom')) {
                closeArticleModal();
            } else if (e.target === modal) {
                closeArticleModal();
            }
        }
    });

    // Render Homepage 3 Latest Articles
    const homeNewsContainer = document.getElementById('home-news-grid');
    const renderHomeNews = () => {
        if (!homeNewsContainer) return;
        if (allNewsArticles.length === 0) {
            homeNewsContainer.innerHTML = `
                <div class="news-no-results" style="grid-column: 1/-1; text-align: center; padding: 3rem 1.5rem; background: #f8fafc; border-radius: 16px; border: 1px dashed #cbd5e1;">
                    <span class="no-results-icon" style="font-size: 2.5rem; display: block; margin-bottom: 0.75rem;">📰</span>
                    <h3 style="color: #0f172a; margin-bottom: 0.5rem; font-size: 1.2rem; font-weight: 800;">Próximamente más novedades</h3>
                    <p style="color: #64748b; font-size: 0.95rem; margin: 0;">Pronto publicaremos los nuevos comunicados, fechas de exámenes y resultados de competencias.</p>
                </div>
            `;
        } else {
            const latestThree = allNewsArticles.slice(0, 3);
            homeNewsContainer.innerHTML = latestThree.map((art, idx) => createNewsCardHTML(art, idx)).join('');
        }
    };

    if (homeNewsContainer) {
        renderHomeNews();
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

    const filterAndRenderNoticias = () => {
        if (!noticiasGridContainer) return;
        let filtered = allNewsArticles.filter(art => {
            const matchesCat = activeCategory === 'all' || art.category === activeCategory;
            const matchesSearch = searchQuery === '' || 
                art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                art.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCat && matchesSearch;
        });

        if (filtered.length === 0) {
            noticiasGridContainer.innerHTML = `
                <div class="news-no-results" style="grid-column: 1/-1; text-align: center; padding: 4rem 1.5rem; background: #ffffff; border-radius: 16px; border: 1px dashed #cbd5e1;">
                    <span class="no-results-icon" style="font-size: 3rem; display: block; margin-bottom: 1rem;">📰</span>
                    <h3 style="color: #0f172a; margin-bottom: 0.5rem; font-weight: 800;">No hay noticias publicadas aún</h3>
                    <p style="color: #64748b;">Pronto compartiremos los nuevos comunicados y novedades oficiales de Dojo Samurai Villa Alemana.</p>
                </div>
            `;
        } else {
            noticiasGridContainer.innerHTML = filtered.map((art, idx) => createNewsCardHTML(art, idx)).join('');
        }
    };

    let activeCategory = 'all';
    let searchQuery = '';

    if (noticiasGridContainer) {
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
            if (e.target.closest('a')) {
                // Allow natural anchor link navigation
                return;
            }
            const btn = e.target.closest('button[data-id]');
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

    // Try fetching external JSON data asynchronously with cache buster
    fetch('data/noticias.json?v=' + Date.now())
        .then(res => {
            if (!res.ok) throw new Error('Noticias JSON offline');
            return res.json();
        })
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                allNewsArticles = data;
                renderHomeNews();
                if (noticiasGridContainer) {
                    filterAndRenderNoticias();
                }
            }
        })
        .catch(err => {
            console.log('Using pre-bundled news articles data.');
        });
});
