# Instrucciones del Proyecto — Erasmo
## Rol: Servidor de Señalización

---

## ¿Qué es tu parte?

Tu trabajo es el servidor central del proyecto. Es la pieza que todos necesitan para arrancar, así que eres el primero en entregar algo funcional y el primero en crear el repositorio.

Tu servidor hace tres cosas y solo tres:

1. Recibe a cada celular cuando se conecta, le asigna un ID único y le avisa a todos los demás que hay un peer nuevo
2. Retransmite los mensajes de señalización entre peers (OFFER, ANSWER, ICE_CANDIDATE) para que puedan establecer su conexión directa
3. Sirve los archivos HTML del proyecto al browser con Express

Una vez que dos dispositivos se conectan entre sí vía WebRTC, tu servidor **ya no interviene en ningún mensaje**. El chat, la posición y la latencia viajan directamente entre celulares sin pasar por ti.

---

## Lo primero que haces — Día 1

Antes de escribir una sola línea de código, creas el repositorio en GitHub y avisas al grupo. Todos van a clonar ese repositorio para trabajar. Sin esto nadie puede arrancar.

**Pasos:**
- Crea una cuenta en GitHub si no tienes una
- Crea un repositorio nuevo llamado `proyecto-p2p`
- Marca el repositorio como privado e invita a Andrés, Jesús y María como colaboradores
- Crea la estructura de carpetas vacías y súbela en el primer commit
- Avisa en el grupo con el link del repositorio

**Estructura de carpetas que creas desde el día 1:**

```
proyecto-p2p/
├── server/
│   ├── server.js          ← tu archivo principal
│   ├── signaling.js       ← tu lógica de señalización
│   └── package.json       ← tus dependencias
├── client/
│   ├── peer.html          ← de Jesús (vacío por ahora)
│   ├── peer.js            ← de Jesús (vacío por ahora)
│   ├── peer.css           ← de Jesús (vacío por ahora)
│   ├── display.html       ← de María (vacío por ahora)
│   ├── display.js         ← de María (vacío por ahora)
│   ├── recinto.svg        ← de María (vacío por ahora)
│   └── webrtc.js          ← de Andrés (vacío por ahora)
└── shared/
    ├── protocol.js        ← TÚ defines, todos usan
    └── config.js          ← TÚ defines, todos usan
```

Crea todos los archivos vacíos desde el inicio. Así cada quien sabe exactamente qué archivo le toca sin confusión.

---

## Tus archivos — solo tú los modificas

```
server/server.js
server/signaling.js
server/package.json
shared/protocol.js
shared/config.js
```

Nadie más toca esos archivos. Si alguien necesita un cambio en `protocol.js` o `config.js` te lo pide a ti y tú lo haces.

---

## Antes de escribir código

Instala Node.js si no lo tienes. Luego en la carpeta `server/` ejecuta en la terminal:

```
npm init -y
npm install express socket.io
```

Eso crea el `package.json` con las únicas dos dependencias que necesitas.

---

## El archivo más crítico: protocol.js

Este archivo lo entregas el **día 2** en el repositorio. Es la base de todo el sistema porque define exactamente cómo se llama cada tipo de mensaje y qué campos lleva. Si Andrés, Jesús o María usan un nombre de campo diferente al que tú defines aquí, el sistema falla cuando integren todo. Así que este archivo debe ser claro, completo y sin ambigüedad.

### Tipos de mensajes

| Constante | Valor exacto | Quién lo emite | Quién lo recibe |
|---|---|---|---|
| `PEER_JOIN` | "peer-join" | Servidor | Todos los peers |
| `PEER_LEAVE` | "peer-leave" | Servidor | Todos los peers |
| `PEER_EXIT` | "peer-exit" | Servidor | Todos los peers |
| `PEER_LIST` | "peer-list" | Servidor | Solo el peer nuevo |
| `OFFER` | "offer" | Un peer | Servidor (retransmite) |
| `ANSWER` | "answer" | Un peer | Servidor (retransmite) |
| `ICE_CANDIDATE` | "ice-candidate" | Un peer | Servidor (retransmite) |
| `CHAT` | "chat" | DataChannel directo | DataChannel directo |
| `POSITION` | "position" | DataChannel directo | DataChannel directo |
| `PING` | "ping" | DataChannel directo | DataChannel directo |
| `PONG` | "pong" | DataChannel directo | DataChannel directo |

Los mensajes marcados como **DataChannel directo** nunca pasan por tu servidor. Tu servidor no los ve ni los toca.

---

### Formato exacto de cada mensaje

