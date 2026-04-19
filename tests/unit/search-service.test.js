import { SearchService } from '../../src/search-service.js';
import { SearchState } from '../../src/state.js';

const expect = chai.expect;

describe('SearchService', () => {
    let config;
    let items;
    let searchService;

    beforeEach(() => {
        config = {
            facets: {
                category: { type: 'discrete', title: 'Category' },
                price: { type: 'range-dual', title: 'Price', unit: '€' }
            },
            searchableFields: ['title'],
            itemsPerPage: 20,
            sortOptions: [{ key: 'relevance', label: 'Relevance' }, { key: 'price', label: 'Price' }]
        };
        items = [
            { title: 'Item 1', category: 'A', price: 10 },
            { title: 'Item 2', category: 'B', price: 20 },
            { title: 'Another Item', category: 'A', price: 30 }
        ];
        searchService = new SearchService(items, config);
    });

    it('should return all items when no query or filters are applied', () => {
        const state = new SearchState(config);
        const result = searchService.search(state);
        expect(result.items).to.have.lengthOf(3);
    });

    it('should filter by query', () => {
        const state = new SearchState(config);
        state.setQuery('Another');
        const result = searchService.search(state);
        expect(result.items).to.have.lengthOf(1);
        expect(result.items[0].title).to.equal('Another Item');
    });

    it('should filter by discrete filters', () => {
        const state = new SearchState(config);
        state.setFilter('category', ['B']);
        const result = searchService.search(state);
        expect(result.items).to.have.lengthOf(1);
        expect(result.items[0].category).to.equal('B');
    });

    it('should filter by range filters', () => {
        const state = new SearchState(config);
        state.setFilter('price', [15, 25]);
        const result = searchService.search(state);
        expect(result.items).to.have.lengthOf(1);
        expect(result.items[0].price).to.equal(20);
    });

    it('should sort items', () => {
        const state = new SearchState(config);
        state.setSort('price', 'desc');
        const result = searchService.search(state);
        expect(result.items[0].price).to.equal(30);
        expect(result.items[2].price).to.equal(10);
    });
});
