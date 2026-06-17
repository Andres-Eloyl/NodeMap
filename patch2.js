const fs = require('fs');
const file = 'client/peer.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('spawnLocalReaction(')) {
    content = content.replace(
        /setTimeout\(\(\) => btn\.classList\.remove\('scale-150'\), 150\);\s*\}\);\s*\}\);\s*showScreen\(screenEntry\);\s*\}\);/,
        `setTimeout(() => btn.classList.remove('scale-150'), 150);
            spawnLocalReaction(emoji);
        });
    });

    function spawnLocalReaction(emoji) {
        const el = document.createElement('div');
        el.className = 'fixed text-4xl pointer-events-none z-[9999]';
        el.innerText = emoji;
        el.style.left = Math.random() * 80 + 10 + '%';
        el.style.bottom = '-50px';
        const animName = 'floatUp' + Date.now();
        const style = document.createElement('style');
        style.innerText = \`
            @keyframes \${animName} {
                0% { transform: translateY(0) scale(0.8); opacity: 0; }
                10% { transform: translateY(-20px) scale(1.2); opacity: 1; }
                20% { transform: translateY(-40px) scale(1); opacity: 1; }
                80% { transform: translateY(-350px) scale(1); opacity: 0.8; }
                100% { transform: translateY(-400px) scale(0.8); opacity: 0; }
            }
        \`;
        document.head.appendChild(style);
        el.style.animation = \`\${animName} 3s ease-out forwards\`;
        document.body.appendChild(el);
        setTimeout(() => {
            el.remove();
            style.remove();
        }, 3000);
    }

    initAvatarPickers();
    showScreen(screenEntry);
});`
    );
    fs.writeFileSync(file, content);
    console.log("Patched successfully!");
} else {
    console.log("Already patched.");
}
