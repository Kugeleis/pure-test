import itemsjs from 'https://esm.sh/itemsjs@latest';

/**
 * Configuration for the faceted search
 */
const CONFIG = {
    facets: {
        category: { title: 'Kategorie', type: 'discrete' },
        brand: { title: 'Marke', type: 'discrete' },
        price: { title: 'Preis', type: 'range-dual', unit: '€' },
        rating: { title: 'Bewertung', type: 'range-min' },
        'dimensions.height': { title: 'Höhe', type: 'range', unit: 'cm' },
        'dimensions.width': { title: 'Breite', type: 'range', unit: 'cm' }
    },
    searchableFields: ['title', 'description', 'category', 'brand'],
    itemsPerPage: 1000
};

/**
 * Utility to get value from nested object using dot notation
 */
function getValueByPath(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

/**
 * State Management
 */
class SearchState {
    constructor() {
        this.query = '';
        this.filters = {};
        this.itemRanges = {};
    }

    calculateRanges(items) {
        Object.entries(CONFIG.facets).forEach(([key, cfg]) => {
            if (cfg.type.startsWith('range')) {
                const values = items
                    .map(item => parseFloat(item[key]))
                    .filter(v => !isNaN(v));

                if (values.length > 0) {
                    this.itemRanges[key] = {
                        min: Math.floor(Math.min(...values)),
                        max: Math.ceil(Math.max(...values))
                    };
                }
            }
        });
    }

    reset() {
        this.query = '';
        this.filters = {};
        Object.entries(CONFIG.facets).forEach(([key, cfg]) => {
            if (cfg.type === 'discrete') {
                this.filters[key] = [];
                return;
            }

            const range = this.itemRanges[key];
            if (!range) return;

            if (cfg.type === 'range-dual') {
                this.filters[key] = [range.min, range.max];
            } else if (cfg.type === 'range-min') {
                this.filters[key] = range.min;
            } else if (cfg.type === 'range') {
                this.filters[key] = range.max;
            }
        });
    }

    setQuery(q) {
        this.query = q;
    }

    setFilter(key, value) {
        this.filters[key] = value;
    }
}

/**
 * Search Engine Service
 */
class SearchService {
    constructor(items) {
        this.items = items;
        this.engine = itemsjs(items, {
            aggregations: Object.fromEntries(
                Object.entries(CONFIG.facets).map(([key, cfg]) => [
                    key, 
                    { title: cfg.title, size: 100 }
                ])
            ),
            searchableFields: CONFIG.searchableFields
        });
    }

    search(state) {
        const discreteFilters = {};
        const otherFilters = {};

        Object.entries(state.filters).forEach(([key, val]) => {
            if (CONFIG.facets[key].type === 'discrete') {
                if (Array.isArray(val) && val.length > 0) {
                    discreteFilters[key] = val;
                }
            } else {
                otherFilters[key] = val;
            }
        });

        const searchResult = this.engine.search({
            query: state.query,
            filters: discreteFilters,
            per_page: CONFIG.itemsPerPage
        });

        let filteredItems = searchResult.data.items || [];

        // Manual filtering for range facets (ItemsJS doesn't handle them natively in the same way)
        Object.entries(otherFilters).forEach(([key, val]) => {
            const type = CONFIG.facets[key].type;
            filteredItems = filteredItems.filter(item => {
                const itemVal = parseFloat(item[key]);
                if (isNaN(itemVal)) return true;

                if (type === 'range-dual' && Array.isArray(val)) {
                    return itemVal >= val[0] && itemVal <= val[1];
                } else if (type === 'range-min') {
                    return itemVal >= val;
                } else {
                    return itemVal <= val;
                }
            });
        });

        return {
            items: filteredItems,
            aggregations: searchResult.data.aggregations
        };
    }
}

/**
 * UI Component Manager
 */
class UIManager {
    constructor(state, searchService) {
        this.state = state;
        this.searchService = searchService;

        this.elements = {
            grid: document.getElementById('item-grid'),
            info: document.getElementById('results-info'),
            filtersContainer: document.getElementById('dynamic-filters'),
            searchInput: document.getElementById('search-input'),
            resetButton: document.getElementById('reset-button')
        };

        this.initEventListeners();
    }

    initEventListeners() {
        this.elements.searchInput.addEventListener('sl-input', e => {
            this.state.setQuery(e.target.value);
            this.update();
        });

        this.elements.resetButton.addEventListener('click', () => {
            this.state.reset();
            this.syncUI();
            this.update();
        });
    }

    syncUI() {
        // Search input
        if (this.elements.searchInput) {
            this.elements.searchInput.value = this.state.query;
        }

        // Filters
        Object.entries(CONFIG.facets).forEach(([key, cfg]) => {
            const val = this.state.filters[key];
            const el = document.getElementById(`filter-${key}`);
            const display = document.getElementById(`display-${key}`);

            if (cfg.type === 'discrete') {
                if (el) el.value = val;
            } else if (cfg.type === 'range' || cfg.type === 'range-min') {
                if (el) el.value = val;
                if (display) {
                    const prefix = cfg.type === 'range-min' ? 'Mind. ' : 'Max. ';
                    display.innerText = `${prefix}${val}${cfg.unit || ''}`;
                }
            } else if (cfg.type === 'range-dual') {
                if (el && el.noUiSlider) {
                    el.noUiSlider.set(val);
                }
                if (display) {
                    display.innerText = `${val[0]}${cfg.unit || ''} - ${val[1]}${cfg.unit || ''}`;
                }
            }
        });
    }

    renderProductCard(item) {
        return `
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
        `;
    }

    renderFilters(aggregations) {
        if (!aggregations) return;

        if (this.elements.filtersContainer.children.length === 0) {
            this.createFilters(aggregations);
        } else {
            this.updateDiscreteFilters(aggregations);
        }
    }

    createFilters(aggregations) {
        Object.entries(CONFIG.facets).forEach(([key, cfg]) => {
            const group = document.createElement('div');
            group.className = 'filter-group';
            
            const label = document.createElement('label');
            label.className = 'filter-label';
            label.innerText = cfg.title;
            group.appendChild(label);

            if (cfg.type === 'discrete') {
                this.renderDiscreteFilter(key, cfg, aggregations[key], group);
            } else if (cfg.type === 'range' || cfg.type === 'range-min') {
                this.renderRangeFilter(key, cfg, group);
            } else if (cfg.type === 'range-dual') {
                this.renderDualRangeFilter(key, cfg, group);
            }

            this.elements.filtersContainer.appendChild(group);
        });
    }

    renderDiscreteFilter(key, cfg, aggregation, container) {
        const select = document.createElement('sl-select');
        select.id = `filter-${key}`;
        select.multiple = true;
        select.clearable = true;
        select.placeholder = `Alle ${cfg.title}`;

        const buckets = aggregation.buckets || [];
        select.innerHTML = buckets.map(b => `
            <sl-option value="${b.key}">${b.key} (${b.doc_count})</sl-option>
        `).join('');

        select.addEventListener('sl-change', e => {
            this.state.setFilter(key, e.target.value);
            this.update();
        });
        container.appendChild(select);
    }

    renderRangeFilter(key, cfg, container) {
        const range = this.state.itemRanges[key];
        if (!range) return;

        const slRange = document.createElement('sl-range');
        slRange.id = `filter-${key}`;
        slRange.min = range.min;
        slRange.max = range.max;
        slRange.value = this.state.filters[key];
        slRange.step = 0.1;
        if (cfg.type === 'range-min') {
            slRange.classList.add('range-min-slider');
        }

        const display = document.createElement('div');
        display.className = 'range-display';
        display.id = `display-${key}`;
        const prefix = cfg.type === 'range-min' ? 'Mind. ' : 'Max. ';
        display.innerText = `${prefix}${this.state.filters[key]}${cfg.unit || ''}`;

        slRange.addEventListener('sl-input', e => {
            const val = parseFloat(e.target.value);
            display.innerText = `${prefix}${val}${cfg.unit || ''}`;
            this.state.setFilter(key, val);
            this.update();
        });
        container.appendChild(slRange);
        container.appendChild(display);
    }

    renderDualRangeFilter(key, cfg, container) {
        const range = this.state.itemRanges[key];
        if (!range) return;

        const sliderDiv = document.createElement('div');
        sliderDiv.id = `filter-${key}`;
        container.appendChild(sliderDiv);

        const display = document.createElement('div');
        display.className = 'range-display';
        display.id = `display-${key}`;
        const initialVal = this.state.filters[key];
        display.innerText = `${initialVal[0]}${cfg.unit || ''} - ${initialVal[1]}${cfg.unit || ''}`;
        container.appendChild(display);

        // Use requestAnimationFrame instead of setTimeout(..., 10)
        requestAnimationFrame(() => {
            if (window.noUiSlider) {
                window.noUiSlider.create(sliderDiv, {
                    start: [range.min, range.max],
                    connect: true,
                    range: { 'min': range.min, 'max': range.max },
                    step: 1
                });

                sliderDiv.noUiSlider.on('update', (values) => {
                    const min = Math.round(values[0]);
                    const max = Math.round(values[1]);
                    display.innerText = `${min}${cfg.unit || ''} - ${max}${cfg.unit || ''}`;
                    this.state.setFilter(key, [min, max]);
                    this.update();
                });
            }
        });
    }

    updateDiscreteFilters(aggregations) {
        Object.entries(CONFIG.facets).forEach(([key, cfg]) => {
            if (cfg.type === 'discrete') {
                const select = document.getElementById(`filter-${key}`);
                if (!select) return;
                
                const buckets = aggregations[key].buckets || [];
                const currentValues = this.state.filters[key] || [];
                
                select.innerHTML = buckets.map(b => `
                    <sl-option value="${b.key}" ${currentValues.includes(b.key) ? 'selected' : ''}>${b.key} (${b.doc_count})</sl-option>
                `).join('');
            }
        });
    }

    update() {
        const result = this.searchService.search(this.state);

        this.elements.info.innerText = `${result.items.length} Produkte gefunden`;
        this.elements.grid.innerHTML = result.items.map(item => this.renderProductCard(item)).join('');

        this.renderFilters(result.aggregations);
    }

    showError(message) {
        this.elements.info.innerHTML = `
            <sl-alert variant="danger" open>
                <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
                <strong>Fehler</strong><br />
                ${message}
            </sl-alert>
        `;
    }
}

/**
 * Application Entry Point
 */
async function init() {
    const state = new SearchState();
    let ui;

    try {
        const response = await fetch('https://dummyjson.com/products?limit=100');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const rawItems = data.products || [];

        // Pre-process items to support nested facet keys
        const items = rawItems.map(item => {
            const processedItem = { ...item };
            Object.keys(CONFIG.facets).forEach(key => {
                if (key.includes('.')) {
                    processedItem[key] = getValueByPath(item, key);
                }
            });
            return processedItem;
        });

        const searchService = new SearchService(items);
        ui = new UIManager(state, searchService);

        state.calculateRanges(items);
        state.reset();
        ui.update();
    } catch (error) {
        console.error('Initialization error:', error);
        if (ui) {
            ui.showError(error.message);
        } else {
            document.getElementById('results-info').innerHTML = `Critical Error: ${error.message}`;
        }
    }
}

document.addEventListener('DOMContentLoaded', init);
