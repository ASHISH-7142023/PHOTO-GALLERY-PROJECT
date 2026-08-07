/**
   L&T Photo Gallery - Lightbox & Nav Manager
   Designed by: Antigravity AI
*/

document.addEventListener('DOMContentLoaded', () => {
    setupActiveNavigation();
    setupLightbox();
});

/**
 * Marks the active page navigation link based on current URL path
 */
function setupActiveNavigation() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    
    // Primary navigation active state
    const primaryNavLinks = document.querySelectorAll('#header-items a');
    primaryNavLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        let isPrimaryActive = (linkPath === currentPath);
        
        // Map sub-awards pages to Awards folder
        if (linkPath === 'awards.html' && 
            ['lsa.html', '25yrs.html', '30yrs.html', '35yrs.html'].includes(currentPath)) {
            isPrimaryActive = true;
        }
        
        if (isPrimaryActive) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Sub-navigation active state
    const subNavLinks = document.querySelectorAll('.sub-nav a');
    subNavLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * Dynamic Lightbox implementation for full screen image viewing
 */
function setupLightbox() {
    const galleryContainer = document.querySelector('.img-container');
    if (!galleryContainer) return;

    let visibleImages = [];
    let currentIndex = 0;

    // Create lightbox HTML structure dynamically
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.id = 'gallery-lightbox';
    lightbox.innerHTML = `
        <div class="lightbox-content">
            <button class="lightbox-btn lightbox-close" aria-label="Close lightbox">&times;</button>
            <button class="lightbox-btn lightbox-prev" aria-label="Previous image">&#10094;</button>
            <img class="lightbox-img" src="" alt="Gallery Image">
            <button class="lightbox-btn lightbox-next" aria-label="Next image">&#10095;</button>
        </div>
    `;
    document.body.appendChild(lightbox);

    const lightboxImg = lightbox.querySelector('.lightbox-img');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');

    // Use event delegation to handle clicks on non-hidden image cards
    galleryContainer.addEventListener('click', (e) => {
        const link = e.target.closest('a[href$=".jpg"], a[href$=".webp"], a[href$=".png"], a[href$=".jpeg"]');
        if (!link || link.classList.contains('hidden-card')) return;
        
        e.preventDefault();
        
        // Query visible images at the time of click
        visibleImages = Array.from(galleryContainer.querySelectorAll('a:not(.hidden-card)'));
        currentIndex = visibleImages.indexOf(link);
        
        if (currentIndex !== -1) {
            showImage(currentIndex);
            openLightbox();
        }
    });

    function openLightbox() {
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        document.addEventListener('keydown', handleKeyPress);
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        document.removeEventListener('keydown', handleKeyPress);
    }

    function showImage(index) {
        if (index < 0 || index >= visibleImages.length) return;
        const currentLink = visibleImages[index];
        const imgUrl = currentLink.getAttribute('href');
        const imgAlt = currentLink.querySelector('img')?.getAttribute('alt') || 'L&T Gallery Image';
        
        // Preload image for smoother display
        const tempImg = new Image();
        tempImg.onload = () => {
            lightboxImg.src = imgUrl;
            lightboxImg.alt = imgAlt;
        };
        tempImg.src = imgUrl;
    }

    function showNext() {
        if (visibleImages.length <= 1) return;
        currentIndex = (currentIndex + 1) % visibleImages.length;
        showImage(currentIndex);
    }

    function showPrev() {
        if (visibleImages.length <= 1) return;
        currentIndex = (currentIndex - 1 + visibleImages.length) % visibleImages.length;
        showImage(currentIndex);
    }

    // Event listeners
    closeBtn.addEventListener('click', closeLightbox);
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showNext();
    });
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showPrev();
    });

    // Close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
            closeLightbox();
        }
    });

    // Keyboard controls
    function handleKeyPress(e) {
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowRight') {
            showNext();
        } else if (e.key === 'ArrowLeft') {
            showPrev();
        }
    }
}
