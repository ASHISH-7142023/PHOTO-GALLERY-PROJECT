/**
   L&T Photo Gallery - Lightbox, Toolbar & Navigation Manager
   Designed by: Antigravity AI
 */

// Safe localStorage wrapper to prevent crashes when pages are opened via file:// protocol
const safeStorage = {
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    },
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {}
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Pre-apply theme from localStorage to avoid layout flashes
    const isLightMode = safeStorage.getItem('gallery-theme') === 'light';
    if (isLightMode) {
        document.body.classList.add('light-mode');
    }

    setupActiveNavigation();
    setupToolbar();
    setupLightbox();
    applyStaggeredAnimations();
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
 * Injects and manages the premium control panel toolbar (Search, Filters, Theme, Grid Switcher)
 */
function setupToolbar() {
    const galleryContainer = document.querySelector('.img-container');
    if (!galleryContainer) return;

    // Create toolbar container
    const toolbar = document.createElement('div');
    toolbar.className = 'gallery-toolbar';

    // Toolbar actions row (Search & Buttons)
    const actionsRow = document.createElement('div');
    actionsRow.className = 'toolbar-actions';

    // Search input
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'search-wrapper';
    searchWrapper.innerHTML = `
        <input type="text" class="search-input" placeholder="Search photos by title or details...">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <button class="clear-search-btn" title="Clear search">&times;</button>
    `;
    actionsRow.appendChild(searchWrapper);

    // Layout and Theme buttons
    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.className = 'toolbar-buttons';

    // Layout toggle button
    const layoutBtn = document.createElement('button');
    layoutBtn.className = 'toolbar-btn layout-toggle-btn';
    const isMasonry = safeStorage.getItem('gallery-layout') === 'masonry';
    if (isMasonry) {
        galleryContainer.classList.add('masonry-layout');
        layoutBtn.classList.add('active');
        layoutBtn.innerHTML = `<span class="layout-icon">田</span> <span class="layout-label">Grid View</span>`;
    } else {
        layoutBtn.innerHTML = `<span class="layout-icon">▤</span> <span class="layout-label">Masonry</span>`;
    }

    layoutBtn.addEventListener('click', () => {
        const currentlyMasonry = galleryContainer.classList.contains('masonry-layout');
        if (currentlyMasonry) {
            galleryContainer.classList.remove('masonry-layout');
            layoutBtn.classList.remove('active');
            layoutBtn.innerHTML = `<span class="layout-icon">▤</span> <span class="layout-label">Masonry</span>`;
            safeStorage.setItem('gallery-layout', 'grid');
        } else {
            galleryContainer.classList.add('masonry-layout');
            layoutBtn.classList.add('active');
            layoutBtn.innerHTML = `<span class="layout-icon">田</span> <span class="layout-label">Grid View</span>`;
            safeStorage.setItem('gallery-layout', 'masonry');
        }
        applyStaggeredAnimations();
    });
    buttonsWrapper.appendChild(layoutBtn);

    // Theme toggle button
    const themeBtn = document.createElement('button');
    themeBtn.className = 'toolbar-btn theme-toggle-btn';
    const isLightMode = safeStorage.getItem('gallery-theme') === 'light';
    if (isLightMode) {
        themeBtn.innerHTML = `<span class="theme-icon">🌙</span> <span class="theme-label">Dark Mode</span>`;
    } else {
        themeBtn.innerHTML = `<span class="theme-icon">☀️</span> <span class="theme-label">Light Mode</span>`;
    }

    themeBtn.addEventListener('click', () => {
        const currentlyLight = document.body.classList.contains('light-mode');
        if (currentlyLight) {
            document.body.classList.remove('light-mode');
            themeBtn.innerHTML = `<span class="theme-icon">☀️</span> <span class="theme-label">Light Mode</span>`;
            safeStorage.setItem('gallery-theme', 'dark');
        } else {
            document.body.classList.add('light-mode');
            themeBtn.innerHTML = `<span class="theme-icon">🌙</span> <span class="theme-label">Dark Mode</span>`;
            safeStorage.setItem('gallery-theme', 'light');
        }
    });
    buttonsWrapper.appendChild(themeBtn);
    actionsRow.appendChild(buttonsWrapper);
    toolbar.appendChild(actionsRow);

    // Filter pills row
    const pillsRow = document.createElement('div');
    pillsRow.className = 'filter-pills';
    toolbar.appendChild(pillsRow);

    // Insert toolbar above the image container
    galleryContainer.parentNode.insertBefore(toolbar, galleryContainer);

    // Setup filter tags and search logic
    setupFilterSearchLogic(searchWrapper, pillsRow);
}

/**
 * Extracts distinct tags based on the image properties of the current page
 */
