const fs = require('fs');
const file = 'shared/protocol.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('PROFILE_UPDATE')) {
    content = content.replace(
        /REPLAY_DATA:\s*"replay-data",/,
        `REPLAY_DATA: "replay-data",
  PROFILE_UPDATE: "profile-update",`
    );
    fs.writeFileSync(file, content);
    console.log("Patched shared/protocol.js");
}
