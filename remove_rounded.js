const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

const targetDirs = [
    path.join(__dirname, 'client-react', 'src'),
    path.join(__dirname, 'client')
];

targetDirs.forEach(dir => {
    walkDir(dir, (filePath) => {
        if (filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.html') || filePath.endsWith('.css')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let originalContent = content;
            // Remove rounded classes
            content = content.replace(/\brounded(?:-[a-zA-Z0-9_\[\]-]+)?\b/g, '');
            // Fix spaces inside classNames and class attributes
            // content = content.replace(/  +/g, ' '); // Be careful not to break other formatting
            
            // Re-enforce Montserrat in HTML files where other fonts might be hardcoded in style tags or font imports
            if (filePath.endsWith('.html')) {
                 content = content.replace(/font-family:\s*['"]?Space Grotesk['"]?[^;]*;/g, "font-family: 'Montserrat', sans-serif;");
                 content = content.replace(/font-family:\s*['"]?JetBrains Mono['"]?[^;]*;/g, "font-family: 'Montserrat', sans-serif;");
                 content = content.replace(/font-family:\s*['"]?Manrope['"]?[^;]*;/g, "font-family: 'Montserrat', sans-serif;");
            }
            if (filePath.endsWith('display.css') || filePath.endsWith('peer.html')) {
                 content = content.replace(/font-family:\s*['"]?JetBrains Mono['"]?[^;]*;/g, "font-family: 'Montserrat', sans-serif;");
            }

            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Updated ${filePath}`);
            }
        }
    });
});