Este es el contrato del sistema. Cada campo tiene un nombre fijo. No se puede cambiar.

**PEER_LIST** — lo emite el servidor únicamente al peer recién conectado para que sepa quiénes ya están en la red:
```
{
  peers: [
    { id: "abc123", nombre: "Carlos" },
    { id: "def456", nombre: "Ana" }
  ]
}
```

**PEER_JOIN** — lo emite el servidor a todos los peers existentes cuando alguien nuevo entra:
```
{
  id: "abc123",
  nombre: "Carlos"
}
```

**PEER_LEAVE** — lo emite el servidor a todos cuando un peer se desconecta abruptamente (cierra el browser o pierde WiFi):
```
{
  id: "abc123"
}
```

**PEER_EXIT** — lo emite el servidor a todos cuando un peer presiona el botón Salir voluntariamente:
```
{
  id: "abc123",
  nombre: "Carlos"
}
```

**OFFER** — lo manda un peer al servidor para que lo reenvíe al peer destino:
```
{
  destino: "abc123",
  sdp: { ... }
}
```

**ANSWER** — lo manda un peer al servidor para que lo reenvíe al que hizo la oferta:
```
{
  destino: "abc123",
  sdp: { ... }
}
```

**ICE_CANDIDATE** — lo manda un peer al servidor para que lo reenvíe al otro peer:
```
{
  destino: "abc123",
  candidate: { ... }
}
```

**CHAT** — viaja por DataChannel directamente entre peers, el servidor nunca lo ve:
```
{
  id: "abc123",
  nombre: "Carlos",
  texto: "Hola a todos!"
}
```

**POSITION** — viaja por DataChannel directamente entre peers, el servidor nunca lo ve. La zona es el nombre exacto de la zona del recinto seleccionada por el visitante, no coordenadas GPS:
```
{
  id: "abc123",
  nombre: "Carlos",
  zona: "Zona A"
}
```

Los valores posibles del campo `zona` los define María cuando dibuje el mapa del recinto. Cuando María los tenga listos te avisa y los agregas como comentario en protocol.js para que Jesús los use en el menú de selección.

**PING** — viaja por DataChannel directamente entre peers, el servidor nunca lo ve:
```
{
  timestamp: 1718123456789
}
```

**PONG** — viaja por DataChannel directamente entre peers, el servidor nunca lo ve. El timestamp es exactamente el mismo que vino en el PING, sin modificar:
```
{
  timestamp: 1718123456789
}
```

---

## config.js

Este archivo centraliza todas las constantes del sistema para que nadie hardcodee valores en su código.

```
PORT: 3000
STUN_SERVERS: [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
  "stun:stun2.l.google.com:19302"
]
MAX_LOG_EVENTOS: 20
METRICS_PATH: "/metrics"
```

Entrega este archivo junto con protocol.js el día 2. Andrés necesita los STUN_SERVERS para configurar WebRTC.

---

## Semana 1 — Lo que haces día a día

### Día 1

- Crea el repositorio en GitHub con la estructura de carpetas completa
- Avisa al grupo con el link y las instrucciones para clonar
- Empieza a leer la documentación de Socket.io si no la conoces

### Día 2

- Crea `config.js` con todas las constantes
- Crea `protocol.js` completo con todos los tipos de mensajes, sus formatos exactos y comentarios explicando cada uno
- Sube ambos archivos al repositorio y avisa al grupo — **Andrés, Jesús y María están esperando esto para arrancar**

### Días 3 al 5 — server.js y signaling.js

**server.js:**
Crea el servidor HTTP con Express en el puerto de `config.js`. Sobre ese servidor montas Socket.io. Cuando arranque imprime en consola el puerto. Express también sirve la carpeta `client/` como archivos estáticos para que los browsers puedan cargar peer.html y display.html. Prueba que funciona abriendo `localhost:3000/peer.html` en el browser.

**signaling.js — lógica completa:**

Mantén un `Map` llamado `peers` donde cada entrada tiene esta forma:
```
peers.set(id, { id, socket, nombre, zona: null })
```

**Cuando un peer se conecta:**
- Genera un ID único (usa `Date.now() + Math.random()` o un contador simple)
- Guarda el peer en el Map
- Manda al peer recién conectado la lista de todos los peers existentes con el evento `PEER_LIST`
- Avisa a todos los demás peers con `PEER_JOIN` y `{ id, nombre }`

