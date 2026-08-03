const fs = require('fs');

const css = `
.gold-card {
    border-color: rgba(255, 215, 0, 0.2);
}
.gold-card:hover {
    border-color: rgba(255, 215, 0, 0.5);
    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.2);
}

.silver-card {
    border-color: rgba(192, 192, 192, 0.2);
}
.silver-card:hover {
    border-color: rgba(192, 192, 192, 0.5);
    box-shadow: 0 10px 30px rgba(192, 192, 192, 0.2);
}

.bronze-card {
    border-color: rgba(205, 127, 50, 0.2);
}
.bronze-card:hover {
    border-color: rgba(205, 127, 50, 0.5);
    box-shadow: 0 10px 30px rgba(205, 127, 50, 0.2);
}
`;

fs.appendFileSync('frontend/css/style.css', css);
console.log('Added sponsor category CSS');
