const fs = require('fs');
const path = require('path');

// Move folders
if (fs.existsSync('pngs')) {
    fs.cpSync('pngs', 'frontend/public/images/pngs', { recursive: true });
    try { fs.rmSync('pngs', { recursive: true, force: true }); } catch (e) {}
}
if (fs.existsSync('assets')) {
    fs.cpSync('assets', 'frontend/public/images/assets', { recursive: true });
    try { fs.rmSync('assets', { recursive: true, force: true }); } catch (e) {}
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

    content = content.replace(/background-image:\s*url\(['"]?(.*?)['"]?\)/g, (match, p1) => {
        if (!p1.startsWith('http') && !p1.startsWith('public/')) {
            return `background-image: url('public/images/${p1}')`;
        }
        return match;
    });

    fs.writeFileSync(filePath, content);
});

console.log('Paths updated successfully!');