function getPageTags() {
    const cards = document.querySelectorAll('.img-container a');
    const tagsSet = new Set(['All']);
    
    cards.forEach(card => {
        const img = card.querySelector('img');
        if (!img) return;
        const alt = (img.getAttribute('alt') || '').toLowerCase();
        
        // General categories
        if (alt.includes('birthday') || alt.includes('bday')) tagsSet.add('Birthdays');
        if (alt.includes('award') || alt.includes('lsa') || alt.includes('service') || alt.includes('yrs') || alt.includes('years')) tagsSet.add('Awards');
        if (alt.includes('retirement')) tagsSet.add('Retirement');
        if (alt.includes('event')) tagsSet.add('Events');
        if (alt.includes('function')) tagsSet.add('Functions');
        if (alt.includes('programme')) tagsSet.add('Programmes');
        if (alt.includes('machine') || alt.includes('crane') || alt.includes('hauler') || alt.includes('excavator') || alt.includes('truck') || alt.includes('plant') || alt.includes('compactor') || alt.includes('krane')) tagsSet.add('Machines');
        if (alt.includes('office') || alt.includes('premises')) tagsSet.add('Premises');
        
        // Detail sub-tags
        if (alt.includes('cake')) tagsSet.add('Cake');
        if (alt.includes('team') || alt.includes('celebration')) tagsSet.add('Celebration');
        if (alt.includes('gift')) tagsSet.add('Gifts');
        if (alt.includes('balloon')) tagsSet.add('Balloons');
        if (alt.includes('crystal')) tagsSet.add('Crystal');
        if (alt.includes('badge') || alt.includes('tag')) tagsSet.add('Tags');
    });
    
    if (tagsSet.size <= 2) return [];
    return Array.from(tagsSet);
}

/**
 * Implements combined search field and category pill tag filtration logic
 */
function setupFilterSearchLogic(searchWrapper, pillsRow) {
    const searchInput = searchWrapper.querySelector('.search-input');
    const clearBtn = searchWrapper.querySelector('.clear-search-btn');
    const cards = document.querySelectorAll('.img-container a');
    
    let activeTag = 'All';
    let searchQuery = '';

    // Generate filter pills
    const tags = getPageTags();
    if (tags.length > 0) {
        tags.forEach(tag => {
            const pill = document.createElement('button');
            pill.className = `filter-pill ${tag === 'All' ? 'active' : ''}`;
            pill.textContent = tag;
            pill.addEventListener('click', () => {
                pillsRow.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                activeTag = tag;
                filterGallery();
            });
            pillsRow.appendChild(pill);
        });
    } else {
        pillsRow.style.display = 'none';
    }

    // Search events
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        if (searchQuery.length > 0) {
            clearBtn.classList.add('active');
        } else {
            clearBtn.classList.remove('active');
        }
        filterGallery();
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearBtn.classList.remove('active');
        searchInput.focus();
        filterGallery();
    });

    function filterGallery() {
        cards.forEach(card => {
            const img = card.querySelector('img');
            const alt = img ? (img.getAttribute('alt') || '').toLowerCase() : '';
            const href = card.getAttribute('href').toLowerCase();

            // Tag check
            let matchesTag = (activeTag === 'All');
            if (!matchesTag) {
                if (activeTag === 'Birthdays') matchesTag = alt.includes('birthday') || alt.includes('bday');
                else if (activeTag === 'Awards') matchesTag = alt.includes('award') || alt.includes('lsa') || alt.includes('service') || alt.includes('yrs') || alt.includes('years');
                else if (activeTag === 'Retirement') matchesTag = alt.includes('retirement');
                else if (activeTag === 'Events') matchesTag = alt.includes('event');
                else if (activeTag === 'Functions') matchesTag = alt.includes('function');
                else if (activeTag === 'Programmes') matchesTag = alt.includes('programme');
                else if (activeTag === 'Machines') matchesTag = alt.includes('machine') || alt.includes('crane') || alt.includes('hauler') || alt.includes('excavator') || alt.includes('truck') || alt.includes('plant') || alt.includes('compactor') || alt.includes('krane');
                else if (activeTag === 'Premises') matchesTag = alt.includes('office') || alt.includes('premises');
                else if (activeTag === 'Cake') matchesTag = alt.includes('cake');
                else if (activeTag === 'Celebration') matchesTag = alt.includes('celebration') || alt.includes('team');
                else if (activeTag === 'Gifts') matchesTag = alt.includes('gift');
                else if (activeTag === 'Balloons') matchesTag = alt.includes('balloon');
                else if (activeTag === 'Crystal') matchesTag = alt.includes('crystal');
                else if (activeTag === 'Tags') matchesTag = alt.includes('badge') || alt.includes('tag');
            }

            // Search text check
            const matchesSearch = alt.includes(searchQuery) || href.includes(searchQuery);

            if (matchesTag && matchesSearch) {
                card.classList.remove('hidden-card');
            } else {
                card.classList.add('hidden-card');
            }
        });

        applyStaggeredAnimations();
        handleNoResults();
    }
}

/**
 * Renders or removes the no search results matched indicator
 */
