const fs = require('fs');

let webrtc = fs.readFileSync('client/webrtc.js', 'utf8');
const regex = /fireCallbacks\(tipo, msg\);/;

if (regex.test(webrtc)) {
    webrtc = webrtc.replace(regex, "msg.senderId = peerId;\n      fireCallbacks(tipo, msg);");
    fs.writeFileSync('client/webrtc.js', webrtc);
    console.log("Patched webrtc.js with senderId");
}

let peer = fs.readFileSync('client/peer.js', 'utf8');

// Remove initAvatarPickers completely
peer = peer.replace(/function initAvatarPickers\(\) \{[\s\S]*?emojiPicker\.appendChild\(btn\);\s*\}\);\s*\}/, '');

// Fix connectToNetwork
peer = peer.replace(/if \(!selectedColor \|\| !selectedEmoji\) \{[\s\S]*?\} else \{[\s\S]*?\}/, `myColor = '#ffb3ad';\n        myAvatar = name.charAt(0).toUpperCase();`);

// Remove old chatForm submit private logic
peer = peer.replace(/const targetId = chatInput\.dataset\.privateTarget;[\s\S]*?\} else \{/, '');
// Fix closing braces for the else
peer = peer.replace(/appendMessage\(myNombre, msg, true, false\);\s*WebRTCEngine\.broadcast\(PROTOCOL\.CHAT, \{ text: msg, nombre: myNombre \}\);\s*\}/, `appendMessage(myNombre, msg, true, false);\n            WebRTCEngine.broadcast(PROTOCOL.CHAT, { text: msg, nombre: myNombre });`);

// Update PROTOCOL.CHAT listener
peer = peer.replace(/WebRTCEngine\.onMessage\(PROTOCOL\.CHAT, \(data\) => \{[\s\S]*?\}\);/, `WebRTCEngine.onMessage(PROTOCOL.CHAT, (data) => {
        if (data.isPrivate) {
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
            
            const peerId = data.senderId;
            if (peerId) {
                if (!window.privateChats) window.privateChats = {};
                if (!window.privateChats[peerId]) window.privateChats[peerId] = [];
                window.privateChats[peerId].push({ sender: data.nombre, text: data.text, isSelf: false });
                
                if (window.activePrivateChatId === peerId) {
                    window.renderPrivateMessages(peerId);
                } else {
                    showToast(\`<span class="font-bold text-[#ce93d8]">\${data.nombre || 'Desconocido'}</span> te ha susurrado.\`);
                }
            }
        } else {
            appendMessage(data.nombre || 'Desconocido', data.text, false, false);
        }
    });`);

// Append new private chat logic at the end
const privateChatLogic = `
    window.privateChats = {}; 
    window.activePrivateChatId = null;

    window.startPrivateChat = (peerId, name) => {
        window.activePrivateChatId = peerId;
        const modal = document.getElementById('private-chat-modal');
        const title = document.getElementById('private-chat-title');
        const avatar = document.getElementById('private-chat-avatar');
        
        const peer = WebRTCEngine.getPeers().find(p => p.id === peerId);
        if (peer) {
            title.textContent = peer.nombre;
            avatar.textContent = peer.avatar || peer.nombre.charAt(0).toUpperCase();
            avatar.style.backgroundColor = peer.color ? peer.color + '20' : 'rgba(255,179,173,0.2)';
            avatar.style.color = peer.color || '#ffb3ad';
        } else {
            title.textContent = name;
            avatar.textContent = name.charAt(0).toUpperCase();
        }
        
        window.renderPrivateMessages(peerId);
        
        modal.classList.remove('opacity-0', 'pointer-events-none');
        modal.classList.add('opacity-100', 'pointer-events-auto');
        document.getElementById('private-chat-content').classList.remove('scale-95');
        document.getElementById('private-chat-content').classList.add('scale-100');
    };

    const closeBtn = document.getElementById('private-chat-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.activePrivateChatId = null;
            const modal = document.getElementById('private-chat-modal');
            modal.classList.remove('opacity-100', 'pointer-events-auto');
            modal.classList.add('opacity-0', 'pointer-events-none');
            document.getElementById('private-chat-content').classList.remove('scale-100');
            document.getElementById('private-chat-content').classList.add('scale-95');
        });
    }

    const privateChatForm = document.getElementById('private-chat-form');
    if (privateChatForm) {
        privateChatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('private-chat-input');
            const msg = input.value.trim();
            if (msg && window.activePrivateChatId) {
                if (!window.privateChats[window.activePrivateChatId]) window.privateChats[window.activePrivateChatId] = [];
                window.privateChats[window.activePrivateChatId].push({ sender: myNombre, text: msg, isSelf: true });
                
                WebRTCEngine.sendToPeer(window.activePrivateChatId, PROTOCOL.CHAT, { text: msg, nombre: myNombre, isPrivate: true });
                window.renderPrivateMessages(window.activePrivateChatId);
                input.value = '';
            }
        });
    }

    window.renderPrivateMessages = function(peerId) {
        const container = document.getElementById('private-chat-messages');
        if (!container) return;
        const messages = window.privateChats[peerId] || [];
        container.innerHTML = messages.map(m => {
            const bgClass = m.isSelf ? 'bg-gradient-to-br from-primary-container to-[#d63b38] text-white rounded-2xl rounded-br-md' : 'glass-card-solid text-on-surface rounded-2xl rounded-bl-md border border-outline-variant/30';
            const alignClass = m.isSelf ? 'items-end self-end' : 'items-start self-start';
            const senderClass = m.isSelf ? 'hidden' : 'font-label-mono text-[10px] text-on-surface-variant/50 mb-1 ml-1 tracking-wide flex items-center';
            return \`<div class="flex flex-col max-w-[85%] \${alignClass}">
                    <div class="\${senderClass}"><span>\${m.sender}</span></div>
                    <div class="chat-bubble px-4 py-2.5 \${bgClass}">\${m.text}</div>
                </div>\`;
        }).join('');
        container.scrollTop = container.scrollHeight;
    };
`;

// Insert the new logic before the closing brace of DOMContentLoaded
peer = peer.replace(/}\);[\s\n]*$/, privateChatLogic + '\n});\n');

fs.writeFileSync('client/peer.js', peer);
console.log("Patched client/peer.js");
