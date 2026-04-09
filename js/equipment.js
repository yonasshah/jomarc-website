// Sanity Configuration
const SANITY_PROJECT_ID = 'feul6wbq'; // Replace with your Sanity project ID
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';

// Sanity Client Query Function
async function fetchEquipment(limit = null, category = null) {
    let query = '*[_type == "equipment"';
    
    // Add category filter if specified
    if (category && category !== 'all') {
        query += ` && category == "${category}"`;
    }
    
    query += ']{name, slug, category, shortDescription, fullDescription, condition, mainImage, inStock, price}';
    query += ' | order(_createdAt desc)';
    
    if (limit) {
        query += ` [0...${limit}]`;
    }
    
    const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch equipment');
        }
        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error('Error fetching equipment:', error);
        return null;
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
    
    // Build detail URL with category if available
    let detailUrl = equipment.slug ? `equipment-detail.html?slug=${equipment.slug.current}` : '#';
    if (equipment.category) {
        detailUrl += `&category=${equipment.category}`;
    }
    
    const description = equipment.shortDescription || equipment.fullDescription || '';
    // Truncate to ~100 characters for card view
    const shortDesc = description.length > 100 ? description.substring(0, 100) + '...' : description;
    
    // Determine button text based on price
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
                <p class="equipment-description">${shortDesc}</p>
                <div class="equipment-card-actions">
                    <a href="${detailUrl}" class="equipment-cta equipment-cta-secondary">View Details</a>
                    <a href="tel:+12153331300" class="equipment-cta equipment-cta-primary">${callButtonText}</a>
                </div>
            </div>
        </div>
    `;
}

// Load Featured Equipment (Homepage)
async function loadFeaturedEquipment() {
    const container = document.getElementById('featuredEquipment');
    if (!container) return;
    
    showLoading(container, 'Loading featured equipment...');
    
    const equipment = await fetchEquipment(3); // Get 3 featured items
    
    if (!equipment || equipment.length === 0) {
        container.innerHTML = '<div class="equipment-loading">No equipment available at this time.</div>';
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