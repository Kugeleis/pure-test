import { getValueByPath } from './utils.js';

/**
 * UI Component Manager
 */
export class UIManager {
    constructor(state, searchService, config) {
        this.state = state;
        this.searchService = searchService;
        this.config = config;

        this.elements = {
            grid: document.getElementById('item-grid'),
            info: document.getElementById('results-info'),
            filtersContainer: document.getElementById('dynamic-filters'),
            searchInput: document.getElementById('search-input'),
            resetButton: document.getElementById('reset-button'),
            sortContainer: document.getElementById('sort-container'),
            logo: document.querySelector('.logo'),
            navLinks: document.querySelector('.nav-links'),
            filtersTitle: document.querySelector('.filters-header h2'),
            themeSwitcher: document.getElementById('theme-switcher')
        };

        this.initUI();
        this.syncThemeUI();
        this.initEventListeners();
        this.renderSortControls();
    }

    initUI() {
        const { ui } = this.config;
        if (!ui) return;

        // Title and Logo
        if (ui.title) document.title = ui.title;
        if (ui.shopName && this.elements.logo) this.elements.logo.innerText = ui.shopName;

        // Navigation
        if (ui.navLinks && this.elements.navLinks) {
            this.elements.navLinks.innerHTML = ui.navLinks.map(link => `
                <sl-button variant="${link.variant || 'text'}" ${link.outline ? 'outline' : ''} href="${link.href}">
                    ${link.label}
                </sl-button>
            `).join('');
        }

        // Labels
        const { labels } = ui;
        if (labels) {
            if (labels.filtersTitle && this.elements.filtersTitle) this.elements.filtersTitle.innerText = labels.filtersTitle;
            if (labels.resetButton && this.elements.resetButton) this.elements.resetButton.innerText = labels.resetButton;
            if (labels.searchLabel && this.elements.searchInput) this.elements.searchInput.label = labels.searchLabel;
            if (labels.searchPlaceholder && this.elements.searchInput) this.elements.searchInput.placeholder = labels.searchPlaceholder;
        }
    }

    syncThemeUI() {
        const theme = localStorage.getItem('theme') || 'light';
        if (this.elements.themeSwitcher) {
            const menu = this.elements.themeSwitcher.querySelector('sl-menu');
            if (menu) {
                const items = menu.querySelectorAll('sl-menu-item');
                items.forEach(item => {
                    item.checked = (item.value === theme);
                });
            }
        }
    }

    setTheme(theme) {
        const root = document.documentElement;
        root.classList.remove('sl-theme-light', 'sl-theme-dark');
        root.classList.add(`sl-theme-${theme}`);
        localStorage.setItem('theme', theme);

        if (this.elements.themeSwitcher) {
            const menu = this.elements.themeSwitcher.querySelector('sl-menu');
            if (menu) {
                const items = menu.querySelectorAll('sl-menu-item');
                items.forEach(item => {
                    item.checked = (item.value === theme);
                });
            }
        }
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

        if (this.elements.themeSwitcher) {
            this.elements.themeSwitcher.addEventListener('sl-select', e => {
                const theme = e.detail.item.value;
                this.setTheme(theme);
            });
        }
    }

    renderSortControls() {
        if (!this.elements.sortContainer) return;

        const select = document.createElement('sl-select');
        select.id = 'sort-by-select';
        select.value = this.state.sortBy;
        select.innerHTML = this.config.sortOptions.map(opt => `
            <sl-option value="${opt.key}">${opt.label}</sl-option>
        `).join('');

        select.addEventListener('sl-change', e => {
            this.state.setSort(e.target.value);
            this.update();
        });

        const orderBtn = document.createElement('sl-button');
        orderBtn.id = 'sort-order-btn';
        orderBtn.className = 'sort-order-btn';
        orderBtn.variant = 'default';
        orderBtn.innerHTML = this.getSortIcon();

        orderBtn.addEventListener('click', () => {
            const nextOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
            this.state.setSort(undefined, nextOrder);
            orderBtn.innerHTML = this.getSortIcon();
            this.update();
        });

        this.elements.sortContainer.innerHTML = '';
        this.elements.sortContainer.appendChild(select);
        this.elements.sortContainer.appendChild(orderBtn);
    }

    getSortIcon() {
        return this.state.sortOrder === 'asc'
            ? '<sl-icon name="sort-up"></sl-icon>'
            : '<sl-icon name="sort-down"></sl-icon>';
    }

