// ===== IMAGE LIGHTBOX FOR EQUIPMENT DETAIL PAGES =====

class ImageLightbox {
    constructor() {
        this.currentIndex = 0;
        this.images = [];
        this.overlay = null;
        this.isInitialized = false;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        // Create lightbox overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'lightbox-overlay';
        this.overlay.innerHTML = `
            <div class="lightbox-content">
                <img src="" alt="" id="lightboxImage">
                <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
                <button class="lightbox-prev" aria-label="Previous image">‹</button>
                <button class="lightbox-next" aria-label="Next image">›</button>
                <div class="lightbox-counter"><span id="lightboxCounter"></span></div>
            </div>
        `;
        document.body.appendChild(this.overlay);

        // Add event listeners
        this.overlay.querySelector('.lightbox-close').addEventListener('click', () => this.close());
        this.overlay.querySelector('.lightbox-prev').addEventListener('click', () => this.prev());
        this.overlay.querySelector('.lightbox-next').addEventListener('click', () => this.next());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.overlay.classList.contains('active')) return;
            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'ArrowRight') this.next();
        });

        // Touch support for mobile swipe
        let touchStartX = 0;
        let touchEndX = 0;
        this.overlay.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        this.overlay.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 50) this.next();
            if (touchEndX - touchStartX > 50) this.prev();
        });

        this.isInitialized = true;
        console.log('Lightbox overlay created');
    }

    attachToImages() {
        const mainImage = document.getElementById('mainImage');
        if (mainImage) {
            const img = mainImage.querySelector('img');
            if (img) {
                // Remove any existing click handlers
                const newMainImage = mainImage.cloneNode(true);
                mainImage.parentNode.replaceChild(newMainImage, mainImage);
                
                newMainImage.style.cursor = 'zoom-in';
                newMainImage.addEventListener('click', () => {
                    this.collectImages();
                    this.open(0);
                });
                console.log('✓ Lightbox attached to main image');
            }
        }

        const thumbnails = document.querySelectorAll('.thumbnail');
        if (thumbnails.length > 0) {
            thumbnails.forEach((thumb, index) => {
                thumb.style.cursor = 'zoom-in';
                // Remove any existing click handlers
                const newThumb = thumb.cloneNode(true);
                thumb.parentNode.replaceChild(newThumb, thumb);
                
                newThumb.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.collectImages();
                    // Add 1 to index because main image is always first
                    this.open(index + 1);
                });
            });
            console.log(`✓ Lightbox attached to ${thumbnails.length} thumbnails`);
        }
    }

    collectImages() {
        this.images = [];
        const mainImg = document.querySelector('#mainImage img');
        if (mainImg && mainImg.src) {
            this.images.push(mainImg.src);
        }
        const thumbnails = document.querySelectorAll('.thumbnail img');
        thumbnails.forEach(img => {
            if (img.src) {
                this.images.push(img.src);
            }
        });
        console.log(`Collected ${this.images.length} images for lightbox`);
    }

    open(index) {
        if (this.images.length === 0) {
            console.warn('No images to display in lightbox');
            return;
        }
        this.currentIndex = index;
        this.updateImage();
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.updateImage();
    }

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.updateImage();
    }

    updateImage() {
        const img = document.getElementById('lightboxImage');
        const counter = document.getElementById('lightboxCounter');
        img.src = this.images[this.currentIndex];
        counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;

        // Hide prev/next buttons if only one image
        const prevBtn = this.overlay.querySelector('.lightbox-prev');
        const nextBtn = this.overlay.querySelector('.lightbox-next');
        if (this.images.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
        }
    }
}

// Create global lightbox instance
let lightboxInstance = null;

// Initialize lightbox - can be called multiple times safely
window.initLightbox = function() {
    if (!lightboxInstance) {
        lightboxInstance = new ImageLightbox();
    }
    // Always try to attach to images when called
    setTimeout(() => {
        if (lightboxInstance) {
            lightboxInstance.attachToImages();
        }
    }, 100);
};

// Auto-initialize on equipment detail pages
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        if (document.querySelector('.detail-gallery') || document.querySelector('#equipmentDetail')) {
            window.initLightbox();
        }
    });
} else {
    // DOM already loaded
    if (document.querySelector('.detail-gallery') || document.querySelector('#equipmentDetail')) {
        window.initLightbox();
    }
}

// Export for use in other scripts
window.ImageLightbox = ImageLightbox;