function handleNoResults() {
    const galleryContainer = document.querySelector('.img-container');
    if (!galleryContainer) return;
    
    const noResultsEl = galleryContainer.querySelector('.no-results');
    const visibleCount = galleryContainer.querySelectorAll('a:not(.hidden-card)').length;
    
    if (visibleCount === 0) {
        if (!noResultsEl) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.innerHTML = `
                <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
                <h3>No images match your search</h3>
                <p>Try clearing your search query or selecting a different tag filter.</p>
            `;
            galleryContainer.appendChild(noResults);
        }
    } else {
        if (noResultsEl) noResultsEl.remove();
    }
}

/**
 * Plays animation trigger transitions sequentially across cards
 */
function applyStaggeredAnimations() {
    const cards = document.querySelectorAll('.img-container a:not(.hidden-card)');
    cards.forEach((card, index) => {
        card.style.animation = 'none';
        void card.offsetHeight; // Force reflow trigger
        card.style.animation = `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 40}ms forwards`;
    });
}

/**
 * Toast alert component controller
 */
function showToast(message) {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove('active');
    void toast.offsetWidth; // Force element reflow
    toast.classList.add('active');
    
    if (window.toastTimeout) {
        clearTimeout(window.toastTimeout);
    }
    window.toastTimeout = setTimeout(() => {
        toast.classList.remove('active');
    }, 2500);
}

/**
 * Dynamic Lightbox implementation for full screen image viewing with utilities
 */
function setupLightbox() {
    const galleryContainer = document.querySelector('.img-container');
    if (!galleryContainer) return;

    let visibleImages = [];
    let currentIndex = 0;
    let slideshowInterval = null;
    let isPlaying = false;

    // Create lightbox HTML structure dynamically
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.id = 'gallery-lightbox';
    lightbox.innerHTML = `
        <div class="lightbox-counter">1 / 1</div>
        <div class="lightbox-toolbar">
            <button class="lightbox-btn lightbox-play" title="Play Slideshow">▶</button>
            <button class="lightbox-btn lightbox-share" title="Copy Image Link">📋</button>
            <button class="lightbox-btn lightbox-download" title="Download Photo">↓</button>
            <button class="lightbox-btn lightbox-close" title="Close Lightbox">&times;</button>
        </div>
        <div class="lightbox-content">
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
    const playBtn = lightbox.querySelector('.lightbox-play');
    const shareBtn = lightbox.querySelector('.lightbox-share');
    const downloadBtn = lightbox.querySelector('.lightbox-download');
    const counterEl = lightbox.querySelector('.lightbox-counter');

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
        stopSlideshow();
    }

    function showImage(index) {
        if (index < 0 || index >= visibleImages.length) return;
        const currentLink = visibleImages[index];
        const imgUrl = currentLink.getAttribute('href');
        const imgAlt = currentLink.querySelector('img')?.getAttribute('alt') || 'L&T Gallery Image';
        
        counterEl.textContent = `${index + 1} / ${visibleImages.length}`;

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

    // Slideshow operations
    function toggleSlideshow() {
        if (isPlaying) {
            stopSlideshow();
        } else {
            startSlideshow();
        }
    }

    function startSlideshow() {
        if (visibleImages.length <= 1) {
            showToast("Not enough images for a slideshow.");
            return;
        }
        isPlaying = true;
        playBtn.innerHTML = '⏸';
        playBtn.classList.add('active');
        slideshowInterval = setInterval(showNext, 3000);
        showToast("Slideshow autoplay started.");
    }

    function stopSlideshow() {
        isPlaying = false;
        playBtn.innerHTML = '▶';
        playBtn.classList.remove('active');
        if (slideshowInterval) {
            clearInterval(slideshowInterval);
            slideshowInterval = null;
        }
    }

    // Share link operation
    function shareImage() {
        const fullUrl = new URL(lightboxImg.src, window.location.origin).href;
        navigator.clipboard.writeText(fullUrl).then(() => {
            showToast("Copied image link to clipboard!");
        }).catch(() => {
            showToast("Failed to copy image link.");
        });
    }

    // Download photo operation
    function downloadImage() {
        const imgSrc = lightboxImg.src;
        const a = document.createElement('a');
        a.href = imgSrc;
        a.download = imgSrc.split('/').pop() || 'gallery-image.jpg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast("Starting download...");
    }

    // Event listeners
    closeBtn.addEventListener('click', closeLightbox);
    
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        stopSlideshow();
        showNext();
    });
    
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        stopSlideshow();
        showPrev();
    });

    playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSlideshow();
    });

    shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        shareImage();
    });

    downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadImage();
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
            stopSlideshow();
            showNext();
        } else if (e.key === 'ArrowLeft') {
            stopSlideshow();
            showPrev();
        } else if (e.key === ' ') { // Space bar to play/pause
            e.preventDefault();
            toggleSlideshow();
        }
    }
}

