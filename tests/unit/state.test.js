import { SearchState } from '../../src/state.js';

const expect = chai.expect;

describe('SearchState', () => {
    let config;

    beforeEach(() => {
        config = {
            facets: {
                category: { type: 'discrete', title: 'Category' },
                price: { type: 'range-dual', title: 'Price', unit: '€' },
                rating: { type: 'range-min', title: 'Rating' }
            },
            sortOptions: [
                { key: 'relevance', label: 'Relevance' },
                { key: 'price', label: 'Price' }
            ]
        };
    });

    it('should initialize with default values', () => {
        const state = new SearchState(config);
        expect(state.query).to.equal('');
        expect(state.filters).to.deep.equal({});
        expect(state.sortBy).to.equal('relevance');
        expect(state.sortOrder).to.equal('asc');
    });

    it('should calculate ranges correctly', () => {
        const state = new SearchState(config);
        const items = [
            { price: 10, rating: 4 },
            { price: 20, rating: 5 },
            { price: 5, rating: 3 }
        ];
        state.calculateRanges(items);
        expect(state.itemRanges.price).to.deep.equal({ min: 5, max: 20 });
        expect(state.itemRanges.rating).to.deep.equal({ min: 3, max: 5 });
    });

    it('should reset to default values', () => {
        const state = new SearchState(config);
        const items = [
            { price: 10, rating: 4 }
        ];
        state.calculateRanges(items);
        state.setQuery('test');
        state.setFilter('category', ['electronics']);
        state.setSort('price', 'desc');

        state.reset();

        expect(state.query).to.equal('');
        expect(state.filters.category).to.deep.equal([]);
        expect(state.filters.price).to.deep.equal([10, 10]);
        expect(state.filters.rating).to.equal(4);
        expect(state.sortBy).to.equal('relevance');
        expect(state.sortOrder).to.equal('asc');
    });

    it('should set query correctly', () => {
        const state = new SearchState(config);
        state.setQuery('new query');
        expect(state.query).to.equal('new query');
    });

    it('should set filter correctly', () => {
        const state = new SearchState(config);
        state.setFilter('category', ['books']);
        expect(state.filters.category).to.deep.equal(['books']);
    });

    it('should set sort correctly', () => {
        const state = new SearchState(config);
        state.setSort('price', 'desc');
        expect(state.sortBy).to.equal('price');
        expect(state.sortOrder).to.equal('desc');
    });
});