**Cuando un peer manda OFFER, ANSWER o ICE_CANDIDATE:**
- Lees el campo `destino` del mensaje
- Buscas ese peer en el Map
- Si existe, reenvías el mensaje completo a su socket
- Si no existe (ya se desconectó), no haces nada y no mandas error
- Nunca leas ni modifiques el contenido de `sdp` ni `candidate`

**Colisión de OFFERs simultáneos:**
Cuando dos peers entran casi al mismo tiempo, los dos pueden intentar hacer OFFER al mismo tiempo hacia el otro. Para evitar el conflicto, establece una regla simple: el peer cuyo ID sea alfabéticamente menor siempre es el que inicia el OFFER. El peer con ID mayor espera. Documenta esta regla en un comentario en signaling.js para que Andrés la implemente del lado del cliente.

**Cuando un peer se desconecta abruptamente:**
- Socket.io lo detecta con el evento `disconnect`
- Eliminas el peer del Map
- Avisas a todos con `PEER_LEAVE` y `{ id }`
- Agregas al log de métricas: `"[nombre] se desconectó"`

**Cuando un peer manda PEER_EXIT:**
- Eliminas el peer del Map
- Avisas a todos con `PEER_EXIT` y `{ id, nombre }`
- Agregas al log de métricas: `"[nombre] salió de la red"`
- Cierras el socket de ese peer

**Lo que NO haces en signaling.js:**
- No manejas mensajes de tipo CHAT, POSITION, PING ni PONG — esos van por DataChannel y nunca llegan a tu servidor
- No guardas el historial de mensajes de chat
- No calculas latencias

### Días 6 y 7 — Pruebas con Andrés

Coordinas con Andrés para hacer pruebas conjuntas con dos browsers. Tu trabajo es depurar lo que falle:

- Peers que no reciben PEER_LIST correctamente
- OFFER o ANSWER que no llegan al destinatario
- Desconexiones que no se notifican a todos
- IDs duplicados

Quédate disponible para hacer cambios rápidos mientras Andrés prueba desde su lado.

---

## Semana 2 — Métricas para María

María necesita datos en vivo para el panel técnico del display. Creas una ruta HTTP en Express que responde en `/metrics` con un JSON actualizado:

```
{
  peers_activos: 5,
  mensajes_totales: 142,
  uptime_segundos: 3600,
  log: [
    { evento: "Carlos entró a la red", timestamp: 1718123456789 },
    { evento: "Ana cambió a Zona B", timestamp: 1718123457000 },
    { evento: "Pedro salió de la red", timestamp: 1718123458000 }
  ]
}
```

**Cómo llevas las métricas:**
- `peers_activos`: el tamaño actual del Map de peers
- `mensajes_totales`: un contador que incrementas cada vez que pasa un OFFER, ANSWER o ICE_CANDIDATE por tu servidor
- `uptime_segundos`: `Math.floor((Date.now() - inicio) / 1000)` donde `inicio` es el timestamp cuando arrancó el servidor
- `log`: un array que guardas en memoria con máximo 20 entradas. Cuando llega la entrada 21 eliminas la más antigua

**Eventos que agregas al log:**
- Cuando llega PEER_JOIN: `"[nombre] entró a la red"`
- Cuando llega PEER_LEAVE: `"[nombre] se desconectó"`
- Cuando llega PEER_EXIT: `"[nombre] salió de la red"`

María va a llamar a `/metrics` cada 2 segundos desde display.js con un fetch normal. No necesitas WebSocket para esto.

---

## Semana 3 — Pruebas reales y feria

- Lleva el servidor a una red WiFi similar a la de la feria y prueba con celulares reales
- Si WebRTC no conecta entre celulares en esa red, el problema es NAT estricto. Solución: agrega más servidores STUN en `config.js` o configura un servidor TURN propio
- Ten el servidor corriendo en tu laptop **antes** de que llegue el primer visitante a la feria
- Si la red de la feria bloquea el puerto 3000 cambia al puerto 80 o 443 en `config.js`
- Prepara las respuestas del jurado que están al final de este documento

---

## Tus entregas críticas

| Día | Qué entregas | Quién lo necesita |
|---|---|---|
| Día 1 | Repositorio GitHub creado con estructura de carpetas | Todos |
| Día 2 | `protocol.js` completo subido al repo | Todos |
| Día 2 | `config.js` con puerto y STUN servers | Andrés |
| Día 5 | `server.js` y `signaling.js` funcionando | Andrés |
| Día 7 | Pruebas exitosas con Andrés, dos browsers conectados | Andrés |
| Día 14 | Ruta `/metrics` respondiendo JSON correcto | María |
| Día 17 | Servidor probado en red WiFi real del recinto | Todos |

