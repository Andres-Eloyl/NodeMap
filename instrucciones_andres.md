# INSTRUCCIONES PARA ANDRÉS — Motor WebRTC

---

## ¿Qué es tu parte?

Tu trabajo es la pieza más técnica del proyecto y la más importante. Implementas toda la lógica que hace que los celulares se hablen directamente entre sí sin pasar por ningún servidor. Todo el mundo depende de lo que construyas: Jesús y María usan tu módulo como caja negra para enviar mensajes, recibir eventos y consultar la red.

Tu entrega es un único archivo: `webrtc.js`. Ese archivo contiene todo el motor WebRTC del sistema y expone una API simple y documentada para que Jesús y María puedan usarlo sin necesitar entender WebRTC internamente.

---

## Lo primero que haces — Día 1

No escribas código el día 1. Dedica ese día completo a entender el flujo de conexión WebRTC antes de tocar el teclado. Es la inversión más importante que puedes hacer porque te ahorra dos días de bugs.

El flujo que debes entender es este:

```text
Peer A se conecta al servidor de Erasmo via Socket.io
    ↓
Servidor le manda PEER_LIST con los peers existentes
    ↓
Peer A crea una RTCPeerConnection hacia cada peer existente
    ↓
Peer A genera una OFFER (SDP) y la manda al servidor
    ↓
Servidor retransmite la OFFER al Peer B
    ↓
Peer B recibe la OFFER, genera una ANSWER (SDP) y la manda al servidor
    ↓
Servidor retransmite la ANSWER al Peer A
    ↓
Ambos peers intercambian ICE candidates via el servidor
    ↓
ICE encuentra la ruta directa entre los dos peers
    ↓
Se establece la conexión P2P directa con RTCDataChannel
    ↓
El servidor ya no interviene en ningún mensaje entre estos dos peers
```

Cuando tengas el flujo claro, haz una prueba de concepto: abre dos tabs del mismo browser y conecta una con la otra usando WebRTC sin servidor, copiando y pegando el SDP manualmente entre tabs. Cuando eso funcione ya entiendes el flujo real.

---

## Tu archivo — solo tú lo modificas

```text
client/webrtc.js
```

Nadie más toca ese archivo. Si Jesús o María necesitan un cambio en la API te lo piden a ti y tú lo haces.

---

## Lo que necesitas de Erasmo antes de arrancar con el servidor

El día 2 Erasmo sube al repositorio `protocol.js` y `config.js`. Necesitas esos dos archivos para:

- `protocol.js` — los nombres exactos de todos los eventos (PEER_JOIN, OFFER, ANSWER, ICE_CANDIDATE, etc.)
- `config.js` — los STUN servers que usas para configurar RTCPeerConnection

El día 1 trabajas sin servidor haciendo la prueba de concepto entre dos tabs. El día 2 cuando Erasmo suba esos archivos conectas todo al servidor real.

---

## La API pública que debes exponer

Jesús y María usan estas funciones. Sus nombres, parámetros y comportamiento son fijos. No los cambies sin avisar al grupo.

**sendMessage(peerId, tipo, datos)**
Envía un mensaje a un peer específico por su DataChannel. `peerId` es el ID del peer destino, `tipo` es una constante de protocol.js (CHAT, POSITION, PING, PONG), `datos` es el objeto con los campos del mensaje. Si el peer no existe o su DataChannel está cerrado, no hace nada y no lanza error.

**broadcast(tipo, datos)**
Envía el mismo mensaje a todos los peers conectados simultáneamente. Llama a `sendMessage` internamente para cada peer en la lista.

**onMessage(tipo, callback)**
Registra una función que se llama cada vez que llega un mensaje de ese tipo. Se pueden registrar múltiples callbacks para el mismo tipo. Jesús la usa para escuchar CHAT y POSITION. María la usa para escuchar CHAT, POSITION, PEER_JOIN, PEER_LEAVE y PEER_EXIT.

**getPeers()**
Devuelve la lista actual de peers conectados como un array de objetos `{ id, nombre }`. Solo incluye peers con DataChannel abierto y funcionando.

**getLatency(peerId)**
Devuelve la última latencia medida hacia un peer específico en milisegundos. Retorna `null` si no hay medición todavía.

---

## Semana 1 — Lo que haces día a día

### Día 1 — Estudio y prueba de concepto

Estudia el flujo WebRTC. Luego abre dos tabs del mismo browser y realiza una conexión WebRTC manual paso a paso. En la tab A crea una RTCPeerConnection y genera una offer con `createOffer()`. Copia el SDP y pégalo en la tab B con `setRemoteDescription()`. En la tab B genera una answer con `createAnswer()`. Copia el SDP y pégalo en la tab A. Intercambia ICE candidates manualmente entre las dos tabs. Cuando el DataChannel abra, manda un mensaje de prueba. Cuando esto funciona entiendes el flujo completo.

### Días 2 y 3 — RTCPeerConnection con el servidor de Erasmo

Cuando Erasmo suba `protocol.js` y `config.js` conectas al servidor real.

