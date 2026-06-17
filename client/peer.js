document.addEventListener("DOMContentLoaded", () => {
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
    
    const btnToggleHeatmap = document.getElementById('btn-toggle-heatmap');
    const heatmapLeaderboard = document.getElementById('heatmap-leaderboard');
    const leaderboardList = document.getElementById('leaderboard-list');
    const blueprintContainer = document.getElementById('blueprint-container');
    let myNombre = "";
    let myZone = "";
    let myColor = "#ffb3ad";
    let myAvatar = "👤";
    let latencyInterval = null;
    let isHeatmapMode = false;
    let heatmapUIInterval = null;
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
    const AVATAR_COLORS = ['#ffb3ad', '#44e2cd', '#69d8d4', '#e4beba', '#ffdad6', '#87f4f0', '#62fae3', '#ab8986'];
    const AVATAR_EMOJIS = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵'];

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

    let selectedColor = null;
    let selectedEmoji = null;

    

    function connectToNetwork(name, zone) {
        myNombre = name;
        myZone = zone;
        myColor = '#ffb3ad';
        myAvatar = name.charAt(0).toUpperCase();
        currentZoneDisplay.textContent = zone.toUpperCase();
        WebRTCEngine.conectar(name, zone, myColor, myAvatar);
        chatMessages.innerHTML = `<div class="text-center font-label-mono text-[11px] text-on-surface-variant/40 my-2 tracking-wide">Sistema: Conectado a ${zone}</div>`;
        showScreen(screenMain);
        switchTab('tab-map');
        if (latencyInterval) clearInterval(latencyInterval);
        latencyInterval = setInterval(updateUI, 2000);
        updateUI();
        startHeatmapCRDT();
    }

    function updateUI() {
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
            const chatBtn = peer.isSelf ? '' : `
                <button onclick="window.startPrivateChat('${peer.id}', '${peer.nombre}')" class="bg-primary/20 hover:bg-primary/40 border border-primary/50 text-primary p-2 rounded-xl transition-all shadow-sm">
                    <span class="material-symbols-outlined text-[16px]">chat</span>
                </button>
            `;
            return `
                <div class="glass-card-solid flex items-center justify-between p-4 rounded-2xl hover:border-primary/30 transition-all duration-200 ${peer.isSelf ? 'border border-primary/40 bg-primary/5' : ''}">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background-color: ${peer.color ? peer.color + '20' : 'rgba(255,255,255,0.1)'};">
                            <span class="text-[20px]">${peer.avatar || '👤'}</span>
                        </div>
                        <div>
                            <div class="font-body-md text-on-surface font-medium text-[14px]" style="color: ${peer.color || '#fff'}">${peer.nombre}</div>
                            <div class="font-label-mono text-[10px] text-on-surface-variant/50 mt-0.5 uppercase tracking-[0.08em]">${peer.id.substring(0,6)} · ${peer.zona || 'Desconocida'}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        ${chatBtn}
                        <div class="badge-chip px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <span class="material-symbols-outlined text-[14px]">speed</span>
                            <span>${lat}ms</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        const mapCanvas = document.getElementById('map-canvas');
        if (!mapCanvas) return;
        const waypoints = {
            'Zona A': [
                { id: 'p1', t: 10, l: 25, edges: ['p2', 'r1'] },
                { id: 'p2', t: 30, l: 25, edges: ['p1', 'p3', 'r2'] },
                { id: 'p3', t: 50, l: 25, edges: ['p2', 'p4', 'r3'] },
                { id: 'p4', t: 70, l: 25, edges: ['p3', 'p5', 'r4'] },
                { id: 'p5', t: 90, l: 25, edges: ['p4', 'r5'] },
                { id: 'r1', t: 15, l: 12, edges: ['p1'] },
                { id: 'r2', t: 35, l: 12, edges: ['p2'] },
                { id: 'r3', t: 55, l: 12, edges: ['p3'] },
                { id: 'r4', t: 75, l: 12, edges: ['p4'] },
                { id: 'r5', t: 85, l: 12, edges: ['p5'] },
            ],
            'Zona B': [
                { id: 'c1', t: 15, l: 50, edges: ['c2', 'c6'] },
                { id: 'c2', t: 35, l: 50, edges: ['c1', 'c3', 'c7'] },
                { id: 'c3', t: 55, l: 50, edges: ['c2', 'c4'] },
                { id: 'c4', t: 75, l: 50, edges: ['c3', 'c5'] },
                { id: 'c5', t: 85, l: 50, edges: ['c4'] },
                { id: 'c6', t: 15, l: 38, edges: ['c1'] },
                { id: 'c7', t: 35, l: 62, edges: ['c2'] },
            ],
            'Zona C': [
                { id: 'pd1', t: 10, l: 75, edges: ['pd2', 'o1'] },
                { id: 'pd2', t: 30, l: 75, edges: ['pd1', 'pd3', 'o2'] },
                { id: 'pd3', t: 50, l: 75, edges: ['pd2', 'pd4', 'o3'] },
                { id: 'pd4', t: 70, l: 75, edges: ['pd3', 'pd5', 'o4'] },
                { id: 'pd5', t: 90, l: 75, edges: ['pd4', 'o5'] },
                { id: 'o1', t: 15, l: 88, edges: ['pd1'] },
                { id: 'o2', t: 35, l: 88, edges: ['pd2'] },
                { id: 'o3', t: 55, l: 88, edges: ['pd3'] },
                { id: 'o4', t: 75, l: 88, edges: ['pd4'] },
                { id: 'o5', t: 85, l: 88, edges: ['pd5'] },
            ]
        };
        if (!window.peerNodesState) window.peerNodesState = {};

        const allNodesData = [...peers, { id: myNombre + '-self', nombre: myNombre + " (Tú)", zona: myZone, isSelf: true, color: myColor, avatar: myAvatar }];
        const activeIds = new Set(allNodesData.map(p => p.id));
        Object.keys(window.peerNodesState).forEach(id => {
            if (!activeIds.has(id)) {
                if (window.peerNodesState[id].interval) clearInterval(window.peerNodesState[id].interval);
                if (window.peerNodesState[id].domNode) window.peerNodesState[id].domNode.remove();
                delete window.peerNodesState[id];
            }
        });
        allNodesData.forEach(peer => {
            if (!window.peerNodesState[peer.id] || window.peerNodesState[peer.id].zona !== peer.zona) {
                if (window.peerNodesState[peer.id]) {
                    if (window.peerNodesState[peer.id].interval) clearInterval(window.peerNodesState[peer.id].interval);
                    if (window.peerNodesState[peer.id].domNode) window.peerNodesState[peer.id].domNode.remove();
                }
                const node = document.createElement('div');
                node.className = `absolute w-9 h-9 rounded-xl border backdrop-blur-sm flex items-center justify-center z-10 shadow-md node-walking`;
                node.style.borderColor = peer.color || '#ffb3ad';
                node.style.backgroundColor = peer.isSelf ? peer.color : `${peer.color || '#ffb3ad'}20`;
                node.style.transform = 'translate(-50%, -50%)';
                node.innerHTML = `
                    <span class="text-[16px]">${peer.avatar || '👤'}</span>
                    <div class="absolute -bottom-5 whitespace-nowrap font-label-mono text-[9px] text-on-surface-variant/70 bg-surface/70 backdrop-blur-sm px-1.5 py-0.5 rounded-md">${peer.nombre}</div>
                `;
                mapCanvas.appendChild(node);
                const zonePoints = waypoints[peer.zona] || waypoints['Zona A'];
                const startPt = zonePoints[Math.floor(Math.random() * zonePoints.length)];
                node.style.transition = 'none';
                node.style.top = `${startPt.t}%`;
                node.style.left = `${startPt.l}%`;
                setTimeout(() => { node.style.transition = 'top 6s linear, left 6s linear'; }, 50);
                const interval = setInterval(() => {
                    const st = window.peerNodesState[peer.id];
                    if (!st) return;
                    
                    const points = waypoints[st.zona] || waypoints['Zona A'];
                    const currentPt = points.find(p => p.id === st.wpId);
                    
                    if (currentPt && currentPt.edges && currentPt.edges.length > 0) {
                        const nextId = currentPt.edges[Math.floor(Math.random() * currentPt.edges.length)];
                        const nextPt = points.find(p => p.id === nextId);
                        
                        if (nextPt) {
                            st.wpId = nextId;
                            const rT = nextPt.t + (Math.random() * 4 - 2);
                            const rL = nextPt.l + (Math.random() * 2 - 1);
                            st.domNode.style.top = `${rT}%`;
                            st.domNode.style.left = `${rL}%`;
                        }
                    }
                }, 6000 + Math.random() * 2000);

                window.peerNodesState[peer.id] = { domNode: node, wpId: startPt.id, zona: peer.zona, interval };
            }
        });
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

    window.startPrivateChat = function(id, nombre) {
        switchTab('tab-chat');
        chatInput.value = '';
        chatInput.placeholder = `Susurrando a ${nombre}...`;
        chatInput.dataset.privateTarget = id;
        chatInput.focus();
    };

    function appendMessage(sender, text, isSelf, isPrivate = false) {
        const alignClass = isSelf ? 'self-end' : 'self-start';
        let bgClass = '';
        let labelPrivate = '';

        if (isPrivate) {
            bgClass = isSelf
                ? 'bg-gradient-to-br from-[#9c27b0] to-[#7b1fa2] text-white rounded-2xl rounded-br-md border border-[#e1bee7]/30 shadow-[0_0_15px_rgba(156,39,176,0.4)]'
                : 'glass-card-solid bg-[#f3e5f5]/10 border border-[#ab47bc]/40 text-[#ce93d8] rounded-2xl rounded-bl-md shadow-[0_0_15px_rgba(171,71,188,0.2)]';
            labelPrivate = `<span class="ml-2 font-bold text-[9px] uppercase tracking-wider text-white/50 bg-black/20 px-1.5 py-0.5 rounded">Privado</span>`;
        } else {
            bgClass = isSelf
                ? 'bg-gradient-to-br from-primary-container to-[#d63b38] text-white rounded-2xl rounded-br-md'
                : 'glass-card-solid text-on-surface rounded-2xl rounded-bl-md';
        }

        const senderClass = isSelf ? 'hidden' : 'font-label-mono text-[10px] text-on-surface-variant/50 mb-1 ml-1 tracking-wide flex items-center';
        
        const msgEl = document.createElement('div');
        msgEl.className = `flex flex-col max-w-[75%] ${alignClass} mb-2`;
        msgEl.innerHTML = `
            <div class="${senderClass}">
                <span>${sender}</span>
                ${isPrivate && !isSelf ? labelPrivate : ''}
            </div>
            <div class="chat-bubble px-4 py-2.5 ${bgClass} ${isPrivate ? 'text-[14px] italic' : ''}">
                ${text}
                ${isPrivate && isSelf ? labelPrivate : ''}
            </div>
        `;
        chatMessages.appendChild(msgEl);
        scrollToBottomChat();
    }

    function scrollToBottomChat() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    WebRTCEngine.onMessage(PROTOCOL.CHAT, (data) => {
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
                    showToast(`<span class="font-bold text-[#ce93d8]">${data.nombre || 'Desconocido'}</span> te ha susurrado.`);
                }
            }
        } else {
            appendMessage(data.nombre || 'Desconocido', data.text, false, false);
        }
    });

    WebRTCEngine.onMessage(PROTOCOL.ORGANIZER_BROADCAST, (data) => {
        const modal = document.getElementById('broadcast-modal');
        const content = document.getElementById('broadcast-content');
        const textEl = document.getElementById('broadcast-text');

        if (modal && content && textEl && data.text) {
            textEl.textContent = data.text;
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modal.classList.add('opacity-100', 'pointer-events-auto');
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
            setTimeout(() => {
                modal.classList.remove('opacity-100', 'pointer-events-auto');
                modal.classList.add('opacity-0', 'pointer-events-none');
                content.classList.remove('scale-100');
                content.classList.add('scale-95');
            }, 8000);
        }
    });

    WebRTCEngine.onMessage(PROTOCOL.PEER_JOIN, (data) => {
        if (data.zona === myZone && data.nombre) {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            
            showToast(`<span class="font-bold">${data.nombre}</span> acaba de llegar a tu zona`);
        }
    });
    function showToast(messageHtml) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = 'glass-card-solid bg-surface/90 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in pointer-events-auto border-secondary/30 transform transition-all duration-300 translate-y-[-20px] opacity-0';
        
        toast.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <span class="material-symbols-outlined text-secondary text-sm">waving_hand</span>
            </div>
            <div class="font-body-md text-[13px] leading-tight flex-grow">${messageHtml}</div>
        `;
        
        container.appendChild(toast);
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-[-20px]', 'opacity-0');
        });
        
        setTimeout(() => {
            toast.classList.add('opacity-0', 'scale-95');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
    window.heatmapCRDT = {};
    let heatmapLocalInterval = null;
    let heatmapSyncInterval = null;

    function startHeatmapCRDT() {
        if (heatmapLocalInterval) clearInterval(heatmapLocalInterval);
        if (heatmapSyncInterval) clearInterval(heatmapSyncInterval);
        heatmapLocalInterval = setInterval(() => {
            const myId = WebRTCEngine.getMyId();
            if (!myId || !myZone) return;
            
            if (!window.heatmapCRDT[myId]) {
                window.heatmapCRDT[myId] = {};
            }
            window.heatmapCRDT[myId][myZone] = (window.heatmapCRDT[myId][myZone] || 0) + 1;
        }, 1000);
        heatmapSyncInterval = setInterval(() => {
            if (!WebRTCEngine.getMyId()) return;
            WebRTCEngine.broadcast(PROTOCOL.HEATMAP_SYNC, window.heatmapCRDT);
        }, 5000);
    }

    function stopHeatmapCRDT() {
        if (heatmapLocalInterval) clearInterval(heatmapLocalInterval);
        if (heatmapSyncInterval) clearInterval(heatmapSyncInterval);
    }

    WebRTCEngine.onMessage(PROTOCOL.HEATMAP_SYNC, (data) => {
        for (const peerId in data) {
            if (!window.heatmapCRDT[peerId]) {
                window.heatmapCRDT[peerId] = {};
            }
            for (const zone in data[peerId]) {
                const localScore = window.heatmapCRDT[peerId][zone] || 0;
                const remoteScore = data[peerId][zone];
                window.heatmapCRDT[peerId][zone] = Math.max(localScore, remoteScore);
            }
        }
        if (isHeatmapMode) renderHeatmap();
    });

    function calculateGlobalHeatmap() {
        const totals = {};
        for (const peerId in window.heatmapCRDT) {
            for (const zone in window.heatmapCRDT[peerId]) {
                totals[zone] = (totals[zone] || 0) + window.heatmapCRDT[peerId][zone];
            }
        }
        return totals;
    }

    function renderHeatmap() {
        if (!isHeatmapMode) {
            ['zona-a-bg', 'zona-b-bg', 'zona-c-bg'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.backgroundColor = '';
                    el.style.boxShadow = '';
                }
            });
            return;
        }

        const totals = calculateGlobalHeatmap();
        let maxScore = 0;
        for (const z in totals) {
            if (totals[z] > maxScore) maxScore = totals[z];
        }

        const zoneMap = { 'Zona A': { id: 'zona-a-bg', color: '255, 179, 173' }, 'Zona B': { id: 'zona-b-bg', color: '68, 226, 205' }, 'Zona C': { id: 'zona-c-bg', color: '255, 84, 81' } };
        
        for (const zName in zoneMap) {
            const score = totals[zName] || 0;
            const intensity = maxScore > 0 ? score / maxScore : 0;
            const el = document.getElementById(zoneMap[zName].id);
            if (el) {
                if (intensity > 0) {
                    const c = zoneMap[zName].color;
                    el.style.backgroundColor = `rgba(${c}, ${0.05 + intensity * 0.25})`;
                    el.style.boxShadow = intensity > 0.2 ? `inset 0 0 ${intensity * 40}px rgba(${c}, ${intensity * 0.5})` : 'none';
                } else {
                    el.style.backgroundColor = '';
                    el.style.boxShadow = '';
                }
            }
        }
        const sortedZones = Object.keys(totals).map(z => ({ name: z, score: totals[z] })).sort((a,b) => b.score - a.score);
        if (sortedZones.length === 0) {
            leaderboardList.innerHTML = `<div class="text-center text-on-surface-variant/40 text-[11px] font-label-mono mt-2">Sin datos aún</div>`;
        } else {
            leaderboardList.innerHTML = sortedZones.slice(0, 5).map((z, idx) => {
                const color = idx === 0 ? '#fbbf24' : idx === 1 ? '#9ca3af' : idx === 2 ? '#b45309' : '#6b7280';
                return `
                    <div class="flex items-center justify-between p-2 rounded-lg bg-surface/40 border border-outline-variant/20">
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-[12px]" style="color: ${color}">#${idx + 1}</span>
                            <span class="font-headline-md text-[13px] text-on-surface">${z.name}</span>
                        </div>
                        <span class="font-label-mono text-[11px] text-white/60 bg-black/30 px-1.5 py-0.5 rounded">${Math.floor(z.score)}s</span>
                    </div>
                `;
            }).join('');
        }
    }
    inputNickname.addEventListener('input', (e) => {
        btnEnter.disabled = e.target.value.trim().length < 3;
    });

    btnEnter.addEventListener('click', () => {
        const name = inputNickname.value.trim();
        if(name.length >= 3) {
            myNombre = name;
            const urlParams = new URLSearchParams(window.location.search);
            const preselectedZone = urlParams.get('zona');
            
            let isValidZone = false;
            if (preselectedZone) {
                zoneButtons.forEach(btn => {
                    if (btn.dataset.zone === preselectedZone) isValidZone = true;
                });
            }

            if (isValidZone) {
                connectToNetwork(myNombre, preselectedZone);
            } else {
                showScreen(screenZone);
            }
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
            stopHeatmapCRDT();
            myNombre = "";
            myZone = "";
            inputNickname.value = '';
            showScreen(screenEntry);
        }
    });

    btnChangeZone.addEventListener('click', () => {
        WebRTCEngine.desconectar();
        stopHeatmapCRDT();
        showScreen(screenZone);
    });
    if (btnToggleHeatmap) {
        btnToggleHeatmap.addEventListener('click', () => {
            isHeatmapMode = !isHeatmapMode;
            if (isHeatmapMode) {
                btnToggleHeatmap.classList.add('bg-primary/20', 'border-primary/50', 'text-primary');
                btnToggleHeatmap.classList.remove('bg-[#0c0b15]', 'text-white/70');
                blueprintContainer.classList.add('heatmap-active');
                heatmapLeaderboard.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
                renderHeatmap();
                if (heatmapUIInterval) clearInterval(heatmapUIInterval);
                heatmapUIInterval = setInterval(renderHeatmap, 2000);
            } else {
                btnToggleHeatmap.classList.remove('bg-primary/20', 'border-primary/50', 'text-primary');
                btnToggleHeatmap.classList.add('bg-[#0c0b15]', 'text-white/70');
                blueprintContainer.classList.remove('heatmap-active');
                heatmapLeaderboard.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
                renderHeatmap();
                if (heatmapUIInterval) clearInterval(heatmapUIInterval);
            }
        });
    }

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.target);
        });
    });

    window.startPrivateChat = (peerId, name) => {
        chatInput.dataset.privateTarget = peerId;
        chatInput.placeholder = `Respondiendo a ${name}...`;
        chatInput.focus();
        switchTab('tab-chat');
    };

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = chatInput.value.trim();
        if(msg) {
            
                appendMessage(myNombre, msg, true, false);
            WebRTCEngine.broadcast(PROTOCOL.CHAT, { text: msg, nombre: myNombre });
            chatInput.value = '';
        }
    });

    document.querySelectorAll('.reaction-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const emoji = btn.dataset.emoji;
            WebRTCEngine.broadcast(PROTOCOL.REACTION, { emoji, nombre: myNombre });
            if (navigator.vibrate) navigator.vibrate(50);
            
            // local feedback
            btn.classList.add('scale-150');
            setTimeout(() => btn.classList.remove('scale-150'), 150);
            spawnLocalReaction(emoji);
        });
    });

    function spawnLocalReaction(emoji) {
        const el = document.createElement('div');
        el.className = 'fixed text-4xl pointer-events-none z-[9999]';
        el.innerText = emoji;
        el.style.left = Math.random() * 80 + 10 + '%';
        el.style.bottom = '-50px';
        const animName = 'floatUp' + Date.now();
        const style = document.createElement('style');
        style.innerText = `
            @keyframes ${animName} {
                0% { transform: translateY(0) scale(0.8); opacity: 0; }
                10% { transform: translateY(-20px) scale(1.2); opacity: 1; }
                20% { transform: translateY(-40px) scale(1); opacity: 1; }
                80% { transform: translateY(-350px) scale(1); opacity: 0.8; }
                100% { transform: translateY(-400px) scale(0.8); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        el.style.animation = `${animName} 3s ease-out forwards`;
        document.body.appendChild(el);
        setTimeout(() => {
            el.remove();
            style.remove();
        }, 3000);
    }

    initAvatarPickers();
    showScreen(screenEntry);

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
            return `<div class="flex flex-col max-w-[85%] ${alignClass}">
                    <div class="${senderClass}"><span>${m.sender}</span></div>
                    <div class="chat-bubble px-4 py-2.5 ${bgClass}">${m.text}</div>
                </div>`;
        }).join('');
        container.scrollTop = container.scrollHeight;
    };

});
