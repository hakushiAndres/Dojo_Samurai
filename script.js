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

            fetch("https://formsubmit.co/ajax/Dojo.samurai.penablanca@gmail.com", {
                method: "POST",
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    nombre: nameVal,
                    email: emailVal,
                    telefono: phoneVal,
                    mensaje: messageVal
                })
            })
            .then(response => response.json())
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
                }, 5000);
            })
            .catch(error => {
                console.error('Error:', error);
                submitBtn.textContent = originalText;
                validateForm();
                formMessage.textContent = 'Hubo un error al enviar el mensaje. Por favor intenta nuevamente.';
                formMessage.className = 'form-message error';
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
});