Al cargar `webrtc.js` se conecta automáticamente al servidor de Erasmo via Socket.io. Cuando recibe `PEER_LIST` con los peers existentes, por cada peer en la lista inicia una conexión WebRTC aplicando esta regla: el peer con el ID alfabéticamente menor hace el OFFER, el peer con ID mayor espera el ANSWER. Esta regla la definió Erasmo para evitar colisiones cuando dos peers se conectan al mismo tiempo.

Cuando el servidor notifica `PEER_JOIN` (nuevo peer entrando), inicia una conexión WebRTC con él aplicando la misma regla.

**Si te toca hacer OFFER:**
Crea RTCPeerConnection con los STUN servers de `config.js`, crea el DataChannel, llama a `createOffer()`, guarda con `setLocalDescription()`, manda la offer al servidor con el campo `destino` apuntando al ID del peer.

**Si te toca hacer ANSWER:**
Cuando recibes una OFFER del servidor, crea RTCPeerConnection, guarda la offer con `setRemoteDescription()`, llama a `createAnswer()`, guarda con `setLocalDescription()`, manda el answer al servidor con el campo `destino`.

**ICE candidates:**
Cada RTCPeerConnection genera ICE candidates automáticamente en el evento `onicecandidate`. Cada candidate que genera lo mandas al servidor con el ID del peer destino. Cuando recibes un ICE candidate del servidor lo agregas con `addIceCandidate()`. Importante: si recibes ICE candidates antes de que hayas llamado a `setRemoteDescription()`, guárdalos en un buffer y agrégalos cuando el remoteDescription esté listo.

### Días 3 al 5 — DataChannel y API pública

El peer que hace OFFER crea el DataChannel antes de generar la offer. El peer que hace ANSWER lo recibe en el evento `ondatachannel`. Cuando el DataChannel está abierto (evento `onopen`) agregas el peer a la lista interna de peers conectados.

Cuando llega un mensaje por el DataChannel (`onmessage`), parseas el JSON, lees el campo `tipo` y llamas a todos los callbacks registrados con `onMessage()` para ese tipo.

Implementa toda la API pública: `sendMessage`, `broadcast`, `onMessage`, `getPeers` y `getLatency`. Prueba cada función manualmente entre dos browsers antes de marcarla como lista.

### Días 5 y 6 — Escalar a N peers

Cuando entra un peer nuevo se conecta con todos los que ya están, no solo con el último. Verifica con 3 browsers simultáneos que todos se conectan entre sí correctamente.

**Cuando un peer se desconecta (PEER_LEAVE):**
Cierras su RTCPeerConnection con `.close()`, cierras su DataChannel con `.close()`, lo eliminas de la lista interna, llamas a todos los callbacks de `onMessage("peer-leave")` con `{ id }`.

**Cuando un peer sale voluntariamente (PEER_EXIT):**
Mismo proceso que PEER_LEAVE pero llamas a los callbacks de `onMessage("peer-exit")` con `{ id, nombre }`.

### Día 7 — Publicar webrtc.js

Cuando las cinco funciones de la API estén funcionando y probadas entre browsers reales, subes `webrtc.js` al repositorio y avisas al grupo. Jesús y María reemplazan su mock por el archivo real. Asegúrate de que cada función tiene un comentario explicando qué hace, qué parámetros recibe y qué devuelve.

---

## Semana 2 — Ping/pong y latencia

### Días 8 al 10 — Implementar latencia real

El sistema de ping/pong funciona por DataChannel directamente entre peers, el servidor de Erasmo no interviene.

Cada 5 segundos mandas un PING a cada peer con `{ timestamp: Date.now() }`. Cuando recibes un PING de otro peer respondes inmediatamente con PONG usando exactamente el mismo timestamp que vino en el PING sin modificarlo. Cuando recibes un PONG calculas la latencia: `latencia = (Date.now() - pong.timestamp) / 2`. Guardas esa latencia en un objeto interno indexado por peer ID. `getLatency(peerId)` devuelve el último valor guardado.

### Días 11 al 14 — Reconexión y pruebas con celulares

Si un DataChannel se cierra inesperadamente detectas el evento `onclose`. Intentas reconectar automáticamente una vez esperando 2 segundos. Si la reconexión falla, tratas al peer como desconectado y notificas con `onMessage("peer-leave")`.

Prueba con 3 celulares reales en la misma red WiFi. Verifica que los tres se conectan entre sí, el chat llega a todos, la latencia se mide correctamente, cuando uno se va los otros dos lo detectan, y cuando vuelve a entrar se reconecta con todos.

---

## Semana 3 — Pruebas de carga y feria

### Días 15 al 17 — Pruebas con 6 o más dispositivos

Con muchas conexiones simultáneas pueden aparecer bugs que no surgieron con pocos peers. Los más comunes son:

Dos peers intentan hacer OFFER al mismo tiempo y ninguno recibe ANSWER — verifica que la regla del ID menor se aplica correctamente en todos los casos.

ICE candidates que llegan antes de que se haya establecido el `remoteDescription` — verifica que el buffer los guarda y los agrega correctamente cuando el remoteDescription está listo.

