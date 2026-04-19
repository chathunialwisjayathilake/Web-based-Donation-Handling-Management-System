const fs = require('fs');
const path = require('path');

const sampleHtmlPath = path.join(__dirname, '../sample/helpapeksha.com/helpapeksha.com/index.html');
const helpApekshaCssPath = path.join(__dirname, '../sample/helpapeksha.com/helpapeksha.com/wp-content/themes/redfluence_helpapeksha/dist/helpapeksha.css');
const indexCssDest = path.join(__dirname, 'src/index.css');
const frontendHtmlPath = path.join(__dirname, 'index.html');

let htmlContent = fs.readFileSync(sampleHtmlPath, 'utf8');

const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
let styles = '';
let match;
while ((match = styleRegex.exec(htmlContent)) !== null) {
    styles += match[1] + '\n\n';
}

const distCss = fs.readFileSync(helpApekshaCssPath, 'utf8');

// Combine and add font imports
const cssContent = `
@import url('https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,100..900;1,100..900&family=Lexend+Deca:wght@100..900&family=Raleway:ital,wght@0,100..900;1,100..900&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

${styles}

/* Dist CSS */
${distCss}
`;

fs.writeFileSync(indexCssDest, cssContent);

// Add empty resets and utility classes if necessary
console.log('Successfully extracted CSS to src/index.css');
