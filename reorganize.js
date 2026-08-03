const fs = require('fs');
const path = require('path');

// 1. Create directories
const dirs = [
    'frontend',
    'frontend/css',
    'frontend/js',
    'frontend/public',
    'frontend/public/models',
    'frontend/public/images',
    'frontend/public/documents',
    'backend'
];

dirs.forEach(d => {
    if (!fs.existsSync(d)) {
        fs.mkdirSync(d, { recursive: true });
    }
});

// 2. Define files and their new destinations
const files = fs.readdirSync('.');

function moveFile(src, dest) {
    if (fs.existsSync(src)) {
        const stat = fs.statSync(src);
        if (stat.isFile()) {
            fs.renameSync(src, dest);
            console.log(`Moved ${src} -> ${dest}`);
        }
    }
}

// Separate files by type
files.forEach(file => {
    if (['node_modules', 'frontend', 'backend', '.git', 'pngs', 'assets'].includes(file)) return;
    
    const ext = path.extname(file).toLowerCase();
    
    if (['.html'].includes(ext)) {
        moveFile(file, `frontend/${file}`);
    } else if (['.css'].includes(ext)) {
        moveFile(file, `frontend/css/${file}`);
    } else if (file === 'script.js' || file === 'custom-select.js' || file === 'dashboard.js') {
        moveFile(file, `frontend/js/${file}`);
    } else if (['.fbx', '.f3z'].includes(ext) || file === 'fbx_strings.txt') {
        moveFile(file, `frontend/public/models/${file}`);
    } else if (['.png', '.jpg', '.jpeg', '.svg', '.webp'].includes(ext)) {
        moveFile(file, `frontend/public/images/${file}`);
    } else if (['.pdf', '.txt'].includes(ext) && file !== 'fbx_strings.txt') {
        moveFile(file, `frontend/public/documents/${file}`);
    } else if (file === 'server.js' || file === 'applications.json' || file === 'form_questions.json' || file === 'extract_questions.py') {
        moveFile(file, `backend/${file}`);
    }
});

// Move folders
if (fs.existsSync('pngs')) {
    fs.renameSync('pngs', 'frontend/public/images/pngs');
}
if (fs.existsSync('assets')) {
    fs.renameSync('assets', 'frontend/public/images/assets');
}

// 3. Update paths in HTML files
const htmlFiles = fs.readdirSync('frontend').filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
    const filePath = path.join('frontend', file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    content = content.replace(/href="style\.css"/g, 'href="css/style.css"');
    content = content.replace(/src="script\.js"/g, 'src="js/script.js"');
    content = content.replace(/src="custom-select\.js"/g, 'src="js/custom-select.js"');
    content = content.replace(/src="dashboard\.js"/g, 'src="js/dashboard.js"');
    
    content = content.replace(/src="TOP VIEW\.png"/g, 'src="public/images/TOP VIEW.png"');
    content = content.replace(/src="TOP VIEW \(1\)\.png"/g, 'src="public/images/TOP VIEW (1).png"');
    content = content.replace(/src="itu_logo_footer\.png"/g, 'src="public/images/itu_logo_footer.png"');
    content = content.replace(/src="pngs\//g, 'src="public/images/pngs/');
    
    content = content.replace(/data-model="AYAZ\.fbx"/g, 'data-model="public/models/AYAZ.fbx"');
    content = content.replace(/data-model="kayrav1\.fbx"/g, 'data-model="public/models/kayrav1.fbx"');
    content = content.replace(/data-model="kayrav2\.fbx"/g, 'data-model="public/models/kayrav2.fbx"');
    content = content.replace(/data-model="İHA\.fbx"/g, 'data-model="public/models/İHA.fbx"');
    content = content.replace(/data-model="İOS İKA\.fbx"/g, 'data-model="public/models/İOS İKA.fbx"');
    content = content.replace(/data-model="ARICAN2\.fbx"/g, 'data-model="public/models/ARICAN2.fbx"');

    fs.writeFileSync(filePath, content);
});

console.log("Reorganization completed!");
