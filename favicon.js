const fs = require('fs');
const path = require('path');

const files = ['index.html', 'takimimiz.html', 'ekipler.html', 'sponsorlarimiz.html', 'basvuru.html', 'dashboard.html'];
const faviconTag = '\n    <link rel="icon" type="image/png" href="public/images/TOP VIEW (1).png">\n';

files.forEach(file => {
    const filePath = path.join('frontend', file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        // Prevent duplicate favicon insertions
        if (!content.includes('rel="icon"')) {
            content = content.replace('</head>', faviconTag + '</head>');
            fs.writeFileSync(filePath, content);
            console.log('Added favicon to ' + file);
        }
    }
});
