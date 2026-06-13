# NodeMap — Sistema P2P para Feria Universitaria

Sistema de comunicación peer-to-peer en tiempo real usando WebRTC para visitantes de una feria universitaria. Los celulares se conectan directamente entre sí sin pasar por el servidor después de la señalización inicial.

## Cómo arrancar

```bash
cd server
npm install
node server.js
```

Al arrancar, el servidor imprime la URL de red local. Los celulares en la misma WiFi se conectan a esa URL.

## Acceso desde celulares

1. Conecta tu celular a la **misma red WiFi** que el servidor
2. Abre el browser del celular
3. Entra a la URL que imprime el servidor (ej: `http://192.168.1.50:3000`)

## Estructura del proyecto

| Carpeta/Archivo | Responsable | Descripción |
|---|---|---|
| `server/server.js` | Erasmo | Punto de entrada, Express + Socket.io |
| `server/signaling.js` | Erasmo | Lógica de señalización WebRTC |
| `shared/protocol.js` | Erasmo | Contrato de eventos del sistema |
| `shared/config.js` | Erasmo | Configuración centralizada |
| `client/webrtc.js` | Andrés | Motor WebRTC (API pública) |
| `client/peer.*` | Jesús | Interfaz del visitante |
| `client/display.*`, `recinto.svg` | María | Display de la feria |

## API de WebRTCEngine (para Jesús y María)

Cargar estos scripts en orden:
```html
<script src="/socket.io/socket.io.js"></script>
<script src="/shared/config.js"></script>
<script src="/shared/protocol.js"></script>
<script src="/webrtc.js"></script>
```

### Conectar
```javascript
WebRTCEngine.conectar("NombreDelVisitante");
```

### Enviar mensaje a un peer
```javascript
WebRTCEngine.sendMessage(peerId, PROTOCOL.CHAT, { texto: "Hola" });
```

### Enviar mensaje a todos
```javascript
WebRTCEngine.broadcast(PROTOCOL.POSITION, { zona: "Entrada" });
```

### Escuchar mensajes
```javascript
WebRTCEngine.onMessage(PROTOCOL.CHAT, (msg) => {
  console.log(msg.nombre + ": " + msg.texto);
});

WebRTCEngine.onMessage(PROTOCOL.PEER_JOIN, (data) => {
  console.log(data.nombre + " se conectó");
});

WebRTCEngine.onMessage(PROTOCOL.PEER_LEAVE, (data) => {
  console.log("Peer " + data.id + " se desconectó");
});
```

### Consultar peers conectados
```javascript
const peers = WebRTCEngine.getPeers();
// → [{ id: "abc123", nombre: "Juan" }, ...]
```

### Consultar latencia
```javascript
const ms = WebRTCEngine.getLatency(peerId);
// → 12.5 (ms) o null si no hay medición
```

## Endpoints del servidor

| Ruta | Descripción |
|---|---|
| `/health` | Health check (`{ status: "ok", uptime: N }`) |
| `/metrics` | Métricas en JSON (peers activos, mensajes, log) |
| `/test-signaling.html` | Página de prueba de señalización |
| `/poc/` | Prueba de concepto WebRTC manual entre tabs |

## Troubleshooting

**WebRTC no conecta entre celulares:**
- Verifica que ambos están en la misma WiFi
- Si la red tiene NAT estricto, agregar más STUN servers en `config.js`
- Revisa la consola del browser por errores ICE

**`getLatency()` retorna null:**
- Espera al menos 5 segundos después de conectar (intervalo de ping)
- Verifica que el DataChannel está abierto con `getPeers()`

**Un peer no aparece en `getPeers()`:**
- Solo aparecen peers con DataChannel en estado "open"
- Si acaba de conectar, espera unos segundos a que complete la negociación WebRTC