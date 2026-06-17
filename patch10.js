const fs = require('fs');

// 1. shared/protocol.js
let protocol = fs.readFileSync('shared/protocol.js', 'utf8');
if (protocol.includes('PROFILE_UPDATE')) {
    protocol = protocol.replace(/PROFILE_UPDATE: "profile-update",\s*/, '');
    fs.writeFileSync('shared/protocol.js', protocol);
    console.log("Cleaned protocol.js");
}

// 2. client/webrtc.js
let webrtc = fs.readFileSync('client/webrtc.js', 'utf8');
const updateRegex = /if \(tipo === PROTOCOL\.PROFILE_UPDATE\) \{[\s\S]*?\}\s*\}/;
if (updateRegex.test(webrtc)) {
    webrtc = webrtc.replace(updateRegex, '');
    fs.writeFileSync('client/webrtc.js', webrtc);
    console.log("Cleaned webrtc.js");
}