---

## Lo que NO haces

- No tocas `peer.html`, `peer.js`, `peer.css` — esos son de Jesús
- No tocas `display.html`, `display.js`, `recinto.svg` — esos son de María
- No tocas `webrtc.js` — ese es de Andrés
- No manejas CHAT, POSITION, PING ni PONG en tu servidor — esos van por DataChannel
- No implementas lógica WebRTC — eso es territorio de Andrés

---

## Reglas del equipo

- Cada vez que hagas un cambio importante lo subes al repositorio y avisas en el grupo diciendo qué cambiaste
- Si alguien necesita un cambio en `protocol.js` o `config.js` te lo pide a ti y tú lo haces, nadie más los modifica
- Si llevas más de 2 horas atascado en algo, lo dices en el grupo — no pierdas un día entero en un bug solo
- La semana 3 es de pruebas, no de código nuevo — si llegas a la semana 3 todavía escribiendo funcionalidad nueva el proyecto corre riesgo

---

## Lo que necesitas saber antes de arrancar

- Node.js y JavaScript intermedio
- Qué es un WebSocket y cómo funciona Socket.io
- No necesitas saber WebRTC en profundidad, eso es territorio de Andrés

---

## Preguntas que te puede hacer el jurado

**¿Por qué el servidor no ve los mensajes de chat ni de posición?**
Porque esos mensajes viajan directamente entre peers por WebRTC DataChannel una vez que la conexión está establecida. El servidor solo interviene en la señalización inicial, que es el intercambio de SDP e ICE candidates. Después de eso el servidor ya no toca ningún mensaje. Esto es lo que hace que la red sea verdaderamente descentralizada.

**¿Qué pasa si el servidor se cae durante la feria?**
Los peers que ya están conectados entre sí siguen comunicándose porque su canal P2P es completamente independiente del servidor. Solo los nuevos peers que intenten unirse no podrían hacerlo porque necesitan el servidor para el handshake inicial. Los existentes no se ven afectados.

**¿Qué diferencia hay entre PEER_LEAVE y PEER_EXIT?**
PEER_LEAVE ocurre cuando el browser se cierra o el celular pierde la conexión WiFi de forma abrupta. Socket.io lo detecta automáticamente porque el socket se corta. PEER_EXIT ocurre cuando el visitante presiona el botón Salir voluntariamente desde la app. En ambos casos la red se reconfigura, pero PEER_EXIT permite mostrar un mensaje más informativo en el historial del display porque el peer avisó antes de irse.

**¿Qué es la señalización?**
Es el proceso de presentar dos peers entre sí para que puedan establecer una conexión directa. Funciona como un intermediario que hace las presentaciones y luego se retira. Sin señalización dos peers no saben cómo encontrarse en la red porque están detrás de NAT y no conocen sus direcciones públicas.

**¿Qué protocolo usa el servidor para comunicarse con los peers?**
WebSocket sobre TCP/IP. Es una conexión persistente y bidireccional que permite al servidor enviar eventos a los peers en tiempo real sin que estos tengan que hacer peticiones constantemente. Socket.io añade una capa de reconexión automática y manejo de eventos sobre WebSocket nativo.

**¿Por qué usaron TCP para la señalización y no UDP?**
Porque la señalización requiere que los mensajes lleguen completos y en orden. Si se pierde un ICE candidate o un SDP la conexión WebRTC falla completamente. TCP garantiza entrega confiable y ordenada, que es exactamente lo que necesitamos para esta fase crítica. Los mensajes de chat y posición en cambio usan SCTP sobre UDP vía DataChannel porque priorizan baja latencia sobre confiabilidad perfecta.

**¿Cuántos peers puede manejar el sistema simultáneamente?**
El servidor de señalización puede manejar cientos de conexiones WebSocket simultáneas sin problema porque Node.js es event-driven y no bloquea. El límite real está en los DataChannels de WebRTC: cada peer debe mantener una conexión directa con todos los demás, lo que en una topología mesh completa con N peers genera N*(N-1)/2 conexiones. Para una feria universitaria con 20 a 30 visitantes simultáneos el sistema funciona perfectamente.

**¿Qué es un WebSocket?**
Es un protocolo de comunicación que establece una conexión persistente y bidireccional entre el browser y el servidor. A diferencia de HTTP normal donde el cliente hace una petición y el servidor responde y cierra, WebSocket mantiene el canal abierto para que el servidor pueda enviar mensajes al cliente en cualquier momento sin que este los pida. Es ideal para aplicaciones en tiempo real.
