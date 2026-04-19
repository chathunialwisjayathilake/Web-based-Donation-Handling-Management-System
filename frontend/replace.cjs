const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content.replace(/rgba\(241,\s*54,\s*157/g, 'rgba(230, 57, 70');
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent);
                console.log('Updated', fullPath);
            }
        }
    });
}
replaceInDir(path.join(__dirname, 'src'));
