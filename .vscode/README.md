# Pure-Test: A No-Build Web App

A lightweight, faceted search prototype built using [Shoelace](https://shoelace.style/) and pure JavaScript, designed to work directly in the browser without any build tools.

## Philosophy: No Build Step

This project demonstrates how modern web development can be done without the complexity of `npm`, `webpack`, `vite`, or `babel`. By leveraging modern browser features and CDNs, we achieve a rapid development cycle with zero configuration.

### Key Features

- **No NPM/Node.js:** No `node_modules` or `package.json` required. Just open `index.html` in a browser.
- **Shoelace via CDN:** We use the Shoelace component library via their autoloader CDN. Components are loaded on-demand as they are used in the HTML.
- **Native ESM:** The application logic in `app.js` is loaded as a standard JavaScript module (`type="module"`), allowing for clean, modern syntax without a transpilation step.
- **CSS-in-HTML:** Styling is handled using standard CSS and Shoelace's design tokens (CSS variables), keeping everything self-contained.

### Benefits

- **Zero Setup:** Clone and run. No `npm install` or `npm run dev`.
- **Instant Feedback:** Every change is immediately reflected in the browser upon refresh.
- **Simplified Deployment:** Can be hosted on any static file server (GitHub Pages, Netlify, etc.) without a build pipeline.

## Getting Started

Simply open `index.html` in your favorite web browser. For the best experience, use a local development server like VS Code's "Live Server" extension to handle the ESM modules correctly.
