const fs = require('fs');
const file = 'client/webrtc.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('PROTOCOL.PROFILE_UPDATE')) {
    content = content.replace(
        /fireCallbacks\(tipo, msg\);/,
        `if (tipo === PROTOCOL.PROFILE_UPDATE) {
        const peer = peers.get(peerId);
        if (peer) {
            if (msg.color) peer.color = msg.color;
            if (msg.avatar) peer.avatar = msg.avatar;
        }
      }
      fireCallbacks(tipo, msg);`
    );
    fs.writeFileSync(file, content);
    console.log("Patched client/webrtc.js");
}
