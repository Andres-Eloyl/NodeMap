(function() {
    const originalPeers = [
        { id: "p1", nombre: "Carlos", zona: "Zona A" },
        { id: "p2", nombre: "Ana", zona: "Zona B" },
        { id: "p3", nombre: "Pedro", zona: "Zona A" },
        { id: "p4", nombre: "Laura", zona: "Pasillo" },
        { id: "p5", nombre: "Miguel", zona: "Escenario" }
    ];

    let peers = [...originalPeers];
    let visitorCounter = 1;
    let isRunning = false;
    const callbacks = {
        "peer-join": [],
        "peer-leave": [],
        "peer-exit": [],
        "chat": [],
        "position": []
    };
    let timers = {};
    const zonasPosibles = ["Zona A", "Zona B", "Zona C", "Pasillo", "Escenario", "Entrada"];
    
    const mensajesChat = [
        "¡Hola a todos!",
        "¿Dónde es la siguiente charla?",
        "Qué interesante este stand.",
        "Nos vemos en el pasillo.",
        "¿Alguien más tiene problemas de conexión?",
        "Genial la presentación.",
        "Voy para la Zona B.",
        "¿A qué hora termina la feria?",
        "Me encantó el proyecto de robótica.",
        "Saludos desde el escenario.",
        "¡Qué buena idea!",
        "¿Me escuchan bien?"
    ];
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const getDynamicPeers = () => peers.filter(p => !originalPeers.find(op => op.id === p.id));

    
    const triggerEvent = (tipo, datos) => {
        if (callbacks[tipo]) {
            callbacks[tipo].forEach(cb => cb(datos));
        }
    };

    
    const setRandomTimer = (name, minMs, maxMs, action) => {
        if (!isRunning) return;
        const delay = getRandomInt(minMs, maxMs);
        timers[name] = setTimeout(() => {
            if (!isRunning) return;
            action();
            setRandomTimer(name, minMs, maxMs, action);
        }, delay);
    };

    const simularChat = () => {
        if (peers.length < 2) return;
        
        const emisor = getRandomElement(peers);
        let destino = getRandomElement(peers);
        while (destino.id === emisor.id) {
            destino = getRandomElement(peers);
        }
        
        triggerEvent("chat", {
            id: emisor.id,
            nombre: emisor.nombre,
            texto: getRandomElement(mensajesChat),
            destino: destino.id
        });
    };

    const simularPosition = () => {
        if (peers.length === 0) return;
        
        const peer = getRandomElement(peers);
        let nuevaZona = getRandomElement(zonasPosibles);
        while (nuevaZona === peer.zona) {
            nuevaZona = getRandomElement(zonasPosibles);
        }
        
        peer.zona = nuevaZona; // Actualizar el estado interno
        triggerEvent("position", {
            id: peer.id,
            nombre: peer.nombre,
            zona: nuevaZona
        });
    };

    const simularPeerJoin = () => {
        const nuevoId = `v${visitorCounter}`;
        const nuevoNombre = `Visitante ${visitorCounter}`;
        const nuevaZona = getRandomElement(zonasPosibles);
        visitorCounter++;

        const nuevoPeer = { id: nuevoId, nombre: nuevoNombre, zona: nuevaZona };
        peers.push(nuevoPeer);
        
        triggerEvent("peer-join", { 
            id: nuevoId, 
            nombre: nuevoNombre 
        });
    };

    const simularPeerLeave = () => {
        const dinamicos = getDynamicPeers();
        if (dinamicos.length === 0) return;
        
        const peer = getRandomElement(dinamicos);
        peers = peers.filter(p => p.id !== peer.id);
        
        triggerEvent("peer-leave", { id: peer.id });
    };

    const simularPeerExit = () => {
        const dinamicos = getDynamicPeers();
        if (dinamicos.length === 0) return;
        
        const peer = getRandomElement(dinamicos);
        peers = peers.filter(p => p.id !== peer.id);
        
        triggerEvent("peer-exit", { 
            id: peer.id, 
            nombre: peer.nombre 
        });
    };
    window.MockWebRTC = {
        
        getPeers: function() {
            return JSON.parse(JSON.stringify(peers));
        },

        
        onMessage: function(tipo, callback) {
            if (!callbacks[tipo]) {
                callbacks[tipo] = [];
            }
            callbacks[tipo].push(callback);
        },

        
        broadcast: function(tipo, datos) {
            console.log(`[MockWebRTC] broadcast(${tipo})`, datos);
        },

        
        sendMessage: function(peerId, tipo, datos) {
            console.log(`[MockWebRTC] sendMessage a ${peerId} (${tipo})`, datos);
        },

        
        getLatency: function(peerId) {
            const existe = peers.some(p => p.id === peerId);
            if (!existe) return null;
            return getRandomInt(5, 45);
        },

        
        start: function() {
            if (isRunning) return;
            isRunning = true;
            console.log("[MockWebRTC] Iniciando simulación de eventos...");
            setRandomTimer("chat", 3000, 5000, simularChat);
            setRandomTimer("position", 5000, 8000, simularPosition);
            setRandomTimer("join", 10000, 15000, simularPeerJoin);
            setRandomTimer("leave", 20000, 30000, simularPeerLeave);
            setRandomTimer("exit", 25000, 35000, simularPeerExit);
        },

        
        stop: function() {
            if (!isRunning) return;
            isRunning = false;
            console.log("[MockWebRTC] Deteniendo simulación...");
            for (let key in timers) {
                clearTimeout(timers[key]);
            }
            timers = {};
        }
    };
})();
