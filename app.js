// Beispiel-Daten (Ersatz für deine data.json)
const allItems = Array.from({ length: 120 }, (_, i) => ({
    id: i,
    name: i % 2 === 0 ? `Hose ${i}` : `Shirt ${i}`,
    color: ['Rot', 'Blau', 'Grün'][i % 3],
    price: Math.floor(Math.random() * 150) + 20,
    size: Math.floor(Math.random() * 30) + 30
}));

const grid = document.getElementById('item-grid');
const info = document.getElementById('results-info');

// Aktueller Filter-Zustand
const filters = {
    search: '',
    colors: [],
    maxPrice: 200,
    maxSize: 60
};

function render() {
    const filtered = allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(filters.search.toLowerCase());
        const matchesColor = filters.colors.length === 0 || filters.colors.includes(item.color);
        const matchesPrice = item.price <= filters.maxPrice;
        const matchesSize = item.size <= filters.maxSize;
        return matchesSearch && matchesColor && matchesPrice && matchesSize;
    });

    info.innerText = `${filtered.length} Ergebnisse gefunden`;
    grid.innerHTML = filtered.map(item => `
        <div class="card">
            <strong>${item.name}</strong><br>
            <small>Farbe: ${item.color} | Preis: ${item.price}€ | Größe: ${item.size}</small>
        </div>
    `).join('');
}

// Event-Listener für Shoelace Komponenten
document.getElementById('search-input').addEventListener('sl-input', e => {
    filters.search = e.target.value;
    render();
});

document.getElementById('color-filter').addEventListener('sl-change', e => {
    filters.colors = e.target.value; // Shoelace Select gibt bei multiple ein Array zurück
    render();
});

document.getElementById('price-filter').addEventListener('sl-input', e => {
    filters.maxPrice = e.target.value;
    document.getElementById('price-display').innerText = `${e.target.value} €`;
    render();
});

document.getElementById('size-filter').addEventListener('sl-input', e => {
    filters.maxSize = e.target.value;
    document.getElementById('size-display').innerText = `Größe: ${e.target.value}`;
    render();
});

// Initiales Rendern
render();