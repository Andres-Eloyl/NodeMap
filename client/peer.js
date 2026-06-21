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
    let myAvatar = "?";
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
        ['tab-map', 'tab-nodes', 'tab-chat', 'tab-forums', 'tab-games'].forEach(id => {
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
                <button onclick="window.startPrivateChat('${peer.id}', '${peer.nombre}')" class="bg-primary/20 hover:bg-primary/40 border border-primary/50 text-primary p-2  transition-all shadow-sm">
                    <span class="material-symbols-outlined text-[16px]">chat</span>
                </button>
            `;
            return `
                <div class="glass-card-solid flex items-center justify-between p-4  hover:border-primary/30 transition-all duration-200 ${peer.isSelf ? 'border border-primary/40 bg-primary/5' : ''}">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10  flex items-center justify-center flex-shrink-0" style="background-color: ${peer.color ? peer.color + '20' : 'rgba(255,255,255,0.1)'};">
                            <span class="text-[20px]">${peer.avatar || peer.nombre.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                            <div class="font-body-md text-on-surface font-medium text-[14px]" style="color: ${peer.color || '#fff'}">${peer.nombre}</div>
                            <div class="font-label-mono text-[10px] text-on-surface-variant/50 mt-0.5 uppercase tracking-[0.08em]">${peer.id.substring(0,6)} · ${peer.zona || 'Desconocida'}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        ${chatBtn}
                        <div class="badge-chip px-2.5 py-1  flex items-center gap-1">
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
                node.className = `absolute w-9 h-9  border backdrop-blur-sm flex items-center justify-center z-10 shadow-md node-walking`;
                node.style.borderColor = peer.color || '#ffb3ad';
                node.style.backgroundColor = peer.isSelf ? peer.color : `${peer.color || '#ffb3ad'}20`;
                node.style.transform = 'translate(-50%, -50%)';
                node.innerHTML = `
                    <span class="text-[16px]">${peer.avatar || peer.nombre.charAt(0).toUpperCase()}</span>
                    <div class="absolute -bottom-5 whitespace-nowrap font-label-mono text-[9px] text-on-surface-variant/70 bg-surface/70 backdrop-blur-sm px-1.5 py-0.5 ">${peer.nombre}</div>
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
            stairsNode.className = "absolute w-12 h-12 md:w-16 md:h-16  border-2 border-primary bg-primary/20 flex items-center justify-center map-zone-glow z-0 backdrop-blur-sm pointer-events-auto";
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
        chatInput.placeholder = `Mensaje privado para ${nombre}...`;
        
        chatInput.focus();
    };

        function appendMessageToContainer(containerEl, sender, text, isSelf, isPrivate = false, isGlobal = false) {
        if (!containerEl) return;
        const alignClass = isSelf ? 'self-end' : 'self-start';
        let bgClass = '';
        let labelTag = '';

        if (isPrivate) {
            bgClass = isSelf
                ? 'bg-gradient-to-br from-[#9c27b0] to-[#7b1fa2] text-white   border border-[#e1bee7]/30 shadow-[0_0_15px_rgba(156,39,176,0.4)]'
                : 'glass-card-solid bg-[#f3e5f5]/10 border border-[#ab47bc]/40 text-[#ce93d8]   shadow-[0_0_15px_rgba(171,71,188,0.2)]';
            labelTag = `<span class="ml-2 font-bold text-[9px] uppercase tracking-wider text-white/50 bg-black/20 px-1.5 py-0.5 ">Privado</span>`;
        } else if (isGlobal) {
            bgClass = isSelf
                ? 'bg-gradient-to-br from-primary-container to-[#d63b38] text-white  '
                : 'glass-card-solid text-on-surface  ';
            labelTag = `<span class="ml-2 font-bold text-[9px] uppercase tracking-wider text-white/50 bg-black/20 px-1.5 py-0.5  text-primary border border-primary/20">Global</span>`;
        } else {
            bgClass = isSelf
                ? 'bg-gradient-to-br from-primary-container to-[#d63b38] text-white  '
                : 'glass-card-solid text-on-surface  ';
        }

        const senderClass = isSelf ? 'hidden' : 'font-label-mono text-[10px] text-on-surface-variant/50 mb-1 ml-1 tracking-wide flex items-center';
        
        const msgEl = document.createElement('div');
        msgEl.className = `flex flex-col max-w-[75%] ${alignClass} mb-2`;
        msgEl.innerHTML = `
            <div class="${senderClass}">
                <span>${sender}</span>
                ${(!isSelf && (isPrivate || isGlobal)) ? labelTag : ''}
            </div>
            <div class="chat-bubble px-4 py-2.5 ${bgClass} ${isPrivate ? 'text-[14px] italic' : ''}">
                ${text}
                ${(isSelf && (isPrivate || isGlobal)) ? labelTag : ''}
            </div>
        `;
        containerEl.appendChild(msgEl);
        containerEl.scrollTop = containerEl.scrollHeight;
    }

    function appendMessage(sender, text, isSelf, isPrivate = false) {
        appendMessageToContainer(chatMessages, sender, text, isSelf, isPrivate, false);
    }

    function scrollToBottomChat() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    WebRTCEngine.onMessage(PROTOCOL.FORUM_MSG, (data) => {
        if (!data || !data.zona || !data.id) return;
        if (!window.forums) window.forums = { 'Zona A': [], 'Zona B': [], 'Zona C': [] };
        if (!window.forums[data.zona]) window.forums[data.zona] = [];
        
        // Evitar duplicados
        const exists = window.forums[data.zona].find(m => m.id === data.id);
        if (!exists) {
            window.forums[data.zona].push(data);
            window.forums[data.zona].sort((a,b) => a.timestamp - b.timestamp);
            if (typeof renderForumMessages === 'function') renderForumMessages();
            
            // Notification if in different tab
            const tabForums = document.getElementById('tab-forums');
            if (tabForums && tabForums.classList.contains('view-hidden')) {
                if (typeof showToast !== 'undefined') {
                    showToast(`<span class="font-bold text-primary">${data.nombre}</span> publicó en el Foro ${data.zona}`, () => {
                        switchTab('tab-forums');
                        if (typeof switchForumSubtab === 'function') switchForumSubtab(data.zona, data.zona === 'Zona A' ? 'forum-tab-a' : data.zona === 'Zona B' ? 'forum-tab-b' : 'forum-tab-c');
                    });
                }
            }
        }
    });

    WebRTCEngine.onMessage(PROTOCOL.GAME_INVITE, (data) => {
        if (typeof AudioSystem !== "undefined") AudioSystem.play("chat");
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        
        const modalId = 'game-invite-modal-' + Date.now();
        const gameName = data.gameType === 'reaction' ? 'Carrera de Reacción' : (data.gameType === 'tictactoe' ? 'Tic Tac Toe' : 'Piedra, Papel, Tijera');
        
        const modalHtml = `
            <div id="${modalId}" class="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                <div class="glass-card-solid p-6  max-w-xs w-full text-center border-primary/40 shadow-2xl">
                    <div class="w-16 h-16  bg-primary/20 flex items-center justify-center mx-auto mb-4">
                        <span class="material-symbols-outlined text-primary text-4xl">sports_esports</span>
                    </div>
                    <h3 class="font-headline-lg text-xl mb-2 text-on-surface">¡Nuevo Reto!</h3>
                    <p class="font-body-md text-on-surface-variant mb-6 text-[14px]">
                        <span class="font-bold text-white">${data.nombre}</span> te ha retado a jugar 
                        <span class="font-bold text-primary">${gameName}</span>.
                    </p>
                    <div class="flex gap-3">
                        <button id="btn-reject-${modalId}" class="flex-1 py-3  border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold transition-colors">Rechazar</button>
                        <button id="btn-accept-${modalId}" class="flex-1 py-3  bg-primary text-[#68000a] font-bold hover:bg-primary/90 transition-colors shadow-lg">Aceptar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById(`btn-accept-${modalId}`).onclick = () => {
            document.getElementById(modalId).remove();
            WebRTCEngine.sendToPeer(data.senderId, PROTOCOL.GAME_ACCEPT, { gameType: data.gameType, nombre: myNombre });
            window.startGameSession(data.senderId, data.nombre, data.gameType, false);
        };
        
        document.getElementById(`btn-reject-${modalId}`).onclick = () => {
            document.getElementById(modalId).remove();
            WebRTCEngine.sendToPeer(data.senderId, PROTOCOL.GAME_REJECT, { nombre: myNombre });
        };
    });

    WebRTCEngine.onMessage(PROTOCOL.GAME_ACCEPT, (data) => {
        if (typeof showToast !== 'undefined') showToast(`¡${data.nombre} aceptó el reto!`);
        window.startGameSession(data.senderId, data.nombre, data.gameType, true);
    });

    WebRTCEngine.onMessage(PROTOCOL.GAME_REJECT, (data) => {
        alert(`${data.nombre} rechazó tu invitación.`);
    });

    WebRTCEngine.onMessage(PROTOCOL.TRIVIA_START, (data) => {
        if (window.showTriviaModal) window.showTriviaModal(data);
    });

    WebRTCEngine.onMessage(PROTOCOL.REACTION_READY, (data) => {
        if (window.reactionGameStart) window.reactionGameStart(data);
    });
    WebRTCEngine.onMessage(PROTOCOL.REACTION_GO, (data) => {
        if (window.reactionGameGo) window.reactionGameGo(data);
    });
    WebRTCEngine.onMessage(PROTOCOL.REACTION_TAP, (data) => {
        if (window.reactionGameTap) window.reactionGameTap(data);
    });

    WebRTCEngine.onMessage(PROTOCOL.CHAT, (data) => {
        if (typeof AudioSystem !== "undefined") AudioSystem.play("chat");
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
                    showToast(`<span class="font-bold text-[#ce93d8]">${data.nombre || 'Desconocido'}</span> te ha enviado un mensaje privado.`, () => {
                        if (typeof window.startPrivateChat === 'function') {
                            window.startPrivateChat(peerId, data.nombre || 'Desconocido');
                        }
                    });
                }
                if (typeof window.renderPrivateChatList === 'function') window.renderPrivateChatList();
            }
        } else if (data.isGlobal) {
            const gc = document.getElementById('chat-global-messages');
            appendMessageToContainer(gc, data.nombre || 'Desconocido', data.text, false, false, true);
            
            const tabChat = document.getElementById('tab-chat');
            const chatGlobal = document.getElementById('chat-global-view');
            if ((tabChat && tabChat.classList.contains('view-hidden')) || (chatGlobal && chatGlobal.classList.contains('hidden'))) {
                showToast(`<span class="font-bold text-primary">${data.nombre || 'Desconocido'}</span> (Global): ${data.text.substring(0, 20)}${data.text.length > 20 ? '...' : ''}`, () => {
                    switchTab('tab-chat');
                    if (typeof switchChatSubtab === 'function') switchChatSubtab('global');
                });
            }
        } else {
            const senderPeer = WebRTCEngine.getPeers().find(p => p.id === data.senderId);
            if (senderPeer && senderPeer.zona === myZone) {
                appendMessage(data.nombre || 'Desconocido', data.text, false, false);
                
                const tabChat = document.getElementById('tab-chat');
                const chatZone = document.getElementById('chat-zone-view');
                if ((tabChat && tabChat.classList.contains('view-hidden')) || (chatZone && chatZone.classList.contains('hidden'))) {
                    showToast(`<span class="font-bold">${data.nombre || 'Desconocido'}</span> (Zona): ${data.text.substring(0, 20)}${data.text.length > 20 ? '...' : ''}`, () => {
                        switchTab('tab-chat');
                        if (typeof switchChatSubtab === 'function') switchChatSubtab('zona');
                    });
                }
            }
        }
    });

    WebRTCEngine.onMessage(PROTOCOL.ORGANIZER_BROADCAST, (data) => {
        if (typeof AudioSystem !== "undefined") AudioSystem.play("broadcast");
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
            modal.style.pointerEvents = ''; 
            modal.style.pointerEvents = 'none'; 
                content.classList.remove('scale-100');
                content.classList.add('scale-95');
            }, 8000);
        }
    });

    WebRTCEngine.onMessage(PROTOCOL.PEER_JOIN, (data) => {
        if (data.zona === myZone && data.nombre) {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            
            if (typeof AudioSystem !== "undefined") AudioSystem.play("join");
            showToast(`<span class="font-bold">${data.nombre}</span> acaba de llegar a tu zona`, () => {
                switchTab('tab-nodes');
            });
        }
    });
    function showToast(messageHtml, onClick) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = 'glass-card-solid bg-surface/90 text-white px-4 py-3  shadow-xl flex items-center gap-3 animate-fade-in pointer-events-auto border-secondary/30 transform transition-all duration-300 translate-y-[-20px] opacity-0' + (onClick ? ' cursor-pointer' : '');
        if (onClick) {
            toast.addEventListener('click', () => {
                onClick();
                toast.classList.add('opacity-0', 'scale-95');
                setTimeout(() => toast.remove(), 300);
            });
        }
        
        toast.innerHTML = `
            <div class="w-8 h-8  bg-secondary/20 flex items-center justify-center flex-shrink-0">
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
                    <div class="flex items-center justify-between p-2  bg-surface/40 border border-outline-variant/20">
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-[12px]" style="color: ${color}">#${idx + 1}</span>
                            <span class="font-headline-md text-[13px] text-on-surface">${z.name}</span>
                        </div>
                        <span class="font-label-mono text-[11px] text-white/60 bg-black/30 px-1.5 py-0.5 ">${Math.floor(z.score)}s</span>
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

    

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = chatInput.value.trim();
        if(msg) {
            appendMessage(myNombre, msg, true, false);
            const peers = WebRTCEngine.getPeers();
            for (const p of peers) {
                if (p.zona === myZone) {
                    WebRTCEngine.sendToPeer(p.id, PROTOCOL.CHAT, { text: msg, nombre: myNombre });
                }
            }
            chatInput.value = '';
        }
    });

    const chatGlobalForm = document.getElementById('chat-global-form');
    const chatGlobalInput = document.getElementById('chat-global-input');
    
    if (chatGlobalForm && chatGlobalInput) {
        chatGlobalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const msg = chatGlobalInput.value.trim();
            if (msg) {
                const gc = document.getElementById('chat-global-messages');
                appendMessageToContainer(gc, myNombre, msg, true, false, true);
                
                
                WebRTCEngine.broadcast(PROTOCOL.CHAT, { text: msg, nombre: myNombre, isGlobal: true });
                
                chatGlobalInput.value = '';
            }
        });
    }

    

    

    showScreen(screenEntry);

    window.privateChats = {}; 
    window.activePrivateChatId = null;

    const subtabZona = document.getElementById('subtab-zona');
    const subtabGlobal = document.getElementById('subtab-global');
    const subtabPrivados = document.getElementById('subtab-privados');
    const chatZoneView = document.getElementById('chat-zone-view');
    const chatGlobalView = document.getElementById('chat-global-view');
    const chatPrivatesListView = document.getElementById('chat-privates-list-view');
    const chatPrivateConvView = document.getElementById('chat-private-conversation-view');

    function switchChatSubtab(tab) {
        if (!subtabZona) return;
        subtabZona.className = tab === 'zona' ? 'flex-1 py-2 font-bold text-primary border-b-2 border-primary transition-all text-[14px]' : 'flex-1 py-2 font-bold text-on-surface-variant/70 border-b-2 border-transparent transition-all text-[14px]';
        if (subtabGlobal) subtabGlobal.className = tab === 'global' ? 'flex-1 py-2 font-bold text-primary border-b-2 border-primary transition-all text-[14px]' : 'flex-1 py-2 font-bold text-on-surface-variant/70 border-b-2 border-transparent transition-all text-[14px]';
        subtabPrivados.className = tab === 'privados' ? 'flex-1 py-2 font-bold text-primary border-b-2 border-primary transition-all text-[14px]' : 'flex-1 py-2 font-bold text-on-surface-variant/70 border-b-2 border-transparent transition-all text-[14px]';
        
        if (chatZoneView) chatZoneView.classList.add('hidden');
        if (chatGlobalView) chatGlobalView.classList.add('hidden');
        if (chatPrivatesListView) chatPrivatesListView.classList.add('hidden');
        if (chatPrivateConvView) chatPrivateConvView.classList.add('hidden');

        if (tab === 'zona') {
            if (chatZoneView) chatZoneView.classList.remove('hidden');
            setTimeout(() => { if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight; }, 50);
        } else if (tab === 'global') {
            if (chatGlobalView) chatGlobalView.classList.remove('hidden');
            setTimeout(() => { 
                const gc = document.getElementById('chat-global-messages'); 
                if (gc) gc.scrollTop = gc.scrollHeight; 
            }, 50);
        } else if (tab === 'privados') {
            if (chatPrivatesListView) chatPrivatesListView.classList.remove('hidden');
            window.renderPrivateChatList();
        }
    }

    if (subtabZona) subtabZona.addEventListener('click', () => switchChatSubtab('zona'));
    if (subtabGlobal) subtabGlobal.addEventListener('click', () => switchChatSubtab('global'));
    if (subtabPrivados) subtabPrivados.addEventListener('click', () => switchChatSubtab('privados'));

    // === FORUMS LOGIC ===
    window.forums = { 'Zona A': [], 'Zona B': [], 'Zona C': [] };
    let currentForumZone = 'Zona A';
    
    function renderForumMessages() {
        const container = document.getElementById('forum-messages');
        if (!container) return;
        const msgs = window.forums[currentForumZone] || [];
        
        let html = `<div class="text-center font-label-mono text-[11px] text-on-surface-variant/40 my-2 tracking-wide">Mostrando mensajes de la ${currentForumZone}</div>`;
        
        msgs.forEach(m => {
            const timeStr = new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            html += `
                <div class="glass-card-solid p-3  flex gap-3 shadow-sm border border-outline-variant/20 mb-2">
                    <div class="w-8 h-8  flex items-center justify-center flex-shrink-0" style="background-color: ${m.color ? m.color + '20' : 'rgba(255,255,255,0.1)'}; color: ${m.color || '#fff'}">
                        <span class="text-[14px]">${m.avatar || '?'}</span>
                    </div>
                    <div class="flex-grow">
                        <div class="flex justify-between items-baseline mb-1">
                            <span class="font-bold text-[13px]" style="color: ${m.color || '#fff'}">${m.nombre}</span>
                            <span class="text-[10px] text-on-surface-variant/50 font-label-mono">${timeStr}</span>
                        </div>
                        <p class="text-[14px] text-on-surface-variant/90 leading-snug">${m.text}</p>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    }

    function switchForumSubtab(zone, id) {
        currentForumZone = zone;
        ['forum-tab-a', 'forum-tab-b', 'forum-tab-c'].forEach(tabId => {
            const btn = document.getElementById(tabId);
            if (!btn) return;
            if (tabId === id) {
                btn.className = 'flex-1 py-2 font-bold text-primary border-b-2 border-primary transition-all text-[14px]';
            } else {
                btn.className = 'flex-1 py-2 font-bold text-on-surface-variant/70 border-b-2 border-transparent transition-all text-[14px]';
            }
        });
        renderForumMessages();
    }

    const tabA = document.getElementById('forum-tab-a');
    const tabB = document.getElementById('forum-tab-b');
    const tabC = document.getElementById('forum-tab-c');
    if (tabA) tabA.addEventListener('click', () => switchForumSubtab('Zona A', 'forum-tab-a'));
    if (tabB) tabB.addEventListener('click', () => switchForumSubtab('Zona B', 'forum-tab-b'));
    if (tabC) tabC.addEventListener('click', () => switchForumSubtab('Zona C', 'forum-tab-c'));

    const forumForm = document.getElementById('forum-form');
    const forumInput = document.getElementById('forum-input');
    if (forumForm && forumInput) {
        forumForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const msg = forumInput.value.trim();
            if (msg) {
                const msgObj = {
                    id: Date.now() + Math.random().toString(),
                    zona: currentForumZone,
                    nombre: myNombre,
                    color: myColor,
                    avatar: myAvatar,
                    text: msg,
                    timestamp: Date.now()
                };
                window.forums[currentForumZone].push(msgObj);
                renderForumMessages();
                forumInput.value = '';
                
                // Multicast to all peers (in this demo we broadcast and let them filter)
                WebRTCEngine.broadcast(PROTOCOL.FORUM_MSG, msgObj);
            }
        });
    }

    // === GAMES LOGIC ===

    window.startGameSession = function(opponentId, opponentName, gameType, isInitiator) {
        window.activeGameSession = { opponentId, opponentName, isInitiator };
        document.getElementById('game-lobby-view').classList.add('hidden');
        document.getElementById('games-list-view').classList.add('hidden');
        const activeView = document.getElementById('active-game-view');
        activeView.classList.remove('hidden');
        switchTab('tab-games');
        
        activeView.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <button class="text-primary text-[13px] font-bold flex items-center gap-1 hover:underline" onclick="window.closeGameLobby()"><span class="material-symbols-outlined text-[16px]">arrow_back</span> Salir</button>
                <div class="text-[14px] font-bold text-on-surface">VS ${opponentName}</div>
            </div>
            <div id="game-canvas-area" class="flex-grow flex flex-col items-center justify-center"></div>
        `;

        if (gameType === 'reaction') {
            initReactionGame(isInitiator);
        } else if (gameType === 'tictactoe') {
            initTicTacToe(isInitiator);
        } else if (gameType === 'rps') {
            initRockPaperScissors(isInitiator);
        } else {
            document.getElementById('game-canvas-area').innerHTML = `<p class="text-on-surface-variant/50">Juego ${gameType} en desarrollo...</p>`;
        }
    };

    window.gameMoveHandler = null;
    WebRTCEngine.onMessage(PROTOCOL.GAME_MOVE, (data) => {
        if (window.gameMoveHandler) window.gameMoveHandler(data);
    });

    function initTicTacToe(isInitiator) {
        const area = document.getElementById('game-canvas-area');
        area.innerHTML = `
            <div class="mb-4 text-center font-bold" id="ttt-status"></div>
            <div class="relative w-64 h-64 mx-auto">
                <div class="grid grid-cols-3 gap-2 w-full h-full" id="ttt-board">
                    ${Array(9).fill(0).map((_, i) => `<div class="w-[80px] h-[80px] bg-surface-bright flex items-center justify-center text-5xl font-bold cursor-pointer  border border-outline-variant/30 hover:bg-primary/10 transition-colors overflow-hidden" data-idx="${i}"></div>`).join('')}
                </div>
                <div id="ttt-line" class="absolute bg-primary  origin-left transition-transform duration-500 ease-out z-10 drop-shadow-[0_0_8px_rgba(255,84,81,0.8)]" style="height: 6px; opacity: 0; transform: scaleX(0);"></div>
            </div>
        `;
        let board = Array(9).fill(null);
        let myTurn = isInitiator;
        let mySymbol = isInitiator ? 'X' : 'O';
        let opSymbol = isInitiator ? 'O' : 'X';
        let gameOver = false;

        const status = document.getElementById('ttt-status');
        const cells = document.querySelectorAll('#ttt-board div');

        function updateStatus() {
            if (gameOver) return;
            status.textContent = myTurn ? 'Tu turno (' + mySymbol + ')' : 'Turno del rival (' + opSymbol + ')';
            status.className = myTurn ? 'mb-4 text-center font-bold text-green-400' : 'mb-4 text-center font-bold text-yellow-400';
        }

        function checkWin(b) {
            const lines = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8],
                [0, 3, 6], [1, 4, 7], [2, 5, 8],
                [0, 4, 8], [2, 4, 6]
            ];
            for (let i = 0; i < lines.length; i++) {
                const [x, y, z] = lines[i];
                if (b[x] && b[x] === b[y] && b[x] === b[z]) return { winner: b[x], line: [x, y, z] };
            }
            if (b.every(c => c !== null)) return { winner: 'draw', line: null };
            return null;
        }

        function drawLine(line) {
            if (!line) return;
            const lineEl = document.getElementById('ttt-line');
            const [a, b, c] = line;
            
            const getCol = (idx) => idx % 3;
            const getRow = (idx) => Math.floor(idx / 3);
            const centers = [40, 128, 216]; // 80px + 8px gap precalculated centers
            
            const x1 = centers[getCol(a)];
            const y1 = centers[getRow(a)];
            const x2 = centers[getCol(c)];
            const y2 = centers[getRow(c)];
            
            const length = Math.hypot(x2 - x1, y2 - y1);
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
            
            lineEl.style.left = `${x1}px`;
            lineEl.style.top = `${y1 - 3}px`; // -3 to center the 6px height line
            lineEl.style.width = `${length}px`;
            lineEl.style.opacity = '1';
            
            requestAnimationFrame(() => {
                lineEl.style.transform = `rotate(${angle}deg) scaleX(1)`;
            });
        }

        function handleEnd(result) {
            gameOver = true;
            const winner = result.winner;
            if (winner === 'draw') {
                status.textContent = '¡Empate!';
                status.className = 'mb-4 text-center font-bold text-white text-xl';
            } else if (winner === mySymbol) {
                status.textContent = '¡Ganaste!';
                status.className = 'mb-4 text-center font-bold text-primary text-xl';
                drawLine(result.line);
            } else {
                status.textContent = '¡Perdiste!';
                status.className = 'mb-4 text-center font-bold text-red-500 text-xl';
                drawLine(result.line);
            }
        }

        cells.forEach(cell => {
            cell.addEventListener('click', () => {
                if (!myTurn || gameOver) return;
                const idx = cell.dataset.idx;
                if (board[idx]) return;

                board[idx] = mySymbol;
                cell.textContent = mySymbol;
                cell.classList.add(mySymbol === 'X' ? 'text-primary' : 'text-tertiary');
                myTurn = false;
                
                WebRTCEngine.sendToPeer(window.activeGameSession.opponentId, PROTOCOL.GAME_MOVE, { game: 'tictactoe', idx: idx });
                
                const result = checkWin(board);
                if (result) handleEnd(result);
                else updateStatus();
            });
        });

        window.gameMoveHandler = (data) => {
            if (data.game !== 'tictactoe' || gameOver) return;
            const idx = data.idx;
            board[idx] = opSymbol;
            cells[idx].textContent = opSymbol;
            cells[idx].classList.add(opSymbol === 'X' ? 'text-primary' : 'text-tertiary');
            myTurn = true;
            
            const result = checkWin(board);
            if (result) handleEnd(result);
            else updateStatus();
        };

        updateStatus();
    }

    function initRockPaperScissors(isInitiator) {
        const area = document.getElementById('game-canvas-area');
        area.innerHTML = `
            <div class="mb-8 text-center font-bold text-xl text-on-surface" id="rps-status">Elige tu jugada</div>
            <div class="flex gap-4 md:gap-6" id="rps-options">
                <button class="w-24 h-24 md:w-28 md:h-28  bg-surface-bright border border-outline-variant/30 hover:border-primary hover:bg-primary/20 flex flex-col items-center justify-center transition-all shadow-md" data-choice="rock">
                    <span class="text-4xl md:text-5xl">✊</span>
                    <span class="text-xs mt-2 font-bold uppercase tracking-wide">Piedra</span>
                </button>
                <button class="w-24 h-24 md:w-28 md:h-28  bg-surface-bright border border-outline-variant/30 hover:border-primary hover:bg-primary/20 flex flex-col items-center justify-center transition-all shadow-md" data-choice="paper">
                    <span class="text-4xl md:text-5xl">✋</span>
                    <span class="text-xs mt-2 font-bold uppercase tracking-wide">Papel</span>
                </button>
                <button class="w-24 h-24 md:w-28 md:h-28  bg-surface-bright border border-outline-variant/30 hover:border-primary hover:bg-primary/20 flex flex-col items-center justify-center transition-all shadow-md" data-choice="scissors">
                    <span class="text-4xl md:text-5xl">✌️</span>
                    <span class="text-xs mt-2 font-bold uppercase tracking-wide">Tijera</span>
                </button>
            </div>
            <div id="rps-result" class="hidden mt-8 flex flex-col items-center w-full">
                <div class="flex justify-center items-center w-full max-w-sm mb-6">
                    <div class="flex flex-col items-center flex-1">
                        <span class="text-[10px] font-mono text-white/50 mb-2 uppercase">Tú</span>
                        <div id="rps-my-choice" class="text-6xl transform scale-x-[-1] drop-shadow-lg"></div>
                    </div>
                    <div class="text-2xl font-bold text-primary/80 mx-4 italic">VS</div>
                    <div class="flex flex-col items-center flex-1">
                        <span class="text-[10px] font-mono text-white/50 mb-2 uppercase">Rival</span>
                        <div id="rps-op-choice" class="text-6xl drop-shadow-lg"></div>
                    </div>
                </div>
                <div id="rps-winner" class="font-headline-lg text-3xl font-bold uppercase tracking-wider py-2 px-6  bg-black/20 border"></div>
            </div>
        `;

        let myChoice = null;
        let opChoice = null;
        const status = document.getElementById('rps-status');
        const options = document.querySelectorAll('#rps-options button');
        const resultDiv = document.getElementById('rps-result');

        const emojis = { rock: '✊', paper: '✋', scissors: '✌️' };

        function resolveGame() {
            document.getElementById('rps-options').classList.add('hidden');
            resultDiv.classList.remove('hidden');
            
            document.getElementById('rps-my-choice').textContent = emojis[myChoice];
            document.getElementById('rps-op-choice').textContent = emojis[opChoice];
            
            let winner = '';
            if (myChoice === opChoice) winner = 'Empate';
            else if (
                (myChoice === 'rock' && opChoice === 'scissors') ||
                (myChoice === 'paper' && opChoice === 'rock') ||
                (myChoice === 'scissors' && opChoice === 'paper')
            ) winner = '¡Ganaste!';
            else winner = '¡Perdiste!';

            const wEl = document.getElementById('rps-winner');
            wEl.textContent = winner;
            if (winner === '¡Ganaste!') {
                wEl.classList.add('text-green-400', 'border-green-500/30', 'bg-green-500/10');
            } else if (winner === '¡Perdiste!') {
                wEl.classList.add('text-red-500', 'border-red-500/30', 'bg-red-500/10');
            } else {
                wEl.classList.add('text-white', 'border-white/30');
            }
            
            status.textContent = 'Juego Terminado';
        }

        options.forEach(btn => {
            btn.addEventListener('click', () => {
                if (myChoice) return;
                myChoice = btn.dataset.choice;
                
                options.forEach(b => b.classList.add('opacity-30', 'scale-95'));
                btn.classList.remove('opacity-30', 'scale-95');
                btn.classList.add('border-primary', 'bg-primary/20', 'scale-105');

                WebRTCEngine.sendToPeer(window.activeGameSession.opponentId, PROTOCOL.GAME_MOVE, { game: 'rps', choice: myChoice });
                
                if (opChoice) {
                    resolveGame();
                } else {
                    status.textContent = 'Esperando al rival...';
                    status.classList.add('animate-pulse', 'text-yellow-400');
                }
            });
        });

        window.gameMoveHandler = (data) => {
            if (data.game !== 'rps') return;
            opChoice = data.choice;
            if (myChoice) {
                resolveGame();
            } else {
                status.textContent = 'El rival ya eligió. ¡Te toca!';
                status.classList.add('text-primary');
            }
        };
    }

    function initReactionGame(isInitiator) {
        const area = document.getElementById('game-canvas-area');
        area.innerHTML = `
            <div id="reaction-circle" class="w-40 h-40  bg-surface-bright flex items-center justify-center text-on-surface-variant shadow-lg cursor-pointer transition-colors duration-100 border-4 border-outline-variant/30 select-none">
                <span class="font-bold text-lg pointer-events-none" id="reaction-text">Esperando...</span>
            </div>
            <div id="reaction-result" class="mt-8 text-center hidden">
                <div class="font-headline-lg text-2xl text-primary mb-2" id="reaction-winner"></div>
                <div class="font-label-mono text-[12px] text-on-surface-variant/80">Tu tiempo: <span id="reaction-my-time">--</span> ms</div>
                <div class="font-label-mono text-[12px] text-on-surface-variant/80">Rival: <span id="reaction-op-time">--</span> ms</div>
            </div>
        `;

        const circle = document.getElementById('reaction-circle');
        const text = document.getElementById('reaction-text');
        
        let state = 'waiting'; // waiting, ready, go, done
        let goTimestamp = 0;
        let myTapTime = 0;
        let opTapTime = 0;

        window.reactionGameStart = (data) => {
            state = 'ready';
            text.textContent = '¡Prepárate!';
            circle.className = "w-40 h-40  bg-orange-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(249,115,22,0.5)] cursor-pointer border-4 border-orange-400 select-none";
        };

        window.reactionGameGo = (data) => {
            state = 'go';
            goTimestamp = data.timestamp; // The actual time the signal was sent
            text.textContent = '¡TOCA!';
            circle.className = "w-40 h-40  bg-green-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(34,197,94,0.7)] cursor-pointer border-4 border-green-400 select-none scale-105 transition-transform";
        };

        window.reactionGameTap = (data) => {
            opTapTime = data.tapTime;
            checkWinner();
        };

        function checkWinner() {
            if (myTapTime > 0 && opTapTime > 0) {
                state = 'done';
                const myDiff = myTapTime - goTimestamp;
                const opDiff = opTapTime - goTimestamp;
                
                document.getElementById('reaction-result').classList.remove('hidden');
                document.getElementById('reaction-my-time').textContent = myDiff;
                document.getElementById('reaction-op-time').textContent = opDiff;
                
                if (myDiff < opDiff) {
                    document.getElementById('reaction-winner').textContent = '¡GANASTE!';
                } else if (opDiff < myDiff) {
                    document.getElementById('reaction-winner').textContent = 'PERDISTE';
                } else {
                    document.getElementById('reaction-winner').textContent = 'EMPATE';
                }
                
                circle.className = "w-40 h-40  bg-surface-bright flex items-center justify-center text-on-surface-variant shadow-lg border-4 border-outline-variant/30 select-none";
                text.textContent = 'Fin';
            }
        }

        circle.addEventListener('mousedown', (e) => {
            if (state === 'go') {
                myTapTime = Date.now();
                WebRTCEngine.sendToPeer(window.activeGameSession.opponentId, PROTOCOL.REACTION_TAP, { tapTime: myTapTime });
                circle.className = "w-40 h-40  bg-primary/20 flex items-center justify-center text-primary shadow-lg border-4 border-primary/50 select-none";
                text.textContent = 'Tocado';
                checkWinner();
            } else if (state === 'ready') {
                text.textContent = '¡Muy pronto!';
            }
        });
        circle.addEventListener('touchstart', (e) => {
            e.preventDefault(); // prevent mouse emulation
            circle.dispatchEvent(new Event('mousedown'));
        });

        // Initiator coordinates the sequence
        if (isInitiator) {
            setTimeout(() => {
                WebRTCEngine.sendToPeer(window.activeGameSession.opponentId, PROTOCOL.REACTION_READY, {});
                window.reactionGameStart();
                
                const randomWait = Math.floor(Math.random() * 3000) + 2000; // 2 to 5 seconds
                setTimeout(() => {
                    const ts = Date.now();
                    WebRTCEngine.sendToPeer(window.activeGameSession.opponentId, PROTOCOL.REACTION_GO, { timestamp: ts });
                    window.reactionGameGo({ timestamp: ts });
                }, randomWait);
            }, 1000);
        }
    }

    // --- TRIVIA GLOBAL ---
    let triviaInterval = null;
    window.showTriviaModal = function(data) {
        const modal = document.getElementById('trivia-modal');
        const qEl = document.getElementById('trivia-question');
        const optContainer = document.getElementById('trivia-options');
        const timerEl = document.getElementById('trivia-timer');
        if(!modal || !qEl || !optContainer) return;
        
        qEl.textContent = data.question;
        optContainer.innerHTML = '';
        
        let timeLeft = 10;
        let answered = false;
        
        data.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = "w-full text-left bg-surface/50 border border-outline-variant/30 hover:border-primary hover:bg-primary/10  p-4 transition-all text-white text-[14px]";
            btn.textContent = opt;
            btn.onclick = () => {
                if (answered) return;
                answered = true;
                btn.classList.add('bg-primary', 'text-white', 'border-primary');
                WebRTCEngine.broadcast(PROTOCOL.TRIVIA_ANSWER, { answerIndex: idx, nombre: myNombre });
            };
            optContainer.appendChild(btn);
        });

        modal.classList.remove('hidden');
        timerEl.textContent = timeLeft;
        
        if(triviaInterval) clearInterval(triviaInterval);
        triviaInterval = setInterval(() => {
            timeLeft--;
            timerEl.textContent = timeLeft;
            if(timeLeft <= 0) {
                clearInterval(triviaInterval);
                setTimeout(() => {
                    modal.classList.add('hidden');
                }, 2000);
            }
        }, 1000);
    };

    window.currentGameType = null;
    window.activeGameSession = null; // { opponentId, opponentName }
    
    window.showGameLobby = function(gameType) {
        window.currentGameType = gameType;
        const list = document.getElementById('games-list-view');
        const lobby = document.getElementById('game-lobby-view');
        const active = document.getElementById('active-game-view');
        if(list) list.classList.add('hidden');
        if(active) active.classList.add('hidden');
        if(lobby) {
            lobby.classList.remove('hidden');
            const title = gameType === 'reaction' ? 'Carrera de Reacción' : (gameType === 'tictactoe' ? 'Tic Tac Toe' : 'Piedra Papel Tijera');
            document.getElementById('lobby-game-title').textContent = title;
            renderLobbyUsers();
        }
    };
    
    window.closeGameLobby = function() {
        window.currentGameType = null;
        document.getElementById('game-lobby-view').classList.add('hidden');
        document.getElementById('active-game-view').classList.add('hidden');
        document.getElementById('games-list-view').classList.remove('hidden');
    };

    function renderLobbyUsers() {
        const container = document.getElementById('lobby-users-list');
        if (!container) return;
        const peers = WebRTCEngine.getPeers().filter(p => p.nombre !== "Dashboard" && p.nombre !== "Organizador");
        
        if (peers.length === 0) {
            container.innerHTML = '<p class="text-[12px] text-on-surface-variant/50">No hay otros usuarios conectados.</p>';
            return;
        }

        container.innerHTML = peers.map(peer => `
            <div class="glass-card-solid flex items-center justify-between p-3 ">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8  flex items-center justify-center flex-shrink-0" style="background-color: ${peer.color ? peer.color + '20' : 'rgba(255,255,255,0.1)'}; color: ${peer.color || '#fff'}">
                        <span class="text-[14px]">${peer.avatar || '?'}</span>
                    </div>
                    <span class="font-bold text-[14px]" style="color: ${peer.color || '#fff'}">${peer.nombre}</span>
                </div>
                <button onclick="window.inviteToGame('${peer.id}', '${peer.nombre}')" class="btn-primary  px-4 py-1.5 text-[12px]">Retar</button>
            </div>
        `).join('');
    }

    window.inviteToGame = function(peerId, peerName) {
        if (!window.currentGameType) return;
        if (typeof showToast !== 'undefined') showToast(`Enviando reto a ${peerName}...`);
        WebRTCEngine.sendToPeer(peerId, PROTOCOL.GAME_INVITE, {
            gameType: window.currentGameType,
            nombre: myNombre
        });
    };


    window.renderPrivateChatList = function() {
        const container = document.getElementById('private-chats-container');
        if (!container) return;
        if (!window.privateChats || Object.keys(window.privateChats).length === 0) {
            container.innerHTML = '<div class="text-center font-label-mono text-[11px] text-on-surface-variant/40 mt-10 tracking-wide">No tienes chats privados activos.</div>';
            return;
        }

        const peers = WebRTCEngine.getPeers();
        let html = '';
        for (const [peerId, messages] of Object.entries(window.privateChats)) {
            if (messages.length === 0) continue;
            const lastMsg = messages[messages.length - 1];
            const peer = peers.find(p => p.id === peerId) || { nombre: 'Desconocido', color: '#fff' };
            const avatarChar = peer.avatar || peer.nombre.charAt(0).toUpperCase();
            
            html += `
                <div class="glass-card-solid flex items-center justify-between p-3  hover:border-primary/30 transition-all cursor-pointer" onclick="window.startPrivateChat('${peerId}', '${peer.nombre}')">
                    <div class="flex items-center gap-3 overflow-hidden">
                        <div class="w-10 h-10  flex items-center justify-center flex-shrink-0" style="background-color: ${peer.color ? peer.color + '20' : 'rgba(255,255,255,0.1)'}; color: ${peer.color || '#fff'}">
                            <span class="text-[16px]">${avatarChar}</span>
                        </div>
                        <div class="overflow-hidden">
                            <div class="font-headline-md text-on-surface font-semibold text-[14px] truncate">${peer.nombre}</div>
                            <div class="font-body-md text-[12px] text-on-surface-variant/70 truncate">${lastMsg.isSelf ? 'Tú: ' : ''}${lastMsg.text}</div>
                        </div>
                    </div>
                    <span class="material-symbols-outlined text-on-surface-variant/50 text-[18px]">chevron_right</span>
                </div>
            `;
        }
        container.innerHTML = html;
    };

    window.startPrivateChat = (peerId, name) => {
        window.activePrivateChatId = peerId;
        const title = document.getElementById('private-chat-title');
        const avatar = document.getElementById('private-chat-avatar');
        
        switchTab('tab-chat');
        if (subtabZona) {
            subtabZona.className = 'flex-1 py-2 font-bold text-on-surface-variant/70 border-b-2 border-transparent transition-all text-[14px]';
            if (subtabGlobal) subtabGlobal.className = 'flex-1 py-2 font-bold text-on-surface-variant/70 border-b-2 border-transparent transition-all text-[14px]';
            subtabPrivados.className = 'flex-1 py-2 font-bold text-primary border-b-2 border-primary transition-all text-[14px]';
        }

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
        
        if (chatZoneView) chatZoneView.classList.add('hidden');
        if (chatPrivatesListView) chatPrivatesListView.classList.add('hidden');
        if (chatPrivateConvView) chatPrivateConvView.classList.remove('hidden');
        
        setTimeout(() => {
            const input = document.getElementById('private-chat-input');
            if (input) input.focus();
        }, 50);
    };

    const backBtnPrivates = document.getElementById('btn-back-privates');
    if (backBtnPrivates) {
        backBtnPrivates.addEventListener('click', () => {
            window.activePrivateChatId = null;
            if (chatZoneView) chatZoneView.classList.add('hidden');
            if (chatPrivatesListView) chatPrivatesListView.classList.remove('hidden');
            if (chatPrivateConvView) chatPrivateConvView.classList.add('hidden');
            window.renderPrivateChatList();
        });
    }

    const privateChatForm = document.getElementById('private-chat-form');
    if (privateChatForm) {
        privateChatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('private-chat-input');
            const msg = input.value.trim();
            if (msg && window.activePrivateChatId) {
                if (!window.privateChats) window.privateChats = {};
                if (!window.privateChats[window.activePrivateChatId]) window.privateChats[window.activePrivateChatId] = [];
                window.privateChats[window.activePrivateChatId].push({ sender: myNombre, text: msg, isSelf: true });
                
                WebRTCEngine.sendToPeer(window.activePrivateChatId, PROTOCOL.CHAT, { text: msg, nombre: myNombre, isPrivate: true });
                window.renderPrivateMessages(window.activePrivateChatId);
                input.value = '';
                if (typeof window.renderPrivateChatList === 'function') window.renderPrivateChatList();
            }
        });
    }

    window.renderPrivateMessages = function(peerId) {
        const container = document.getElementById('private-chat-messages');
        if (!container) return;
        const messages = window.privateChats[peerId] || [];
        container.innerHTML = messages.map(m => {
            const bgClass = m.isSelf ? 'bg-gradient-to-br from-primary-container to-[#d63b38] text-white  ' : 'glass-card-solid text-on-surface   border border-outline-variant/30';
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

    WebRTCEngine.onMessage(PROTOCOL.PEER_LEAVE, (data) => {
        if (typeof AudioSystem !== "undefined") AudioSystem.play("leave");
    });
    WebRTCEngine.onMessage(PROTOCOL.PEER_EXIT, (data) => {
        if (typeof AudioSystem !== "undefined") AudioSystem.play("leave");
    });