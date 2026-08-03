const fs = require('fs');

let content = fs.readFileSync('frontend/css/style.css', 'utf8');
const index = content.indexOf('/* Sponsors Grid */');
if (index !== -1) {
    content = content.substring(0, index);
}

const newCss = `/* Sponsors Grid */
.sponsors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
    justify-content: center;
}

.sponsor-card {
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none !important;
    border: none !important;
    box-shadow: none !important;
    cursor: default;
    pointer-events: none;
}

.sponsor-card:hover {
    transform: none !important;
    background: none !important;
    border: none !important;
    box-shadow: none !important;
}

.sponsor-card img {
    max-width: 100%;
    max-height: 80px;
    object-fit: contain;
    filter: brightness(0) invert(1);
    opacity: 0.85;
}
`;

fs.writeFileSync('frontend/css/style.css', content + newCss);
console.log('Done - no hover on sponsors');
