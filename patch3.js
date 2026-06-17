const fs = require('fs');
const file = 'client/peer.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /function updateUI\(\) \{[\s\S]*?\}\)\.join\(''\);\s*\}/;

const replacement = `function updateUI() {
        if (!myNombre) return;
        let peers = WebRTCEngine.getPeers().filter(p => p.nombre !== "Dashboard" && p.nombre !== "Organizador");
        
        const selfData = {
            id: WebRTCEngine.getMyId() || 'self',
            nombre: myNombre + " (Tú)",
            zona: myZone,
            color: myColor,
            avatar: myAvatar,
            isSelf: true
        };
        const allListNodes = [selfData, ...peers];

        nodesList.innerHTML = allListNodes.map(peer => {
            const lat = peer.isSelf ? '0' : (WebRTCEngine.getLatency(peer.id) || '---');
            const chatBtn = peer.isSelf ? '' : \`
                <button onclick="window.startPrivateChat('\${peer.id}', '\${peer.nombre}')" class="bg-primary/20 hover:bg-primary/40 border border-primary/50 text-primary p-2 rounded-xl transition-all shadow-sm">
                    <span class="material-symbols-outlined text-[16px]">chat</span>
                </button>
            \`;
            return \`
                <div class="glass-card-solid flex items-center justify-between p-4 rounded-2xl hover:border-primary/30 transition-all duration-200 \${peer.isSelf ? 'border border-primary/40 bg-primary/5' : ''}">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background-color: \${peer.color ? peer.color + '20' : 'rgba(255,255,255,0.1)'};">
                            <span class="text-[20px]">\${peer.avatar || '👤'}</span>
                        </div>
                        <div>
                            <div class="font-body-md text-on-surface font-medium text-[14px]" style="color: \${peer.color || '#fff'}">\${peer.nombre}</div>
                            <div class="font-label-mono text-[10px] text-on-surface-variant/50 mt-0.5 uppercase tracking-[0.08em]">\${peer.id.substring(0,6)} · \${peer.zona || 'Desconocida'}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        \${chatBtn}
                        <div class="badge-chip px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <span class="material-symbols-outlined text-[14px]">speed</span>
                            <span>\${lat}ms</span>
                        </div>
                    </div>
                </div>
            \`;
        }).join('');
    }`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content);
    console.log("Patched successfully!");
} else {
    console.log("Regex did not match.");
}
