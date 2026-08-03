const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync('index.html', 'utf8');

// Helper to extract a section by ID
function extractSection(html, id) {
    const regex = new RegExp(`<section id="${id}"[\\s\\S]*?</section>\\s*(?=<!--|\\n\\s*<section|\\n\\s*<aside|\\n\\s*<script)`, 'i');
    const match = html.match(regex);
    return match ? match[0] : '';
}

// Extract sections
const takimimizSection = extractSection(indexHtml, 'takimimiz-section');
const ekiplerSection = extractSection(indexHtml, 'ekipler-section');
const basvuruSection = extractSection(indexHtml, 'basvuru-section');
const sponsorlarimizSection = extractSection(indexHtml, 'sponsorlarimiz-section');

// Remove extracted sections from index.html (we will save the new index.html later)
let newIndexHtml = indexHtml;
[takimimizSection, ekiplerSection, basvuruSection, sponsorlarimizSection].forEach(sec => {
    newIndexHtml = newIndexHtml.replace(sec, '');
});

// Update the header in indexHtml template
function generatePage(pageName, sectionContent, bodyClass) {
    let template = indexHtml;

    // Replace body tag
    template = template.replace(/<body[^>]*>/, `<body class="${bodyClass}">`);

    // We only want the header, the section, and the scripts.
    // Let's rip out everything inside body except header and scripts
    const bodyStart = template.indexOf('<body');
    const bodyStartEnd = template.indexOf('>', bodyStart) + 1;
    const scriptsStart = template.indexOf('<script src="custom-select.js">');
    const bodyEnd = template.indexOf('</body>');

    const headAndBodyStart = template.substring(0, bodyStartEnd);
    const scriptsAndEnd = template.substring(scriptsStart);

    const headerRegex = /<header id="main-header">[\s\S]*?<\/header>/;
    const headerMatch = template.match(headerRegex);
    let header = headerMatch ? headerMatch[0] : '';

    // Update header links
    header = header.replace(/href="#" class="nav-link active" data-nav="araclar"/g, `href="index.html" class="nav-link"`);
    header = header.replace(/href="#" class="nav-link" data-nav="araclar"/g, `href="index.html" class="nav-link"`);

    header = header.replace(/href="#" class="nav-link" data-nav="takimimiz"/g, `href="takimimiz.html" class="nav-link"`);
    header = header.replace(/href="#" class="nav-link" data-nav="ekipler"/g, `href="ekipler.html" class="nav-link"`);
    header = header.replace(/href="#" class="nav-link" data-nav="sponsorlarimiz"/g, `href="sponsorlarimiz.html" class="nav-link"`);
    header = header.replace(/href="#" class="nav-link" data-nav="basvuru"/g, `href="basvuru.html" class="nav-link"`);

    // Set active class
    const targetLink = `href="${pageName}.html" class="nav-link"`;
    header = header.replace(targetLink, `href="${pageName}.html" class="nav-link active"`);
    // Special case for araclar/index
    if (pageName === 'index') {
        header = header.replace(`href="index.html" class="nav-link"`, `href="index.html" class="nav-link active"`);
    }

    // Unhide the section
    let visibleSection = sectionContent.replace(/style="display:\s*none;?"/, '');

    // Clean up empty lines
    const finalHtml = headAndBodyStart + '\n    ' + header + '\n\n' + visibleSection + '\n\n' + scriptsAndEnd;

    fs.writeFileSync(`${pageName}.html`, finalHtml);
}

// Generate the subpages
generatePage('takimimiz', takimimizSection, 'page-takimimiz');
generatePage('ekipler', ekiplerSection, 'page-ekipler');
generatePage('sponsorlarimiz', sponsorlarimizSection, 'page-sponsorlarimiz');
generatePage('basvuru', basvuruSection, 'page-basvuru');

// Fix index.html header and body
let finalIndex = newIndexHtml;
const headerRegex = /<header id="main-header">[\s\S]*?<\/header>/;
const headerMatch = finalIndex.match(headerRegex);
let header = headerMatch ? headerMatch[0] : '';

header = header.replace(/href="#" class="nav-link active" data-nav="araclar"/g, `href="index.html" class="nav-link active"`);
header = header.replace(/href="#" class="nav-link" data-nav="araclar"/g, `href="index.html" class="nav-link active"`);
header = header.replace(/href="#" class="nav-link" data-nav="takimimiz"/g, `href="takimimiz.html" class="nav-link"`);
header = header.replace(/href="#" class="nav-link" data-nav="ekipler"/g, `href="ekipler.html" class="nav-link"`);
header = header.replace(/href="#" class="nav-link" data-nav="sponsorlarimiz"/g, `href="sponsorlarimiz.html" class="nav-link"`);
header = header.replace(/href="#" class="nav-link" data-nav="basvuru"/g, `href="basvuru.html" class="nav-link"`);

// Add home button logic to header buttons inside index.html too if they exist
finalIndex = finalIndex.replace(headerRegex, header);
fs.writeFileSync('index.html', finalIndex);

console.log("Pages separated successfully!");
