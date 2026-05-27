// Sanity Configuration
const SANITY_PROJECT_ID = 'feul6wbq';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';

// Fetch Equipment with Caching and Retry Logic
async function fetchEquipment(limit = null, category = null) {
    // Check cache first
    const cacheKey = `equipment_${category || 'all'}_${limit || 'all'}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) {
        try {
            const parsedCache = JSON.parse(cached);
            const cacheTime = parsedCache.timestamp;
            const now = Date.now();
            
            // Cache valid for 5 minutes
            if (now - cacheTime < 300000) {
                console.log('Using cached equipment data');
                return parsedCache.data;
            }
        } catch (e) {
            sessionStorage.removeItem(cacheKey);
        }
    }
    
    let query = '*[_type == "equipment"';
    
    if (category && category !== 'all') {
        query += ` && category == "${category}"`;
    } else {
        query += ' && category != "kitchen-equipment"';
    }
    
    query += ']{name, slug, category, shortDescription, fullDescription, condition, mainImage, inStock, price, quartSize}';
    if (category === 'mixers') {
        query += ' | order(quartSize asc)';
    } else {
        query += ' | order(category asc, quartSize asc, _createdAt desc)';
    }
    
    if (limit) {
        query += ` [0...${limit}]`;
    }
    
    const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;
    
    let retries = 3;
    
    while (retries > 0) {
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache the result
            sessionStorage.setItem(cacheKey, JSON.stringify({
                data: data.result,
                timestamp: Date.now()
            }));
            
            return data.result;
            
        } catch (error) {
            console.error(`Fetch attempt failed (${4 - retries}/3):`, error);
            retries--;
            
            if (retries === 0) {
                console.error('All fetch attempts failed:', error);
                
                // Try to return stale cache if available
                if (cached) {
                    console.log('Returning stale cached data as fallback');
                    try {
                        return JSON.parse(cached).data;
                    } catch (e) {
                        return null;
                    }
                }
                
                return null;
            }
            
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
        }
    }
}

// Helper function to get image URL from Sanity
function getImageUrl(imageRef) {
    if (!imageRef || !imageRef.asset) return null;
    
    const ref = imageRef.asset._ref;
    const [, id, dimensions, format] = ref.split('-');
    
    return `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${id}-${dimensions}.${format}`;
}

// Render Equipment Card
function createEquipmentCard(equipment) {
    const imageUrl = equipment.mainImage ? getImageUrl(equipment.mainImage) : null;
    
    let detailUrl = equipment.slug ? `equipment-detail.html?slug=${equipment.slug.current}` : '#';
    if (equipment.category) {
        detailUrl += `&category=${equipment.category}`;
    }
    
    const description = equipment.shortDescription || equipment.fullDescription || '';
    const shortDesc = description.length > 100 ? description.substring(0, 100) + '...' : description;
    
    const callButtonText = equipment.price ? 'Call to Purchase' : 'Request Quote';
    
    return `
        <div class="equipment-card">
            <div class="equipment-image">
                ${imageUrl 
                    ? `<img src="${imageUrl}" alt="${equipment.name}" loading="lazy">`
                    : `<svg width="100%" height="100%" viewBox="0 0 300 220" fill="none">
                         <rect width="300" height="220" fill="#f0f0f0"/>
                         <text x="50%" y="50%" text-anchor="middle" fill="#999" font-size="14">No image</text>
                       </svg>`
                }
            </div>
            <div class="equipment-details">
                <span class="equipment-badge">${equipment.condition || 'Available'}</span>
                <h3 class="equipment-name">${equipment.name}</h3>
                ${equipment.quartSize ? `<span class="equipment-quart">${equipment.quartSize} Quart</span>` : ''}
                <p class="equipment-description">${shortDesc}</p>
                <div class="equipment-card-actions">
                    <a href="${detailUrl}" class="equipment-cta equipment-cta-secondary">View Details</a>
                    <a href="tel:+12153331300" class="equipment-cta equipment-cta-primary">${callButtonText}</a>
                </div>
            </div>
        </div>
    `;
}

// Better loading state
function showLoading(container, message = 'Loading equipment inventory...') {
    if (container) {
        container.innerHTML = `
            <div class="equipment-loading">
                <div class="loading-spinner"></div>
                <p>${message}</p>
            </div>
        `;
    }
}

// Better error state
function showError(container, message = 'Unable to load equipment at this time') {
    if (container) {
        container.innerHTML = `
            <div class="equipment-error">
                <p>${message}</p>
                <p>Please <a href="tel:+12153331300">call us at (215) 333-1300</a> for current inventory.</p>
                <button onclick="location.reload()" class="btn btn-secondary">Try Again</button>
            </div>
        `;
    }
}

// Load Featured Equipment (Homepage)
async function loadFeaturedEquipment() {
    const container = document.getElementById('featuredEquipment');
    if (!container) return;
    
    showLoading(container, 'Loading featured equipment...');
    
    const equipment = await fetchEquipment(3);
    
    if (!equipment || equipment.length === 0) {
        showError(container, 'No featured equipment available at this time');
        return;
    }
    
    container.innerHTML = equipment.map(item => createEquipmentCard(item)).join('');
}

// Load All Equipment (Equipment Page)
async function loadAllEquipment(category = 'all') {
    const container = document.getElementById('allEquipment');
    if (!container) return;
    
    showLoading(container, 'Loading equipment inventory...');
    
    const equipment = await fetchEquipment(null, category);
    
    if (!equipment || equipment.length === 0) {
        container.innerHTML = '<div class="equipment-loading">No equipment available in this category. Check back soon!</div>';
        return;
    }
    
    container.innerHTML = equipment.map(item => createEquipmentCard(item)).join('');
}

// Handle category filter buttons
function setupCategoryFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    if (filterButtons.length === 0) return;
    
    filterButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const category = this.getAttribute('data-category');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update URL without page reload
            const url = new URL(window.location);
            if (category === 'all') {
                url.searchParams.delete('category');
            } else {
                url.searchParams.set('category', category);
            }
            window.history.pushState({}, '', url);
            
            // Load filtered equipment
            await loadAllEquipment(category);
        });
    });
}

// Get category from URL parameter
function getCategoryFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('category') || 'all';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on homepage
    if (document.getElementById('featuredEquipment')) {
        loadFeaturedEquipment();
    }
    
    // Check if we're on equipment page
    if (document.getElementById('allEquipment')) {
        const category = getCategoryFromURL();
        
        // Set active filter button based on URL
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            if (btn.getAttribute('data-category') === category) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Load equipment with category filter
        loadAllEquipment(category);
        
        // Setup filter button click handlers
        setupCategoryFilters();
    }
});

// Export functions for use in other scripts
window.equipmentAPI = {
    fetch: fetchEquipment,
    getImageUrl: getImageUrl
};