const fs = require('fs');
const p = 'src/index.css';
let css = fs.readFileSync(p, 'utf8');
css = css.replace(/@charset "UTF-8";/g, '');
fs.writeFileSync(p, css);
console.log('Fixed charset error.');
