const fs = require('fs');
const file = 'client/peer.html';
let content = fs.readFileSync(file, 'utf8');

const pickerBlock = `        <div class="flex flex-col gap-3">
            <label class="font-label-mono text-[11px] tracking-[0.08em] text-on-surface-variant/80 uppercase">Elige tu Avatar</label>
            
            <!-- Emoji Picker -->
            <div class="flex overflow-x-auto gap-2 pb-2 hide-scrollbar" id="emoji-picker">
                <!-- Emojis will be injected here via JS -->
            </div>
            
            <!-- Color Picker -->
            <div class="flex overflow-x-auto gap-2 pb-2 hide-scrollbar" id="color-picker">
                <!-- Colors will be injected here via JS -->
            </div>
        </div>`;

// Delete from screen-entry
const regex1 = /<div class="flex flex-col gap-3">\s*<label class="font-label-mono text-\[11px\] tracking-\[0\.08em\] text-on-surface-variant\/80 uppercase">Elige tu Avatar<\/label>\s*<!-- Emoji Picker -->\s*<div class="flex overflow-x-auto gap-2 pb-2 hide-scrollbar" id="emoji-picker">\s*<!-- Emojis will be injected here via JS -->\s*<\/div>\s*<!-- Color Picker -->\s*<div class="flex overflow-x-auto gap-2 pb-2 hide-scrollbar" id="color-picker">\s*<!-- Colors will be injected here via JS -->\s*<\/div>\s*<\/div>/;

if (regex1.test(content)) {
    content = content.replace(regex1, '');
} else {
    console.log("Could not find picker block in screen-entry.");
}

// Inject into tab-nodes
const targetTabNodes = `<h2 class="font-headline-lg text-xl md:text-[24px] font-bold text-on-surface tracking-tight mb-4 md:mb-6 flex-none">Usuarios en mi Zona</h2>`;
const replacementTabNodes = `<h2 class="font-headline-lg text-xl md:text-[24px] font-bold text-on-surface tracking-tight mb-4 md:mb-6 flex-none">Usuarios en mi Zona</h2>
            <div class="mb-6 glass-card-solid p-4 rounded-2xl border border-primary/20 bg-surface-variant/20 max-w-3xl">
                <h3 class="font-label-mono text-[11px] tracking-[0.08em] text-on-surface-variant/80 uppercase mb-3">Personaliza tu perfil</h3>
                <div class="flex flex-col gap-3">
                    <div class="flex overflow-x-auto gap-2 pb-2 hide-scrollbar" id="emoji-picker"></div>
                    <div class="flex overflow-x-auto gap-2 pb-2 hide-scrollbar" id="color-picker"></div>
                </div>
            </div>`;

if (content.includes(targetTabNodes) && !content.includes('Personaliza tu perfil')) {
    content = content.replace(targetTabNodes, replacementTabNodes);
    fs.writeFileSync(file, content);
    console.log("Patched client/peer.html");
} else {
    console.log("Could not find tab-nodes target or already patched.");
}
