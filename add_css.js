const fs = require('fs');

const css = `

/* Sponsors Grid */
.sponsors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
}

.sponsor-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    padding: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
}

.sponsor-card:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.sponsor-card img {
    max-width: 100%;
    max-height: 100px;
    object-fit: contain;
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
}
`;

fs.appendFileSync('frontend/css/style.css', css);
console.log('Added sponsors CSS');
