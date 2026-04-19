import itemsjs from 'https://esm.sh/itemsjs@latest';

// Configuration: Define which fields are facets and their types
const CONFIG = {
    facets: {
        category: { title: 'Kategorie', type: 'discrete' },
        brand: { title: 'Marke', type: 'discrete' },
        price: { title: 'Preis', type: 'range-dual', unit: '€' },
        rating: { title: 'Bewertung', type: 'range' }
    }
};

let engine;
let allItems = [];
let itemRanges = {};

const state = {
    query: '',
    filters: {}
};

const grid = document.getElementById('item-grid');
const info = document.getElementById('results-info');
const dynamicFiltersContainer = document.getElementById('dynamic-filters');

async function init() {
    try {
        if (typeof itemsjs !== 'function') {
            throw new Error('ItemsJS library could not be loaded as a function.');
        }

        const response = await fetch('https://dummyjson.com/products?limit=100');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        allItems = data.products || [];

        engine = itemsjs(allItems, {
            aggregations: Object.fromEntries(
                Object.entries(CONFIG.facets).map(([key, cfg]) => [
                    key, 
                    { title: cfg.title, size: 100 }
                ])
            ),
            searchableFields: ['title', 'description', 'category', 'brand']
        });

        // Auto-detect ranges
        Object.entries(CONFIG.facets).forEach(([key, cfg]) => {
            if (cfg.type === 'range' || cfg.type === 'range-dual') {
                const values = allItems
                    .map(item => parseFloat(item[key]))
                    .filter(v => !isNaN(v));
                
                if (values.length > 0) {
                    itemRanges[key] = {
                        min: Math.floor(Math.min(...values)),
                        max: Math.ceil(Math.max(...values))
                    };
                    
                    if (cfg.type === 'range-dual') {
                        state.filters[key] = [itemRanges[key].min, itemRanges[key].max];
                    } else {
                        state.filters[key] = itemRanges[key].max;
                    }
                }
            }
        });

        update();
    } catch (error) {
        console.error('Error during initialization:', error);
        info.innerHTML = `
            <sl-alert variant="danger" open>
                <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
                <strong>Initialisierungsfehler</strong><br />
                ${error.message}
            </sl-alert>
        `;
    }
}

function renderFilters(searchResult) {
    if (!searchResult?.data?.aggregations) return;

    if (dynamicFiltersContainer.children.length === 0) {
        Object.entries(CONFIG.facets).forEach(([key, cfg]) => {
            const group = document.createElement('div');
            group.className = 'filter-group';
            
            const label = document.createElement('label');
            label.className = 'filter-label';
            label.innerText = cfg.title;
            group.appendChild(label);

            if (cfg.type === 'discrete') {
                const select = document.createElement('sl-select');
                select.id = `filter-${key}`;
                select.multiple = true;
                select.clearable = true;
                select.placeholder = `Alle ${cfg.title}`;
                
                const buckets = searchResult.data.aggregations[key].buckets || [];
                select.innerHTML = buckets.map(b => `
                    <sl-option value="${b.key}">${b.key} (${b.doc_count})</sl-option>
                `).join('');

                select.addEventListener('sl-change', e => {
                    state.filters[key] = e.target.value;
                    update();
                });
                group.appendChild(select);
            } else if (cfg.type === 'range' && itemRanges[key]) {
                const range = itemRanges[key];
                const slRange = document.createElement('sl-range');
                slRange.id = `filter-${key}`;
                slRange.min = range.min;
                slRange.max = range.max;
                slRange.value = range.max;
                slRange.step = 0.1;

                const display = document.createElement('div');
                display.className = 'range-display';
                display.id = `display-${key}`;
                display.innerText = `${range.max} ${cfg.unit || ''}`;

                slRange.addEventListener('sl-input', e => {
                    const val = parseFloat(e.target.value);
                    display.innerText = `${val} ${cfg.unit || ''}`;
                    state.filters[key] = val; 
                    update();
                });
                group.appendChild(slRange);
                group.appendChild(display);
            } else if (cfg.type === 'range-dual' && itemRanges[key]) {
                const range = itemRanges[key];
                const sliderDiv = document.createElement('div');
                sliderDiv.id = `filter-${key}`;
                group.appendChild(sliderDiv);

                const display = document.createElement('div');
                display.className = 'range-display';
                display.id = `display-${key}`;
                display.innerText = `${range.min}${cfg.unit || ''} - ${range.max}${cfg.unit || ''}`;
                group.appendChild(display);

                // Initialize noUiSlider after a small delay to ensure element is in DOM
                setTimeout(() => {
                    window.noUiSlider.create(sliderDiv, {
                        start: [range.min, range.max],
                        connect: true,
                        range: {
                            'min': range.min,
                            'max': range.max
                        },
                        step: 1
                    });

                    sliderDiv.noUiSlider.on('update', (values) => {
                        const min = Math.round(values[0]);
                        const max = Math.round(values[1]);
                        display.innerText = `${min}${cfg.unit || ''} - ${max}${cfg.unit || ''}`;
                        state.filters[key] = [min, max];
                        update();
                    });
                }, 10);
            }
            dynamicFiltersContainer.appendChild(group);
        });
    } else {
        // Precise update for counts only
        Object.entries(CONFIG.facets).forEach(([key, cfg]) => {
            if (cfg.type === 'discrete') {
                const select = document.getElementById(`filter-${key}`);
                if (!select) return;
                
                const buckets = searchResult.data.aggregations[key].buckets || [];
                const currentValues = state.filters[key] || [];
                
                select.innerHTML = buckets.map(b => `
                    <sl-option value="${b.key}" ${currentValues.includes(b.key) ? 'selected' : ''}>${b.key} (${b.doc_count})</sl-option>
                `).join('');
            }
        });
    }
}

function update() {
    if (!engine) return;

    const discreteFilters = {};
    const rangeFilters = {};
    
    Object.entries(state.filters).forEach(([key, val]) => {
        if (CONFIG.facets[key].type === 'discrete') {
            if (Array.isArray(val) && val.length > 0) {
                discreteFilters[key] = val;
            }
        } else {
            rangeFilters[key] = val;
        }
    });

    const searchResult = engine.search({
        query: state.query,
        filters: discreteFilters,
        per_page: 1000
    });

    let filteredItems = searchResult.data.items || [];
    Object.entries(rangeFilters).forEach(([key, val]) => {
        filteredItems = filteredItems.filter(item => {
            const itemVal = parseFloat(item[key]);
            if (isNaN(itemVal)) return true;
            
            if (Array.isArray(val)) { // Dual range [min, max]
                return itemVal >= val[0] && itemVal <= val[1];
            } else { // Single range (max value)
                return itemVal <= val;
            }
        });
    });

    info.innerText = `${filteredItems.length} Produkte gefunden`;
    grid.innerHTML = filteredItems.map(item => `
        <div class="card">
            <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
            <div class="card-title">${item.title}</div>
            <div class="card-meta">${item.brand || 'Keine Marke'} | ${item.category}</div>
            <div class="card-price">${item.price}€</div>
            <div class="card-meta">
                <sl-rating label="Rating" readonly value="${item.rating}" precision="0.5"></sl-rating>
                <small>(${item.rating})</small>
            </div>
        </div>
    `).join('');

    renderFilters(searchResult);
}

document.getElementById('search-input').addEventListener('sl-input', e => {
    state.query = e.target.value;
    update();
});

init();