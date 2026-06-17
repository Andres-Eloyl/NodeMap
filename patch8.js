const fs = require('fs');
const file = 'client/peer.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix startPrivateChat
const chatRegex = /switchTab\('chat'\);/;
if (chatRegex.test(content)) {
    content = content.replace(chatRegex, "switchTab('tab-chat');");
} else {
    console.log("Could not find switchTab('chat')");
}

// 2. Fix initAvatarPickers
const initPickersRegex = /function initAvatarPickers\(\) \{[\s\S]*?emojiPicker\.appendChild\(btn\);\s*\}\);\s*\}/;

const replacementPickers = `function initAvatarPickers() {
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
                if (WebRTCEngine.getMyId()) {
                    myColor = color;
                    WebRTCEngine.broadcast(PROTOCOL.PROFILE_UPDATE, { color: myColor, avatar: myAvatar });
                    updateUI();
                }
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
                if (WebRTCEngine.getMyId()) {
                    myAvatar = emoji;
                    WebRTCEngine.broadcast(PROTOCOL.PROFILE_UPDATE, { color: myColor, avatar: myAvatar });
                    updateUI();
                }
            };
            emojiPicker.appendChild(btn);
        });
    }`;

if (initPickersRegex.test(content)) {
    content = content.replace(initPickersRegex, replacementPickers);
    fs.writeFileSync(file, content);
    console.log("Patched client/peer.js");
} else {
    console.log("Could not find initAvatarPickers");
}
