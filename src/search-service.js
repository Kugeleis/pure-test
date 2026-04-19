import itemsjs from 'https://esm.sh/itemsjs@latest';
import { getValueByPath } from './utils.js';

/**
 * Search Engine Service
 */
export class SearchService {
    constructor(items, config) {
        this.items = items;
        this.config = config;
        this.engine = itemsjs(items, {
            aggregations: Object.fromEntries(
                Object.entries(config.facets).map(([key, cfg]) => [
                    key,
                    {
                        title: cfg.title,
                        size: 100,
                        conjunction: cfg.conjunction !== undefined ? cfg.conjunction : false
                    }
                ])
            ),
            searchableFields: config.searchableFields
        });
    }

    search(state) {
        const discreteFilters = {};
        const otherFilters = {};

        Object.entries(state.filters).forEach(([key, val]) => {
            if (this.config.facets[key].type === 'discrete') {
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
            per_page: this.config.itemsPerPage
        });

        let filteredItems = searchResult.data.items || [];

        // Manual filtering for range facets (ItemsJS doesn't handle them natively in the same way)
        Object.entries(otherFilters).forEach(([key, val]) => {
            const type = this.config.facets[key].type;
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

        // Manual Sorting
        if (state.sortBy && state.sortBy !== 'relevance') {
            filteredItems.sort((a, b) => {
                const valA = getValueByPath(a, state.sortBy);
                const valB = getValueByPath(b, state.sortBy);

                let comparison = 0;
                if (typeof valA === 'string' && typeof valB === 'string') {
                    comparison = valA.localeCompare(valB);
                } else {
                    const numA = parseFloat(valA) || 0;
                    const numB = parseFloat(valB) || 0;
                    comparison = numA - numB;
                }

                return state.sortOrder === 'desc' ? -comparison : comparison;
            });
        }

        return {
            items: filteredItems,
            aggregations: searchResult.data.aggregations
        };
    }
}
