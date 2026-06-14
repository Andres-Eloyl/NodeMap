let currentZone = null;
let miNombre = "";

document.addEventListener("DOMContentLoaded", () => {
    // UI Elements
    const loginOverlay = document.getElementById("login-overlay");
    const appWrapper = document.getElementById("app-wrapper");
    const btnConnect = document.getElementById("btn-connect");
    const btnLogout = document.getElementById("btn-logout");
    const usernameInput = document.getElementById("username-input");
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");

    // Login
    btnConnect.addEventListener("click", () => {
        const val = usernameInput.value.trim();
        if (!val) {
            alert("Por favor ingresa un nombre o alias");
            return;
        }
        miNombre = val;
        
        // Hide overlay, show app
        loginOverlay.classList.add("hidden");
        appWrapper.classList.remove("hidden");
        appWrapper.classList.add("flex");
        
        // Connect WebRTC
        iniciarConexion();
    });
    
    // Logout
    btnLogout.addEventListener("click", () => {
        if(confirm("¿Seguro que quieres desconectarte de la red P2P?")) {
            window.location.reload();
        }
    });

    // Handle Enter key on login
    usernameInput.addEventListener("keypress", (e) => {
        if(e.key === "Enter") btnConnect.click();
    });

    // Handle chat submit
    chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const texto = chatInput.value.trim();
        if(!texto) return;
        
        // Enviar por red P2P (Global broadcast)
        WebRTCEngine.broadcast(PROTOCOL.CHAT, { id: null, nombre: miNombre, texto: texto });
        
        // Mostrar mensaje propio en UI
        addChatMessage(miNombre, texto, true);
        chatInput.value = "";
    });
});

// Tab Navigation Logic
window.switchTab = function(tabName) {
    const views = ['map', 'nodes', 'chat'];
    
    // Hide all views, deselect all tabs
    views.forEach(v => {
        document.getElementById(`view-${v}`).classList.add("hidden");
        document.getElementById(`view-${v}`).classList.remove("flex");
        
        const tabEl = document.getElementById(`nav-${v}`);
        tabEl.classList.remove("text-primary", "dark:text-primary", "border-t-2", "border-primary", "-mt-[2px]");
        tabEl.classList.add("text-on-secondary-container", "dark:text-on-secondary-container");
        
        // Icons: fill when active
        const icon = tabEl.querySelector("span.material-symbols-outlined");
        if(v === tabName) {
            icon.style.fontVariationSettings = "'FILL' 1";
        } else {
            icon.style.fontVariationSettings = "'FILL' 0";
        }
    });
    
    // Show selected view, select tab
    const activeView = document.getElementById(`view-${tabName}`);
    activeView.classList.remove("hidden");
    if(tabName === 'chat' || tabName === 'nodes') {
        activeView.classList.add("flex"); // Because chat/nodes use flex
    }
    
    const activeTab = document.getElementById(`nav-${tabName}`);
    activeTab.classList.remove("text-on-secondary-container", "dark:text-on-secondary-container");
    activeTab.classList.add("text-primary", "dark:text-primary", "border-t-2", "border-primary", "-mt-[2px]");
};

// Map Zones Interaction
window.setZone = function(zonaName) {
    currentZone = zonaName;
    document.getElementById("current-zone-display").innerText = zonaName;
    
    // Quitar highlight a todos
    document.querySelectorAll("[data-zone]").forEach(el => {
        el.classList.remove("border-primary", "bg-primary/20", "border-secondary", "bg-secondary/20", "border-tertiary", "bg-tertiary/20");
    });
    
    // Agregar highlight al seleccionado
    const selected = document.querySelector(`[data-zone="${zonaName}"]`);
    if(selected) {
        if(zonaName === 'Zona A' || zonaName === 'Entrada' || zonaName === 'Escenario') {
            selected.classList.add("border-primary", "bg-primary/20");
        } else if (zonaName === 'Zona B') {
            selected.classList.add("border-secondary", "bg-secondary/20");
        } else if (zonaName === 'Zona C') {
            selected.classList.add("border-tertiary", "bg-tertiary/20");
        } else {
            selected.classList.add("border-primary", "bg-primary/20");
        }
    }
    
    // Broadcast por WebRTC al display central
    if(window.WebRTCEngine && WebRTCEngine.myId) {
        WebRTCEngine.broadcast(PROTOCOL.POSITION, { id: null, nombre: miNombre, zona: currentZone });
    }
};

