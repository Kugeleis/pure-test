import { getValueByPath } from './src/utils.js';
import { SearchState } from './src/state.js';
import { SearchService } from './src/search-service.js';
import { UIManager } from './src/ui-manager.js';

/**
 * Application Entry Point
 */
async function init() {
    let ui;

    try {
        // Load Configuration
        const configResponse = await fetch('config.json');
        if (!configResponse.ok) throw new Error('Could not load config.json');
        const config = await configResponse.json();

        const state = new SearchState(config);

        // Load Data
        const response = await fetch(config.apiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const rawItems = data.products || [];

        // Pre-process items to support nested facet keys
        const items = rawItems.map(item => {
            const processedItem = { ...item };
            Object.keys(config.facets).forEach(key => {
                if (key.includes('.')) {
                    processedItem[key] = getValueByPath(item, key);
                }
            });
            return processedItem;
        });

        const searchService = new SearchService(items, config);
        ui = new UIManager(state, searchService, config);

        state.calculateRanges(items);
        state.reset();
        ui.update();
    } catch (error) {
        console.error('Initialization error:', error);
        const infoEl = document.getElementById('results-info');
        if (infoEl) {
            infoEl.innerHTML = `Critical Error: ${error.message}`;
        }
    }
}

document.addEventListener('DOMContentLoaded', init);
