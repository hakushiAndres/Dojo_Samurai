document.addEventListener('DOMContentLoaded', () => {
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

    // Back to Top Button Functionality
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

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

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!validateForm()) {
                formMessage.textContent = 'Por favor completa todos los campos correctamente.';
                formMessage.className = 'form-message error';
                return;
            }

            const nameVal = nameInput.value.trim();
            const emailVal = emailInput.value.trim();
            const phoneVal = phoneInput.value.trim();
            const messageVal = messageInput.value.trim();

            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Enviando...';
            submitBtn.setAttribute('disabled', 'true');

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
