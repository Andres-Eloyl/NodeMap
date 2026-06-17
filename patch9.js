const fs = require('fs');
const file = 'client/peer.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove "Personaliza tu perfil"
const pickerRegex = /<div class="mb-6 glass-card-solid p-4 rounded-2xl border border-primary\/20 bg-surface-variant\/20 max-w-3xl">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

if (pickerRegex.test(content)) {
    content = content.replace(pickerRegex, '');
    console.log("Removed pickers from html");
}

// 2. Add private chat modal before </body>
const privateChatModal = `
    <div id="private-chat-modal" class="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-300">
        <div class="absolute inset-0 bg-[#0c0b15]/80 backdrop-blur-sm" id="private-chat-backdrop" style="pointer-events: auto;"></div>
        <div id="private-chat-content" class="relative z-10 glass-card-solid border border-primary/30 shadow-2xl rounded-2xl flex flex-col m-4 w-[90%] max-w-[500px] h-[70vh] transform scale-95 transition-transform duration-300 pointer-events-auto">
            <div class="flex justify-between items-center p-4 border-b border-outline-variant/30 flex-none">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center font-bold text-primary text-lg" id="private-chat-avatar">A</div>
                    <div>
                        <h3 class="font-headline-md text-[16px] font-bold text-on-surface tracking-tight" id="private-chat-title">Usuario</h3>
                        <p class="font-label-mono text-[10px] text-on-surface-variant/70 uppercase tracking-widest">Chat Privado</p>
                    </div>
                </div>
                <button id="private-chat-close" class="w-8 h-8 rounded-full bg-surface-variant/30 hover:bg-surface-variant/50 flex items-center justify-center transition-colors">
                    <span class="material-symbols-outlined text-[18px]">close</span>
                </button>
            </div>
            <div class="flex-grow overflow-y-auto p-4 flex flex-col gap-3" id="private-chat-messages">
            </div>
            <div class="p-4 border-t border-outline-variant/30 flex-none">
                <form id="private-chat-form" class="flex gap-2">
                    <input autocomplete="off" class="input-field flex-grow bg-surface-variant/20 border border-outline-variant/30 rounded-xl px-4 h-[44px] text-[14px]" id="private-chat-input" placeholder="Escribe un mensaje privado..." type="text"/>
                    <button class="btn-primary rounded-xl px-4 h-[44px] flex items-center justify-center transition-transform hover:scale-105 active:scale-95" type="submit">
                        <span class="material-symbols-outlined text-[18px]">send</span>
                    </button>
                </form>
            </div>
        </div>
    </div>
</body>`;

if (!content.includes('private-chat-modal')) {
    content = content.replace('</body>', privateChatModal);
    console.log("Added private chat modal");
}

fs.writeFileSync(file, content);
