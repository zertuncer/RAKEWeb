const fs = require('fs');
const path = require('path');

const files = ['index.html', 'takimimiz.html', 'ekipler.html', 'sponsorlarimiz.html', 'basvuru.html', 'dashboard.html'];

files.forEach(file => {
    const filePath = path.join('frontend', file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/href="public\/images\/TOP VIEW \(1\)\.png"/g, 'href="public/images/favicon.png"');
        fs.writeFileSync(filePath, content);
    }
});
