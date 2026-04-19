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

## Theming and Styling

### 1. Changing the Theme (Light/Dark)
Shoelace supports light and dark themes out of the box. 
- To change the theme, update the `<link>` in `index.html` to point to the desired theme (e.g., `dark.css` instead of `light.css`).
- Update the `class` on the `<html>` tag to match: `<html class="sl-theme-dark">`.

### 2. Customizing Colors
You can easily change the primary color of the entire site by overriding Shoelace's design tokens in `styles.css`. To change the "brand" color, update the primary color palette in the `:root` block:

```css
:root {
    --sl-color-primary-50: #f0f9ff;
    --sl-color-primary-100: #e0f2fe;
    /* ... update all weights from 50 to 950 ... */
    --sl-color-primary-600: #0284c7; /* This is the main brand color */
}
```

We recommend using a tool like the [Shoelace Palette Generator](https://shoelace.style/tokens/color#customizing-colors) to generate the full set of variables for your custom color.

