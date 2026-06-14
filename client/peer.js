document.addEventListener("DOMContentLoaded", () => {
    // --- UI Elements ---
    const screenEntry = document.getElementById('screen-entry');
    const screenZone = document.getElementById('screen-zone');
    const screenMain = document.getElementById('screen-main');
    
    const inputNickname = document.getElementById('nickname');
    const btnEnter = document.getElementById('btn-enter');
    const btnLogout = document.getElementById('btn-logout');
    const btnChangeZone = document.getElementById('btn-change-zone');
    const zoneButtons = document.querySelectorAll('.zone-btn');
    const navTabs = document.querySelectorAll('.nav-tab');
    
    const currentZoneDisplay = document.getElementById('current-zone-display');
    const nodesList = document.getElementById('nodes-list');
    const mapCanvas = document.getElementById('map-canvas');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');

    // --- State ---
    let myNombre = "";
    let myZone = "";
    let latencyInterval = null;

    // --- Navigation Logic ---
    function showScreen(screenEl) {
        screenEntry.classList.add('view-hidden');
        screenZone.classList.add('view-hidden');
        screenMain.classList.add('view-hidden');
        screenEl.classList.remove('view-hidden');
    }

    function switchTab(targetId) {
        ['tab-map', 'tab-nodes', 'tab-chat'].forEach(id => {
            document.getElementById(id).classList.add('view-hidden');
        });
        document.getElementById(targetId).classList.remove('view-hidden');
        
        navTabs.forEach(tab => {
            if(tab.dataset.target === targetId) {
                tab.classList.replace('text-on-surface-variant', 'text-primary');
                tab.classList.replace('hover:bg-surface-variant/50', 'bg-primary-container/20');
                tab.classList.add('active');
                tab.querySelector('span.material-symbols-outlined').style.fontVariationSettings = "'FILL' 1";
            } else {
                tab.classList.replace('text-primary', 'text-on-surface-variant');
                tab.classList.replace('bg-primary-container/20', 'hover:bg-surface-variant/50');
                tab.classList.remove('active');
                tab.querySelector('span.material-symbols-outlined').style.fontVariationSettings = "'FILL' 0";
            }
        });

        if(targetId === 'tab-chat') scrollToBottomChat();
    }

    // --- WebRTC Logic ---
    function connectToNetwork(name, zone) {
        myNombre = name;
        myZone = zone;
        currentZoneDisplay.textContent = zone.toUpperCase();
        
        // Connect WebRTC Engine
        WebRTCEngine.conectar(name, zone);

        // Update UI
        chatMessages.innerHTML = `<div class="text-center font-label-mono text-label-mono text-on-surface-variant my-2 opacity-50">Sistema: Conectado a ${zone}</div>`;
        showScreen(screenMain);
        switchTab('tab-map');

        // Setup latencies
        if (latencyInterval) clearInterval(latencyInterval);
        latencyInterval = setInterval(updateUI, 2000);
        updateUI();
    }

    function updateUI() {
        if (!myNombre) return;
        const peers = WebRTCEngine.getPeers();
        
        // Update Nodes List
        if (peers.length === 0) {
            nodesList.innerHTML = `<div class="text-center text-on-surface-variant mt-4 font-label-mono">Buscando usuarios...</div>`;
        } else {
            nodesList.innerHTML = peers.map(peer => {
                const lat = WebRTCEngine.getLatency(peer.id) || '---';
                return `
                    <div class="layer-1 flex items-center justify-between p-4 rounded-lg border border-outline-variant hover:border-primary/50 transition-colors">
                        <div class="flex items-center gap-4">
                            <div class="w-3 h-3 rounded-full bg-secondary shadow-[0_0_8px_rgba(105,216,212,0.6)] animate-pulse"></div>
                            <span class="material-symbols-outlined text-secondary text-2xl">person</span>
                            <div>
                                <div class="font-body-lg text-on-surface font-medium">${peer.nombre}</div>
                                <div class="font-label-mono text-label-mono text-on-surface-variant mt-1 uppercase tracking-wider">ID: ${peer.id.substring(0,6)} • ${peer.zona || 'Desconocida'}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-label-mono text-primary flex items-center gap-1 justify-end">
                                <span class="material-symbols-outlined text-[16px]">speed</span>
                                <span>${lat}ms</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Update Map
        const mapCanvas = document.getElementById('map-canvas');
        if (!mapCanvas) return;

        // The central stairs node (red dot) MUST stay fixed
        const stairsNode = document.createElement('div');
        stairsNode.className = "absolute w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center map-zone-glow z-10 backdrop-blur-sm pointer-events-auto";
        stairsNode.style.left = "50%";
        stairsNode.style.top = "53%";
        stairsNode.style.transform = "translate(-50%, -50%)";
        stairsNode.innerHTML = `<span class="material-symbols-outlined text-primary">my_location</span>`;

        mapCanvas.innerHTML = '';
        mapCanvas.appendChild(stairsNode);

        // Include myself in the map
        const allNodes = [...peers, { id: myNombre + '-self', nombre: myNombre + " (Tú)", zona: myZone, isSelf: true }];

        allNodes.forEach((peer, i) => {
            const node = document.createElement('div');
            
            const coords = zoneCoordinates[peer.zona] || { topMin: 45, topMax: 55, leftMin: 45, leftMax: 55 };
            const hash = Math.abs(peer.id.hashCode());
            const top = coords.topMin + (hash % (coords.topMax - coords.topMin));
            const left = coords.leftMin + ((hash >> 2) % (coords.leftMax - coords.leftMin));

            const animClass = ['animate-walk', 'animate-walk-slow', 'animate-walk-fast'][hash % 3];

            node.className = `absolute w-10 h-10 rounded-full border ${peer.isSelf ? 'border-primary bg-primary/90' : 'border-secondary bg-surface-variant/90'} backdrop-blur-md flex items-center justify-center z-10 shadow-lg ${animClass}`;
            node.style.top = `${top}%`;
            node.style.left = `${left}%`;
            node.innerHTML = `
                <span class="material-symbols-outlined ${peer.isSelf ? 'text-on-primary' : 'text-secondary'} text-sm">person</span>
                <div class="absolute -bottom-5 whitespace-nowrap font-label-mono text-[10px] text-on-surface-variant bg-surface/80 px-1 rounded">${peer.nombre}</div>
            `;
            mapCanvas.appendChild(node);
        });
    }

    String.prototype.hashCode = function() {
        var hash = 0, i, chr;
        if (this.length === 0) return hash;
        for (i = 0; i < this.length; i++) {
          chr   = this.charCodeAt(i);
          hash  = ((hash << 5) - hash) + chr;
          hash |= 0;
        }
        return hash;
    };

    function appendMessage(sender, text, isSelf) {
        const alignClass = isSelf ? 'self-end' : 'self-start';
        const bgClass = isSelf ? 'bg-primary-container text-on-primary-container rounded-tr-none' : 'bg-surface-container-high text-on-surface rounded-tl-none border border-outline-variant';
        const senderClass = isSelf ? 'hidden' : 'font-label-mono text-[10px] text-on-surface-variant mb-1 ml-1';
        
        const msgEl = document.createElement('div');
        msgEl.className = `flex flex-col max-w-[80%] ${alignClass}`;
        msgEl.innerHTML = `
            <span class="${senderClass}">${sender}</span>
            <div class="px-4 py-3 rounded-lg text-sm ${bgClass}">
                ${text}
            </div>
        `;
        chatMessages.appendChild(msgEl);
        scrollToBottomChat();
    }

    function scrollToBottomChat() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- WebRTC Event Hooks ---
    WebRTCEngine.onMessage(PROTOCOL.CHAT, (data) => {
        appendMessage(data.nombre || 'Desconocido', data.text, false);
    });

    // --- UI Event Listeners ---
    inputNickname.addEventListener('input', (e) => {
        btnEnter.disabled = e.target.value.trim().length < 2;
    });

    btnEnter.addEventListener('click', () => {
        const name = inputNickname.value.trim();
        if(name.length >= 2) {
            myNombre = name;
            showScreen(screenZone);
        }
    });

    zoneButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            connectToNetwork(myNombre, btn.dataset.zone);
        });
    });

    btnLogout.addEventListener('click', () => {
        if(confirm('¿Salir de NodeMap?')) {
            WebRTCEngine.desconectar();
            if(latencyInterval) clearInterval(latencyInterval);
            myNombre = "";
            myZone = "";
            inputNickname.value = '';
            showScreen(screenEntry);
        }
    });

    btnChangeZone.addEventListener('click', () => {
        WebRTCEngine.desconectar();
        showScreen(screenZone);
    });

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.target);
        });
    });

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = chatInput.value.trim();
        if(msg) {
            appendMessage(myNombre, msg, true);
            chatInput.value = '';
            // Send to all peers via P2P
            WebRTCEngine.broadcast(PROTOCOL.CHAT, { text: msg, nombre: myNombre });
        }
    });

    // Start
    showScreen(screenEntry);
});
