const fs = require('fs');
const file = 'client/peer.js';
let content = fs.readFileSync(file, 'utf8');

// Patch 1: Pickers
content = content.replace(
    /function generateAvatar\(name\) \{[\s\S]*?return \{ color, avatar \};\s*\}/,
    `let selectedColor = null;
    let selectedEmoji = null;

    function initAvatarPickers() {
        const colorPicker = document.getElementById('color-picker');
        const emojiPicker = document.getElementById('emoji-picker');
        if(!colorPicker || !emojiPicker) return;

        AVATAR_COLORS.forEach(color => {
            const btn = document.createElement('button');
            btn.className = \`w-8 h-8 rounded-full flex-shrink-0 border-2 border-transparent transition-all hover:scale-110\`;
            btn.style.backgroundColor = color;
            btn.onclick = () => {
                Array.from(colorPicker.children).forEach(c => c.style.borderColor = 'transparent');
                btn.style.borderColor = '#fff';
                selectedColor = color;
            };
            colorPicker.appendChild(btn);
        });

        AVATAR_EMOJIS.forEach(emoji => {
            const btn = document.createElement('button');
            btn.className = \`w-8 h-8 rounded-full flex-shrink-0 bg-surface-variant/30 flex items-center justify-center text-lg transition-all hover:scale-110 hover:bg-surface-variant/50 border-2 border-transparent\`;
            btn.innerText = emoji;
            btn.onclick = () => {
                Array.from(emojiPicker.children).forEach(c => c.style.borderColor = 'transparent');
                btn.style.borderColor = '#fff';
                selectedEmoji = emoji;
            };
            emojiPicker.appendChild(btn);
        });
    }`
);

// Patch 2: connectToNetwork
content = content.replace(
    /const av = generateAvatar\(name\);\s*myColor = av\.color;\s*myAvatar = av\.avatar;/,
    `if (!selectedColor || !selectedEmoji) {
            let hash = name.hashCode();
            myColor = selectedColor || AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
            myAvatar = selectedEmoji || AVATAR_EMOJIS[Math.abs(hash) % AVATAR_EMOJIS.length];
        } else {
            myColor = selectedColor;
            myAvatar = selectedEmoji;
        }`
);

// Patch 3: Private chat UI
content = content.replace(
    `<div class="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                                <span class="material-symbols-outlined text-secondary text-[20px]">person</span>
                            </div>
                            <div>
                                <div class="font-body-md text-on-surface font-medium text-[14px]">\${peer.nombre}</div>
                                <div class="font-label-mono text-[10px] text-on-surface-variant/50 mt-0.5 uppercase tracking-[0.08em]">\${peer.id.substring(0,6)} · \${peer.zona || 'Desconocida'}</div>
                            </div>
                        </div>
                        <div class="badge-chip px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <span class="material-symbols-outlined text-[14px]">speed</span>
                            <span>\${lat}ms</span>
                        </div>`,
    `<div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background-color: \${peer.color ? peer.color + '20' : 'rgba(255,255,255,0.1)'};">
                                <span class="text-[20px]">\${peer.avatar || '👤'}</span>
                            </div>
                            <div>
                                <div class="font-body-md text-on-surface font-medium text-[14px]" style="color: \${peer.color || '#fff'}">\${peer.nombre}</div>
                                <div class="font-label-mono text-[10px] text-on-surface-variant/50 mt-0.5 uppercase tracking-[0.08em]">\${peer.id.substring(0,6)} · \${peer.zona || 'Desconocida'}</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="window.startPrivateChat('\${peer.id}', '\${peer.nombre}')" class="bg-primary/20 hover:bg-primary/40 border border-primary/50 text-primary p-2 rounded-xl transition-all shadow-sm">
                                <span class="material-symbols-outlined text-[16px]">chat</span>
                            </button>
                            <div class="badge-chip px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px]">speed</span>
                                <span>\${lat}ms</span>
                            </div>
                        </div>`
);

// Patch 4: spawnLocalReaction
content = content.replace(
    `            // local feedback
            btn.classList.add('scale-150');
            setTimeout(() => btn.classList.remove('scale-150'), 150);
        });
    });
    showScreen(screenEntry);
});`,
    `            // local feedback
            btn.classList.add('scale-150');
            setTimeout(() => btn.classList.remove('scale-150'), 150);
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
