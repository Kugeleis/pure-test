# Pure-Test: A No-Build Web App

A lightweight, faceted search prototype built using [Shoelace](https://shoelace.style/), [ItemsJS](https://github.com/itemsjs/itemsjs), and pure JavaScript, designed to work directly in the browser without any build tools.

## Philosophy: No Build Step

This project demonstrates how modern web development can be done without the complexity of `npm`, `webpack`, `vite`, or `babel`. By leveraging modern browser features and CDNs, we achieve a rapid development cycle with zero configuration.

### Key Features

- **No NPM/Node.js:** No `node_modules` or `package.json` required. Just open `index.html` in a browser.
- **Shoelace via CDN:** We use the Shoelace component library via their autoloader CDN.
- **Native ESM:** Modern JavaScript module syntax works directly in the browser.
- **Config-Driven:** Almost all aspects of the UI and search logic are controlled via an external `config.json` file.

## Configuration

The application is fully customizable through `config.json`. This separation of configuration from code allows for rapid rebranding and adaptation to different data sources.

### Core Settings

- `apiUrl`: The endpoint to fetch your JSON data from.
- `searchableFields`: Which fields the full-text search should look into.
- `itemsPerPage`: Maximum number of results to display.

### UI Settings (`ui`)

- `shopName`: Displays your brand in the header.
- `title`: Sets the document `<title>`.
- `navLinks`: Defines the navigation buttons in the header.
- `labels`: A comprehensive map for all UI text, allowing for easy translation or terminology changes (e.g., `resultsCount`, `searchPlaceholder`, `resetButton`).
- `productCard`: Map your API's field names to the product card UI. Supports nested paths (e.g., `dimensions.width`).

### Search Facets (`facets`)

Define your filters in the sidebar.

- `type`: Supports `discrete` (multiselect), `range-dual` (dual-handle slider), `range-min`, and `range-max`.
- `conjunction`: Set to `false` for **OR** logic (default for discrete) or `true` for **AND** logic.
- `group`: Group filters together under an accordion-style header.

### Sorting (`sortOptions`)

Define the sorting criteria available to users. The `key` should match a field in your data, or use `relevance` for the default ItemsJS ranking.

## Getting Started

1. **Clone the repository.**
2. **Customize `config.json`** to point to your data source and define your facets.
3. **Open `index.html`** in a browser.

*Note: Due to browser security restrictions on ESM modules, you should use a local development server (like VS Code's "Live Server") rather than opening the file directly from the filesystem.*
