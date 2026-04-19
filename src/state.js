/**
 * State Management
 */
export class SearchState {
    constructor(config) {
        this.config = config;
        this.query = '';
        this.filters = {};
        this.itemRanges = {};
        this.sortBy = config.sortOptions[0].key;
        this.sortOrder = 'asc'; // 'asc' or 'desc'
    }

    calculateRanges(items) {
        Object.entries(this.config.facets).forEach(([key, cfg]) => {
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
        this.sortBy = this.config.sortOptions[0].key;
        this.sortOrder = 'asc';

        Object.entries(this.config.facets).forEach(([key, cfg]) => {
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

    setSort(key, order) {
        if (key !== undefined) this.sortBy = key;
        if (order !== undefined) this.sortOrder = order;
    }
}
