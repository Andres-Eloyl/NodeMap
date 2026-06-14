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
                tab.classList.add('active');
                tab.querySelector('span.material-symbols-outlined').style.fontVariationSettings = "'FILL' 1";
            } else {
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
        chatMessages.innerHTML = `<div class="text-center font-label-mono text-[11px] text-on-surface-variant/40 my-2 tracking-wide">Sistema: Conectado a ${zone}</div>`;
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
            nodesList.innerHTML = `<div class="text-center text-on-surface-variant/50 mt-8 font-label-mono text-[12px] tracking-wide">Buscando usuarios en la red...</div>`;
        } else {
            nodesList.innerHTML = peers.map(peer => {
                const lat = WebRTCEngine.getLatency(peer.id) || '---';
                return `
                    <div class="glass-card-solid flex items-center justify-between p-4 rounded-2xl hover:border-primary/30 transition-all duration-200">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                                <span class="material-symbols-outlined text-secondary text-[20px]">person</span>
                            </div>
                            <div>
                                <div class="font-body-md text-on-surface font-medium text-[14px]">${peer.nombre}</div>
                                <div class="font-label-mono text-[10px] text-on-surface-variant/50 mt-0.5 uppercase tracking-[0.08em]">${peer.id.substring(0,6)} · ${peer.zona || 'Desconocida'}</div>
                            </div>
                        </div>
                        <div class="badge-chip px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <span class="material-symbols-outlined text-[14px]">speed</span>
                            <span>${lat}ms</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Update Map
        const mapCanvas = document.getElementById('map-canvas');
        if (!mapCanvas) return;

        // Waypoints definition for pathfinding (Human realistic movement)
        const waypoints = {
            'Zona A': [
                // Pasillo Izquierdo
                { id: 'p1', t: 10, l: 25, edges: ['p2', 'r1'] },
                { id: 'p2', t: 30, l: 25, edges: ['p1', 'p3', 'r2'] },
                { id: 'p3', t: 50, l: 25, edges: ['p2', 'p4', 'r3'] },
                { id: 'p4', t: 70, l: 25, edges: ['p3', 'p5', 'r4'] },
                { id: 'p5', t: 90, l: 25, edges: ['p4', 'r5'] },
                // Aulas
                { id: 'r1', t: 15, l: 12, edges: ['p1'] },
                { id: 'r2', t: 35, l: 12, edges: ['p2'] },
                { id: 'r3', t: 55, l: 12, edges: ['p3'] },
                { id: 'r4', t: 75, l: 12, edges: ['p4'] },
                { id: 'r5', t: 85, l: 12, edges: ['p5'] },
            ],
            'Zona B': [
                // Laboratorios Centro
                { id: 'c1', t: 15, l: 50, edges: ['c2', 'c6'] },
                { id: 'c2', t: 35, l: 50, edges: ['c1', 'c3', 'c7'] },
                { id: 'c3', t: 55, l: 50, edges: ['c2', 'c4'] },
                { id: 'c4', t: 75, l: 50, edges: ['c3', 'c5'] },
                { id: 'c5', t: 85, l: 50, edges: ['c4'] },
                // Lados
                { id: 'c6', t: 15, l: 38, edges: ['c1'] },
                { id: 'c7', t: 35, l: 62, edges: ['c2'] },
            ],
            'Zona C': [
                // Pasillo Derecho
                { id: 'pd1', t: 10, l: 75, edges: ['pd2', 'o1'] },
                { id: 'pd2', t: 30, l: 75, edges: ['pd1', 'pd3', 'o2'] },
                { id: 'pd3', t: 50, l: 75, edges: ['pd2', 'pd4', 'o3'] },
                { id: 'pd4', t: 70, l: 75, edges: ['pd3', 'pd5', 'o4'] },
                { id: 'pd5', t: 90, l: 75, edges: ['pd4', 'o5'] },
                // Oficinas
                { id: 'o1', t: 15, l: 88, edges: ['pd1'] },
                { id: 'o2', t: 35, l: 88, edges: ['pd2'] },
                { id: 'o3', t: 55, l: 88, edges: ['pd3'] },
                { id: 'o4', t: 75, l: 88, edges: ['pd4'] },
                { id: 'o5', t: 85, l: 88, edges: ['pd5'] },
            ]
        };

        // Initialize global state for nodes to keep them alive
        if (!window.peerNodesState) window.peerNodesState = {};

        const allNodesData = [...peers, { id: myNombre + '-self', nombre: myNombre + " (Tú)", zona: myZone, isSelf: true }];
        const activeIds = new Set(allNodesData.map(p => p.id));

        // 1. Remove disconnected nodes
        Object.keys(window.peerNodesState).forEach(id => {
            if (!activeIds.has(id)) {
                if (window.peerNodesState[id].interval) clearInterval(window.peerNodesState[id].interval);
                if (window.peerNodesState[id].domNode) window.peerNodesState[id].domNode.remove();
                delete window.peerNodesState[id];
            }
        });

        // 2. Add or Update nodes
        allNodesData.forEach(peer => {
            // If new peer OR peer changed zone, re-initialize their position
            if (!window.peerNodesState[peer.id] || window.peerNodesState[peer.id].zona !== peer.zona) {
                
                // Cleanup old state if exists (happens on zone change)
                if (window.peerNodesState[peer.id]) {
                    if (window.peerNodesState[peer.id].interval) clearInterval(window.peerNodesState[peer.id].interval);
                    if (window.peerNodesState[peer.id].domNode) window.peerNodesState[peer.id].domNode.remove();
                }

                // Create new DOM Node
                const node = document.createElement('div');
                node.className = `absolute w-9 h-9 rounded-xl border ${peer.isSelf ? 'border-primary/60 bg-primary/80' : 'border-secondary/40 bg-surface-container-high/90'} backdrop-blur-sm flex items-center justify-center z-10 shadow-md node-walking`;
                node.style.transform = 'translate(-50%, -50%)'; // Center properly
                node.innerHTML = `
                    <span class="material-symbols-outlined ${peer.isSelf ? 'text-white' : 'text-secondary'} text-[16px]">person</span>
                    <div class="absolute -bottom-5 whitespace-nowrap font-label-mono text-[9px] text-on-surface-variant/70 bg-surface/70 backdrop-blur-sm px-1.5 py-0.5 rounded-md">${peer.nombre}</div>
                `;
                mapCanvas.appendChild(node);

                // Set initial position randomly in their zone
                const zonePoints = waypoints[peer.zona] || waypoints['Zona A'];
                const startPt = zonePoints[Math.floor(Math.random() * zonePoints.length)];
                
                // Disable transition momentarily to snap to starting position instantly
                node.style.transition = 'none';
                node.style.top = `${startPt.t}%`;
                node.style.left = `${startPt.l}%`;
                
                // Re-enable smooth transition after snapping
                setTimeout(() => { node.style.transition = 'top 6s linear, left 6s linear'; }, 50);

                // Start human walking loop
                const interval = setInterval(() => {
                    const st = window.peerNodesState[peer.id];
                    if (!st) return;
                    
                    const points = waypoints[st.zona] || waypoints['Zona A'];
                    const currentPt = points.find(p => p.id === st.wpId);
                    
                    if (currentPt && currentPt.edges && currentPt.edges.length > 0) {
                        // Pick random connected waypoint
                        const nextId = currentPt.edges[Math.floor(Math.random() * currentPt.edges.length)];
                        const nextPt = points.find(p => p.id === nextId);
                        
                        if (nextPt) {
                            st.wpId = nextId;
                            // Add slight randomness (offset) so users in the same spot don't stack perfectly
                            const rT = nextPt.t + (Math.random() * 4 - 2);
                            const rL = nextPt.l + (Math.random() * 2 - 1);
                            st.domNode.style.top = `${rT}%`;
                            st.domNode.style.left = `${rL}%`;
                        }
                    }
                }, 6000 + Math.random() * 2000); // Move every 6-8s

                window.peerNodesState[peer.id] = { domNode: node, wpId: startPt.id, zona: peer.zona, interval };
            }
        });

        // 3. Ensure the central stairs indicator stays at the bottom layer
        if (!document.getElementById('map-center-indicator')) {
            const stairsNode = document.createElement('div');
            stairsNode.id = 'map-center-indicator';
            stairsNode.className = "absolute w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center map-zone-glow z-0 backdrop-blur-sm pointer-events-auto";
            stairsNode.style.left = "50%";
            stairsNode.style.top = "53%";
            stairsNode.style.transform = "translate(-50%, -50%)";
            stairsNode.innerHTML = `<span class="material-symbols-outlined text-primary">my_location</span>`;
            mapCanvas.prepend(stairsNode);
        }
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
        const bgClass = isSelf
            ? 'bg-gradient-to-br from-primary-container to-[#d63b38] text-white rounded-2xl rounded-br-md'
            : 'glass-card-solid text-on-surface rounded-2xl rounded-bl-md';
        const senderClass = isSelf ? 'hidden' : 'font-label-mono text-[10px] text-on-surface-variant/50 mb-1 ml-1 tracking-wide';
        
        const msgEl = document.createElement('div');
        msgEl.className = `flex flex-col max-w-[75%] ${alignClass}`;
        msgEl.innerHTML = `
            <span class="${senderClass}">${sender}</span>
            <div class="chat-bubble px-4 py-2.5 ${bgClass}">
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
        btnEnter.disabled = e.target.value.trim().length < 3;
    });

    btnEnter.addEventListener('click', () => {
        const name = inputNickname.value.trim();
        if(name.length >= 3) {
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
