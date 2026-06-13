/**
 * MockWebRTC - Simulador de WebRTCEngine para desarrollo
 * Replica la API de window.WebRTCEngine para permitir el desarrollo UI sin la red real.
 */
(function() {
    // Estado inicial
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

    // Registro de callbacks
    const callbacks = {
        "peer-join": [],
        "peer-leave": [],
        "peer-exit": [],
        "chat": [],
        "position": []
    };

    // Referencias a los temporizadores para poder limpiarlos
    let timers = {};

    // Constantes para simulación
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

    // Funciones de utilidad
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const getDynamicPeers = () => peers.filter(p => !originalPeers.find(op => op.id === p.id));

    /**
     * Dispara un evento llamando a todos los callbacks registrados para ese tipo
     * @param {string} tipo - Tipo de evento (ej. "chat", "position")
     * @param {Object} datos - Payload del evento
     */
    const triggerEvent = (tipo, datos) => {
        if (callbacks[tipo]) {
            callbacks[tipo].forEach(cb => cb(datos));
        }
    };

    /**
     * Configura un temporizador con variación aleatoria que se re-programa a sí mismo
     * @param {string} name - Nombre del temporizador (para poder detenerlo)
     * @param {number} minMs - Mínimo de milisegundos
     * @param {number} maxMs - Máximo de milisegundos
     * @param {Function} action - Función a ejecutar
     */
    const setRandomTimer = (name, minMs, maxMs, action) => {
        if (!isRunning) return;
        const delay = getRandomInt(minMs, maxMs);
        timers[name] = setTimeout(() => {
            if (!isRunning) return;
            action();
            // Auto-reiniciar el temporizador con un nuevo intervalo aleatorio
            setRandomTimer(name, minMs, maxMs, action);
        }, delay);
    };

    // --- Acciones Simuladas ---

    const simularChat = () => {
        if (peers.length < 2) return;
        
        const emisor = getRandomElement(peers);
        let destino = getRandomElement(peers);
        
        // Asegurar que el destino sea distinto al emisor
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
        
        // Asegurar que la zona sea distinta a la actual
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

    // --- API Pública (Mapea a window.MockWebRTC) ---
    window.MockWebRTC = {
        /**
         * Devuelve la lista actual de peers conectados
         * @returns {Array<{id: string, nombre: string, zona: string}>}
         */
        getPeers: function() {
            // Se retorna una copia profunda para evitar mutaciones externas
            return JSON.parse(JSON.stringify(peers));
        },

        /**
         * Registra un callback para un evento específico
         * @param {string} tipo - Tipo de evento ("peer-join", "peer-leave", "peer-exit", "chat", "position")
         * @param {Function} callback - Función a ejecutar
         */
        onMessage: function(tipo, callback) {
            if (!callbacks[tipo]) {
                callbacks[tipo] = [];
            }
            callbacks[tipo].push(callback);
        },

        /**
         * Simula el envío de un mensaje a todos los peers conectados
         * @param {string} tipo - Tipo de mensaje
         * @param {Object} datos - Contenido del mensaje
         */
        broadcast: function(tipo, datos) {
            console.log(`[MockWebRTC] broadcast(${tipo})`, datos);
        },

        /**
         * Simula el envío de un mensaje a un peer específico
         * @param {string} peerId - ID del destinatario
         * @param {string} tipo - Tipo de mensaje
         * @param {Object} datos - Contenido del mensaje
         */
        sendMessage: function(peerId, tipo, datos) {
            console.log(`[MockWebRTC] sendMessage a ${peerId} (${tipo})`, datos);
        },

        /**
         * Retorna una latencia simulada si el peer existe
         * @param {string} peerId - ID del peer a consultar
         * @returns {number|null} Latencia en milisegundos (5-45) o null si el peer no existe
         */
        getLatency: function(peerId) {
            const existe = peers.some(p => p.id === peerId);
            if (!existe) return null;
            return getRandomInt(5, 45);
        },

        /**
         * (Método Extra) Inicia la simulación de eventos con temporizadores orgánicos
         */
        start: function() {
            if (isRunning) return;
            isRunning = true;
            console.log("[MockWebRTC] Iniciando simulación de eventos...");
            
            // CHAT cada 3-5 segundos
            setRandomTimer("chat", 3000, 5000, simularChat);
            // POSITION cada 5-8 segundos
            setRandomTimer("position", 5000, 8000, simularPosition);
            // PEER_JOIN cada 10-15 segundos
            setRandomTimer("join", 10000, 15000, simularPeerJoin);
            // PEER_LEAVE cada 20-30 segundos
            setRandomTimer("leave", 20000, 30000, simularPeerLeave);
            // PEER_EXIT cada 25-35 segundos
            setRandomTimer("exit", 25000, 35000, simularPeerExit);
        },

        /**
         * (Método Extra) Detiene la simulación de eventos
         */
        stop: function() {
            if (!isRunning) return;
            isRunning = false;
            console.log("[MockWebRTC] Deteniendo simulación...");
            
            // Limpiar todos los timeouts activos
            for (let key in timers) {
                clearTimeout(timers[key]);
            }
            timers = {};
        }
    };
})();
