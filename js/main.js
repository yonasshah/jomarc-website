// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            
            // Animate toggle button
            const spans = mobileToggle.querySelectorAll('span');
            if (navLinks.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });

        // Close menu when clicking a link
        const links = navLinks.querySelectorAll('.nav-link');
        links.forEach(link => {
            link.addEventListener('click', function() {
                navLinks.classList.remove('active');
                const spans = mobileToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });
    }

    // Active page highlighting
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinksAll = document.querySelectorAll('.nav-link');
    
    navLinksAll.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Hero Carousel
let currentSlide = 0;
let carouselInterval;

function initCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
    
    if (slides.length === 0) return;
    
    function showSlide(n) {
        // Remove active class from all slides and indicators
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        // Wrap around if needed
        if (n >= slides.length) {
            currentSlide = 0;
        } else if (n < 0) {
            currentSlide = slides.length - 1;
        } else {
            currentSlide = n;
        }
        
        // Add active class to current slide and indicator
        if (slides[currentSlide]) {
            slides[currentSlide].classList.add('active');
        }
        if (indicators[currentSlide]) {
            indicators[currentSlide].classList.add('active');
        }
    }
    
    window.moveSlide = function(direction) {
        showSlide(currentSlide + direction);
        resetCarouselInterval();
    };
    
    window.goToSlide = function(n) {
        showSlide(n);
        resetCarouselInterval();
    };
    
    function resetCarouselInterval() {
        clearInterval(carouselInterval);
        startCarousel();
    }
    
    function startCarousel() {
        // Auto-advance every 5 seconds
        carouselInterval = setInterval(() => {
            showSlide(currentSlide + 1);
        }, 5000);
    }
    
    startCarousel();
}

// Initialize carousel when DOM is ready
document.addEventListener('DOMContentLoaded', initCarousel);

// Scroll to top functionality (if needed)
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Add loading state helper
function showLoading(element, message = 'Loading...') {
    if (element) {
        element.innerHTML = `<div class="loading-message">${message}</div>`;
    }
}

// Add error state helper
function showError(element, message = 'Something went wrong. Please try again.') {
    if (element) {
        element.innerHTML = `<div class="error-message">${message}</div>`;
    }
}