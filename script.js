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

    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links a');

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Close mobile menu when clicking a link
    links.forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }
        });
    });

    // Word counter and form submission handling
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('form-message');
    const messageInput = document.getElementById('message');
    const wordCountSpan = document.getElementById('word-count');

    // Function to calculate word count
    const getWordCount = (str) => {
        const trimmed = str.trim();
        return trimmed ? trimmed.split(/\s+/).length : 0;
    };

    // Live word count listener
    if (messageInput && wordCountSpan) {
        const updateWordCount = () => {
            const words = messageInput.value.trim().split(/\s+/).filter(w => w.length > 0);
            if (words.length > 200) {
                // Limit to 200 words
                const truncated = words.slice(0, 200).join(' ');
                messageInput.value = truncated;
                wordCountSpan.textContent = 200;
                wordCountSpan.classList.add('limit-reached');
            } else {
                wordCountSpan.textContent = words.length;
                if (words.length >= 200) {
                    wordCountSpan.classList.add('limit-reached');
                } else {
                    wordCountSpan.classList.remove('limit-reached');
                }
            }
        };

        messageInput.addEventListener('input', updateWordCount);
        messageInput.addEventListener('keyup', updateWordCount);
    }

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nameVal = document.getElementById('name').value.trim();
            const emailVal = document.getElementById('email').value.trim();
            const phoneVal = document.getElementById('phone').value.trim();
            const messageVal = document.getElementById('message').value.trim();

            // 1. Check all fields filled out
            if (!nameVal || !emailVal || !phoneVal || !messageVal) {
                formMessage.textContent = 'Por favor completa todas las casillas del formulario.';
                formMessage.className = 'form-message error';
                return;
            }

            // 2. Check 200 word limit
            const wordCount = getWordCount(messageVal);
            if (wordCount > 200) {
                formMessage.textContent = 'El mensaje no puede exceder las 200 palabras (actual: ' + wordCount + ').';
                formMessage.className = 'form-message error';
                return;
            }

            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Enviando...';
            btn.disabled = true;

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
                btn.textContent = originalText;
                btn.disabled = false;
                contactForm.reset();
                if (wordCountSpan) wordCountSpan.textContent = '0';
                
                formMessage.textContent = '¡Gracias! Tu mensaje ha sido enviado exitosamente. Nos pondremos en contacto pronto.';
                formMessage.className = 'form-message';
                
                // Hide message after 5 seconds
                setTimeout(() => {
                    formMessage.className = 'form-message hidden';
                }, 5000);
            })
            .catch(error => {
                console.error('Error:', error);
                btn.textContent = originalText;
                btn.disabled = false;
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
