// Sanity Configuration
const SANITY_PROJECT_ID = 'feul6wbq';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';

// Get slug from URL
function getSlugFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('slug');
}

// Fetch single equipment by slug
async function fetchEquipmentBySlug(slug) {
    const query = `*[_type == "equipment" && slug.current == "${slug}"][0]{
        name,
        slug,
        category,
        quartSize,
        shortDescription,
        fullDescription,
        condition,
        mainImage,
        gallery,
        brand,
        model,
        price,
        weight,
        shippingNote,
        inStock,
        specifications
    }`;
    
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
function getImageUrl(imageRef, width = 800) {
    if (!imageRef || !imageRef.asset) return null;
    
    const ref = imageRef.asset._ref;
    const [, id, dimensions, format] = ref.split('-');
    
    return `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${id}-${dimensions}.${format}?w=${width}&fit=max`;
}

// Render equipment detail page
function renderEquipmentDetail(equipment) {
    if (!equipment) {
        return `
            <div style="text-align: center; padding: 60px 20px;">
                <h2>Equipment Not Found</h2>
                <p style="color: var(--text-gray); margin: 20px 0;">The equipment you're looking for doesn't exist or has been removed.</p>
                <a href="equipment.html" class="btn btn-primary">Back to Equipment</a>
            </div>
        `;
    }

    // Prepare images
    const mainImage = equipment.mainImage ? getImageUrl(equipment.mainImage) : null;
    const galleryImages = equipment.gallery ? equipment.gallery.map(img => getImageUrl(img)) : [];
    const allImages = mainImage ? [mainImage, ...galleryImages] : galleryImages;

    // Price display
    const priceDisplay = equipment.price 
        ? `<div class="detail-price">$${equipment.price.toLocaleString()}</div>`
        : `<div class="detail-price">Call for Pricing</div>`;

    // Stock status badge
    const stockBadge = equipment.inStock 
        ? '<span class="stock-badge in-stock">✓ In Stock</span>'
        : '<span class="stock-badge out-of-stock">Out of Stock</span>';

    // Dynamic breadcrumb based on category and referrer
    let categoryLink = 'equipment.html';
    let categoryName = 'Equipment';
    
    // Check if there's a category in the URL params (from referrer)
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    
    // Use category from URL param or equipment's category field
    const equipmentCategory = categoryParam || equipment.category;
    
    if (equipmentCategory) {
        if (equipmentCategory === 'mixers') {
            categoryLink = 'mixers.html';
            categoryName = 'Hobart Mixers';
        } else if (equipmentCategory === 'parts') {
            categoryLink = 'equipment.html?category=parts';
            categoryName = 'Parts & Accessories';
        } else if (equipmentCategory === 'bowls') {
            categoryLink = 'equipment.html?category=bowls';
            categoryName = 'Stainless Steel Bowls';
        } else {
            categoryLink = `equipment.html?category=${equipmentCategory}`;
            categoryName = equipmentCategory.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    }

    const breadcrumb = `<a href="index.html">Home</a> / <a href="${categoryLink}">${categoryName}</a> / ${equipment.name}`;

    // Specifications
    const specsHTML = equipment.specifications && equipment.specifications.length > 0
        ? `
            <div class="specifications">
                <h3>Specifications</h3>
                ${equipment.specifications.map(section => `
                    <div class="spec-section">
                        <h4 class="spec-section-title">${section.section}</h4>
                        <ul class="spec-items">
                            ${section.items.map(item => `
                                <li>${item}</li>
                            `).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        `
        : '';

    // Add brand and model to specs if available
    const additionalSpecs = [];
    if (equipment.brand) additionalSpecs.push({label: 'Brand', value: equipment.brand});
    if (equipment.model) additionalSpecs.push({label: 'Model', value: equipment.model});
    if (equipment.weight) additionalSpecs.push({label: 'Weight', value: equipment.weight});

    const additionalSpecsHTML = additionalSpecs.length > 0
        ? `
            <div class="specifications">
                <h3>Details</h3>
                <div class="spec-list">
                    ${additionalSpecs.map(spec => `
                        <div class="spec-item">
                            <div class="spec-label">${spec.label}</div>
                            <div class="spec-value">${spec.value}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `
        : '';

    // Shipping note
    const shippingNoteHTML = equipment.shippingNote 
        ? `<p class="shipping-note">${equipment.shippingNote}</p>`
        : '';

    return `
        <a href="equipment.html" class="back-link">← Back to Equipment</a>
        
        <div class="detail-container">
            <div class="detail-gallery">
                <div class="main-image" id="mainImage">
                    ${allImages.length > 0 
                        ? `<img src="${allImages[0]}" alt="${equipment.name}" id="mainImageImg">`
                        : `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-gray);">No image available</div>`
                    }
                </div>
                ${allImages.length > 1 ? `
                    <div class="thumbnail-gallery">
                        ${allImages.map((img, index) => `
                            <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeImage('${img}', ${index})">
                                <img src="${img}" alt="${equipment.name}">
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>

            <div class="detail-info">
                <div class="breadcrumb">
                    ${breadcrumb}
                </div>

                <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px;">
                    <span class="detail-badge">${equipment.condition || 'Available'}</span>
                    ${stockBadge}
                </div>
                
                <h1 class="detail-title">${equipment.name}</h1>
                ${equipment.model ? `<p class="detail-model">Model: ${equipment.model}</p>` : ''}

                ${priceDisplay}
                ${shippingNoteHTML}

                ${equipment.price 
                    ? `<div class="detail-actions">
                        <a href="tel:+12153331300" class="btn btn-primary">📞 Call to Purchase - (215) 333-1300</a>
                    </div>`
                    : `<div class="detail-actions">
                        <a href="tel:+12153331300" class="btn btn-primary">📞 Request a Quote - Call Now</a>
                    </div>`
                }

                <div class="detail-description">
                    ${equipment.fullDescription || equipment.shortDescription || 'No description available.'}
                </div>

                ${additionalSpecsHTML}
                ${specsHTML}
            </div>
        </div>
    `;
}

// Change main image when thumbnail clicked
window.changeImage = function(imageUrl, index) {
    const mainImg = document.getElementById('mainImageImg');
    if (mainImg) {
        mainImg.src = imageUrl;
    }

    // Update active thumbnail
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        if (i === index) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
};

// Load equipment detail on page load
document.addEventListener('DOMContentLoaded', async function() {
    const slug = getSlugFromURL();
    
    if (!slug) {
        document.getElementById('equipmentDetail').innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <h2>Invalid Equipment</h2>
                <p style="color: var(--text-gray); margin: 20px 0;">No equipment specified.</p>
                <a href="equipment.html" class="btn btn-primary">Back to Equipment</a>
            </div>
        `;
        return;
    }

    const equipment = await fetchEquipmentBySlug(slug);
    
    // Update page title
    if (equipment) {
        document.getElementById('pageTitle').textContent = `${equipment.name} | Jomarc`;
    }

    document.getElementById('equipmentDetail').innerHTML = renderEquipmentDetail(equipment);
    // Initialize lightbox after content is rendered
    if (typeof window.initLightbox === 'function') {
        setTimeout(window.initLightbox, 200);
    }
});