DataChannels que se abren pero nunca reciben mensajes — verifica que el evento `onopen` se dispara correctamente en ambos lados.

### Días 18 al 21 — Feria

Prueba el sistema en la red WiFi real del recinto. Si WebRTC no conecta en esa red el problema es NAT estricto, avísale a Erasmo para que agregue más STUN servers en `config.js`. Prepara las respuestas del jurado que están abajo.

---

## Tus entregas críticas

| Día | Qué entregas | Quién lo necesita |
|---|---|---|
| Día 1 | Prueba de concepto entre dos tabs funcionando | Solo tú |
| Día 5 | DataChannel funcionando entre dos browsers reales | Erasmo (pruebas) |
| Día 7 | `webrtc.js` completo y documentado subido al repo | Jesús y María |
| Día 10 | `getLatency()` funcionando con ping/pong real | Jesús y María |
| Día 14 | Pruebas exitosas con 3 celulares reales | Todo el equipo |
| Día 17 | Pruebas exitosas en red WiFi real del recinto | Todo el equipo |

---

## Lo que NO haces

- No tocas `server.js` ni `signaling.js` — esos son de Erasmo
- No tocas `peer.html`, `peer.js`, `peer.css` — esos son de Jesús
- No tocas `display.html`, `display.js`, `recinto.svg` — esos son de María
- No tocas `protocol.js` ni `config.js` — esos son de Erasmo
- No usas GPS ni coordenadas — la posición es siempre el nombre de una zona como texto

---

## Reglas del equipo

- Cada vez que hagas un cambio importante en `webrtc.js` lo subes al repositorio y avisas en el grupo diciendo qué cambiaste, porque Jesús y María están trabajando sobre tu código
- Si Jesús o María reportan que algo de la API no funciona como esperaban, lo atiendes con prioridad
- Si llevas más de 2 horas atascado en algo, lo dices en el grupo
- La semana 3 es de pruebas, no de código nuevo

---

## Lo que necesitas saber antes de arrancar

- JavaScript intermedio-avanzado
- El flujo de WebRTC — dedica el día 1 completo a entenderlo antes de escribir código
- No necesitas saber nada de D3.js ni de diseño móvil

---

## Preguntas que te puede hacer el jurado

**¿Qué es WebRTC?**
Es una API nativa del browser que permite comunicación directa entre dispositivos sin servidor intermediario. Es el mismo protocolo que usa Google Meet y WhatsApp Web. En este proyecto lo usamos para el DataChannel que transporta los mensajes de chat y posición directamente entre celulares.

**¿Qué es SDP?**
Es el formato que usan dos peers para negociar su conexión. Contiene información sobre los codecs soportados, las direcciones IP, los puertos disponibles y las capacidades de cada dispositivo. El intercambio de SDP (offer y answer) establece los parámetros de la conexión antes de que empiece a fluir cualquier dato.

**¿Qué son los ICE candidates?**
ICE (Interactive Connectivity Establishment) es el mecanismo que usa WebRTC para encontrar la mejor ruta entre dos peers. Genera candidatos de conexión: direcciones IP locales, direcciones públicas obtenidas del servidor STUN, y rutas via servidor TURN como último recurso. Los peers intercambian estos candidatos y prueban cada uno hasta encontrar el que funciona.

**¿Qué es NAT traversal y cómo lo resuelve ICE?**
NAT es lo que hace el router cuando te asigna una IP privada y traduce el tráfico a la IP pública. El problema es que dos peers detrás de NAT no saben sus direcciones públicas y no pueden conectarse directamente. ICE resuelve esto consultando un servidor STUN que le dice a cada peer cuál es su dirección pública. Con esa información los dos peers pueden encontrarse.

**¿Qué es DTLS y por qué los mensajes van cifrados?**
DTLS es el protocolo de cifrado que WebRTC usa obligatoriamente en todos sus canales. No es opcional, está mandado por el estándar WebRTC. Significa que todos los mensajes que viajan por el DataChannel van cifrados de extremo a extremo. Ni el servidor de señalización ni nadie en la red puede leer su contenido.

**¿Por qué usan UDP y no TCP para el DataChannel?**
El DataChannel usa SCTP sobre UDP. UDP tiene menor latencia que TCP porque no espera confirmación de entrega. Para mensajes en tiempo real es preferible que lleguen rápido aunque alguno se pierda ocasionalmente, a que lleguen todos pero con retraso.

**¿Qué pasa si un peer se desconecta?**
El DataChannel dispara el evento `onclose`. El código cierra la RTCPeerConnection, elimina al peer de la lista interna y notifica a Jesús y María a través del callback de `onMessage("peer-leave")`. La red continúa funcionando entre los peers restantes sin ninguna interrupción.

**¿Cómo se conecta un peer nuevo con todos los existentes?**
Cuando el servidor notifica la entrada de un nuevo peer, el código establece una RTCPeerConnection con cada peer existente de forma simultánea. El peer con el ID alfabéticamente menor siempre hace el OFFER para evitar colisiones. El resultado es una topología mesh completa donde cada peer tiene un canal directo con todos los demás.
