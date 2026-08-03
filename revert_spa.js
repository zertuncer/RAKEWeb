const fs = require('fs');
const path = require('path');

// Read files
const eskiIndex = fs.readFileSync('eskiindex.html', 'utf8');
const sponsorHtml = fs.readFileSync('frontend/sponsorlarimiz.html', 'utf8');

// 1. Get the new sponsor section from frontend/sponsorlarimiz.html
const sponsorMatch = sponsorHtml.match(/<section id="sponsorlarimiz-section" class="takimimiz-page">[\s\S]*?<\/section>/);
let newSponsorSection = sponsorMatch ? sponsorMatch[0] : '';
// The original one had display: none
newSponsorSection = newSponsorSection.replace('class="takimimiz-page"', 'class="takimimiz-page" style="display: none;"');

// 2. Get the footer from frontend/sponsorlarimiz.html
const footerMatch = sponsorHtml.match(/<footer class="main-footer">[\s\S]*?<\/footer>/);
let footer = footerMatch ? footerMatch[0] : '';

// 3. Replace the old sponsor section in eskiIndex
let finalHtml = eskiIndex.replace(/<section id="sponsorlarimiz-section" class="takimimiz-page" style="display: none;">[\s\S]*?<\/section>/, newSponsorSection);

// 4. Inject the footer just before the component-panel (or right before script tags)
finalHtml = finalHtml.replace('<aside id="component-panel"', footer + '\n\n    <aside id="component-panel"');

// 5. Update image paths from root to public/images/
finalHtml = finalHtml.replace(/src="TOP VIEW/g, 'src="public/images/TOP VIEW');
finalHtml = finalHtml.replace(/src="itu_logo/g, 'src="public/images/itu_logo');
finalHtml = finalHtml.replace(/src="pngs\//g, 'src="public/images/pngs/');

// 6. Update CSS and JS paths
finalHtml = finalHtml.replace('href="style.css"', 'href="css/style.css"');
finalHtml = finalHtml.replace('src="script.js"', 'src="js/script.js"');
finalHtml = finalHtml.replace('src="custom-select.js"', 'src="js/custom-select.js"');
finalHtml = finalHtml.replace('href="favicon.png"', 'href="public/images/favicon.png"');

// 7. Write to frontend/index.html
fs.writeFileSync('frontend/index.html', finalHtml);
console.log('Successfully reverted index.html to SPA and injected modernized sections.');