// --- WebRTC Logic ---
function iniciarConexion() {
    WebRTCEngine.conectar(miNombre);
    
    // Listeners
    WebRTCEngine.onMessage(PROTOCOL.PEER_LIST, (data) => {
        renderNodesList();
    });
    
    WebRTCEngine.onMessage(PROTOCOL.PEER_JOIN, (p) => {
        renderNodesList();
        addChatMessage("Sistema", `🟢 ${p.nombre} se unió a la red.`, false, true);
    });
    
    WebRTCEngine.onMessage(PROTOCOL.PEER_LEAVE, (p) => {
        renderNodesList();
    });
    
    WebRTCEngine.onMessage(PROTOCOL.PEER_EXIT, (p) => {
        renderNodesList();
        addChatMessage("Sistema", `🟡 ${p.nombre} salió voluntariamente.`, false, true);
    });
    
    WebRTCEngine.onMessage(PROTOCOL.CHAT, (m) => {
        addChatMessage(m.nombre, m.texto, false);
    });
    
    // Actualizar ID propio
    setTimeout(() => {
        const miIdEl = document.getElementById("my-id-display");
        if(WebRTCEngine.myId && miIdEl) {
            miIdEl.innerText = WebRTCEngine.myId.substr(0, 8);
        }
        renderNodesList();
        
        // Ponerlo en Entrada por defecto si no eligió
        if(!currentZone) {
            window.setZone("Entrada");
        }
    }, 1500);
    
    // Refresco periódico de latencia/nodos
    setInterval(renderNodesList, 3000);
}

function renderNodesList() {
    const listEl = document.getElementById("nodes-list");
    if(!listEl) return;
    
    const peers = WebRTCEngine.getPeers();
    if(peers.length === 0) {
        listEl.innerHTML = `<div class="text-center text-on-surface-variant text-sm mt-4">Esperando a otros peers...</div>`;
        return;
    }
    
    listEl.innerHTML = "";
    peers.forEach(p => {
        const lat = WebRTCEngine.getLatency(p.id) || 0;
        let latColor = "text-green-400";
        if(lat > 200) latColor = "text-yellow-400";
        if(lat > 500) latColor = "text-red-400";
        
        const card = document.createElement("div");
        card.className = "bg-surface-container-low p-3 rounded-lg border border-outline-variant flex justify-between items-center";
        card.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    ${p.nombre ? p.nombre.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                    <div class="text-sm font-semibold text-on-surface">${p.nombre}</div>
                    <div class="text-[10px] text-on-surface-variant font-mono">${p.id.substr(0,6)}...</div>
                </div>
            </div>
            <div class="flex flex-col items-end">
                <div class="text-xs ${latColor} font-bold flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">signal_cellular_alt</span> ${lat}ms
                </div>
            </div>
        `;
        listEl.appendChild(card);
    });
}

function addChatMessage(remitente, texto, isMe, isSystem = false) {
    const container = document.getElementById("chat-messages");
    if(!container) return;
    
    const div = document.createElement("div");
    
    if (isSystem) {
        div.className = "text-center text-xs text-on-surface-variant my-2";
        div.innerText = texto;
    } else {
        div.className = `flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`;
        
        const nameDiv = document.createElement("div");
        nameDiv.className = "text-[10px] text-on-surface-variant mb-1 ml-1";
        nameDiv.innerText = remitente;
        
        const bubble = document.createElement("div");
        bubble.className = `px-4 py-2 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-primary text-on-primary rounded-tr-sm' : 'bg-surface-container text-on-surface border border-outline-variant rounded-tl-sm'}`;
        bubble.innerText = texto;
        
        div.appendChild(nameDiv);
        div.appendChild(bubble);
    }
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}