    syncUI() {
        const { ui } = this.config;
        const labels = ui?.labels || {};

        // Search input
        if (this.elements.searchInput) {
            this.elements.searchInput.value = this.state.query;
        }

        // Sort controls
        const sortSelect = document.getElementById('sort-by-select');
        if (sortSelect) sortSelect.value = this.state.sortBy;

        const sortOrderBtn = document.getElementById('sort-order-btn');
        if (sortOrderBtn) sortOrderBtn.innerHTML = this.getSortIcon();

        // Filters
        Object.entries(this.config.facets).forEach(([key, cfg]) => {
            const val = this.state.filters[key];
            const el = document.getElementById(`filter-${key}`);
            const display = document.getElementById(`display-${key}`);

            if (cfg.type === 'discrete') {
                if (el) el.value = val;
            } else if (cfg.type === 'range' || cfg.type === 'range-min') {
                if (el) el.value = val;
                if (display) {
                    const prefix = cfg.type === 'range-min' ? (labels.rangeMinPrefix || 'Mind. ') : (labels.rangeMaxPrefix || 'Max. ');
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
        const { ui } = this.config;
        const cardCfg = ui?.productCard;
        if (!cardCfg) return '';

        const labels = ui?.labels || {};

        // Resolve values
        const title = getValueByPath(item, cardCfg.title) || '';
        const image = getValueByPath(item, cardCfg.image) || '';
        const price = getValueByPath(item, cardCfg.price) || 0;
        const priceUnit = cardCfg.priceUnit || '';
        const rating = getValueByPath(item, cardCfg.rating) || 0;

        // Resolve Meta Fields
        const metaText = (cardCfg.meta || []).map(m => {
            let val = getValueByPath(item, m.key);
            if (!val && m.fallback) {
                val = labels[m.fallback] || m.fallback;
            }
            return val;
        }).filter(Boolean).join(' | ');

        return `
            <div class="card">
                <img src="${image}" alt="${title}" loading="lazy">
                <div class="card-title">${title}</div>
                <div class="card-meta">${metaText}</div>
                <div class="card-price">${price}${priceUnit}</div>
                <div class="card-meta">
                    <sl-rating label="Rating" readonly value="${rating}" precision="0.5"></sl-rating>
                    <small>(${rating})</small>
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
        const groups = {};

        Object.entries(this.config.facets).forEach(([key, cfg]) => {
            const groupName = cfg.group || '_none';
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push({ key, cfg });
        });

        Object.entries(groups).forEach(([groupName, facets]) => {
            let container = this.elements.filtersContainer;

            if (groupName !== '_none') {
                const details = document.createElement('sl-details');
                details.summary = groupName;
                details.className = 'filter-group-container';
                details.open = true;
                this.elements.filtersContainer.appendChild(details);
                container = details;
            }

            facets.forEach(({ key, cfg }) => {
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

                container.appendChild(group);
            });
        });
    }

    renderDiscreteFilter(key, cfg, aggregation, container) {
        const select = document.createElement('sl-select');
        select.id = `filter-${key}`;
        select.multiple = true;
        select.clearable = true;

        const allPrefix = this.config.ui?.labels?.allPrefix || 'Alle ';
        select.placeholder = `${allPrefix}${cfg.title}`;

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

        const labels = this.config.ui?.labels || {};

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
        const prefix = cfg.type === 'range-min' ? (labels.rangeMinPrefix || 'Mind. ') : (labels.rangeMaxPrefix || 'Max. ');
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
        Object.entries(this.config.facets).forEach(([key, cfg]) => {
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
        const total = this.searchService.items.length;
        const current = result.items.length;

        const labels = this.config.ui?.labels || {};

        if (current === total) {
            const text = (labels.resultsCount || '{count} Produkte').replace('{count}', total);
            this.elements.info.innerText = text;
        } else {
            const text = (labels.resultsCountFiltered || '{count} Produkte von {total} gefunden')
                .replace('{count}', current)
                .replace('{total}', total);
            this.elements.info.innerText = text;
        }

        this.elements.grid.innerHTML = result.items.map(item => this.renderProductCard(item)).join('');

        this.renderFilters(result.aggregations);
    }

    showError(message) {
        const title = this.config.ui?.labels?.errorTitle || 'Fehler';
        this.elements.info.innerHTML = `
            <sl-alert variant="danger" open>
                <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
                <strong>${title}</strong><br />
                ${message}
            </sl-alert>
        `;
    }
}
