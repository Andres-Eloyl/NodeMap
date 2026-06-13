Mismo proceso. Primero checklist, luego documento, luego verificación automática.Checklist al 100%. Aquí va el documento completo:

---

**INSTRUCCIONES PARA JESÚS — Web app del celular**

---

## ¿Qué es tu parte?

Tu trabajo es la cara del proyecto. Es lo que el visitante ve, toca e interactúa cuando escanea el QR. Una web app que se abre directo en el browser del celular sin instalar nada, donde el visitante escribe su apodo, elige en qué zona del recinto está, y entra a la red. Desde ahí puede ver el mapa con todos los conectados, saber quién está en cada zona, chatear con todos, y actualizar su posición cuando se mueve.

No necesitas saber nada de WebRTC internamente. Andrés te entrega un módulo llamado `webrtc.js` con funciones simples que usas como caja negra. Mientras ese módulo no esté listo trabajas con un mock desde el día 1.

---

## Tus archivos — solo tú los modificas

```
client/peer.html    ← estructura de la app
client/peer.js      ← lógica completa
client/peer.css     ← estilos mobile-first
```

Nadie más toca esos archivos. Si necesitas algo de Andrés o Erasmo se los pides, no modificas sus archivos.

---

## Antes de escribir código — Día 1

Clona el repositorio que Erasmo creó. Luego crea el archivo `mock-webrtc.js` en la carpeta `client/`. Este archivo tiene exactamente las mismas funciones que el `webrtc.js` real de Andrés pero devuelve datos inventados. Así puedes construir y probar toda la app sin esperar a nadie durante la semana 1.

**Las funciones que debe tener tu mock:**

`getPeers()` — devuelve una lista fija de peers simulados:
```
[
  { id: "p1", nombre: "Carlos",  zona: "Zona A" },
  { id: "p2", nombre: "Ana",     zona: "Zona B" },
  { id: "p3", nombre: "Pedro",   zona: "Pasillo" }
]
```

`getLatency(peerId)` — devuelve un número aleatorio entre 10 y 80 para simular latencia en milisegundos.

`onMessage("chat", callback)` — llama al callback cada 4 segundos con un mensaje falso:
```
{ id: "p1", nombre: "Carlos", texto: "Hola desde Zona A!" }
```

`onMessage("position", callback)` — llama al callback cada 5 segundos simulando que alguien cambia de zona:
```
{ id: "p2", nombre: "Ana", zona: "Zona C" }
```

`onMessage("peer-join", callback)` — llama al callback cada 10 segundos:
```
{ id: "p4", nombre: "Visitante nuevo" }
```

`onMessage("peer-leave", callback)` — llama al callback cada 20 segundos:
```
{ id: "p4" }
```

`onMessage("peer-exit", callback)` — llama al callback cada 25 segundos:
```
{ id: "p3", nombre: "Pedro" }
```

`broadcast()` y `sendMessage()` — no hacen nada pero tampoco dan error.

Cuando Andrés suba `webrtc.js` el día 7, en `peer.js` solo cambias la línea de importación del mock por el archivo real. Todo lo demás funciona igual sin tocar nada más.

---

## Semana 1 — Lo que haces día a día

### Día 1 — Mock + estructura base

Crea `mock-webrtc.js` con todas las funciones descritas arriba. Crea los tres archivos vacíos `peer.html`, `peer.js` y `peer.css`. Abre `peer.html` en el browser de tu celular desde el inicio para ver cómo se ve en pantalla real — conéctate a la IP local de tu computadora desde el celular para esto.

### Días 2 al 4 — Pantalla de entrada, selección de zona y tres tabs

**Pantalla de entrada:**
Lo primero que ve el visitante. Tiene un campo de texto para el apodo con placeholder "¿Cómo te llamas?", validación de que el apodo no esté vacío y tenga mínimo 2 caracteres, y un botón grande que diga "Entrar a la red". Mientras conecta muestra un estado visible como "Conectando..." para que el visitante sepa que algo está pasando.

**Pantalla de selección de zona:**
Aparece inmediatamente después de escribir el apodo. Muestra el mapa simplificado del recinto con cada zona como un área grande y tocable con su nombre. Un texto arriba que diga "¿En qué zona estás ahora?". Al tocar una zona guarda la zona elegida, llama a `broadcast("position", { id, nombre, zona })` y abre la pantalla principal. Durante la semana 1 usa nombres de zonas simulados como "Zona A", "Zona B", "Pasillo", "Escenario". La semana 2 los reemplazas con los nombres reales que define María.

**Pantalla principal — tres tabs:**
La pantalla principal tiene tres tabs en la parte superior. Solo se muestra el contenido del tab activo. El tab activo se marca visualmente. Los tabs son Mapa, Nodos y Chat.

**Tab Mapa:**
Muestra el mini mapa del recinto con un punto de color por cada peer en su zona. Tu propio punto está marcado diferente, por ejemplo con un borde blanco o una estrella. La zona donde estás actualmente aparece resaltada. Cuando llega un mensaje de tipo `position`, mueves el punto de ese peer a la zona nueva. Cuando llega `peer-join`, aparece un punto nuevo. Cuando llega `peer-leave` o `peer-exit`, el punto desaparece.

**Tab Nodos:**
Lista de todos los peers conectados. Llamas a `getPeers()` para obtener la lista inicial. Cada item de la lista muestra el nombre del peer, la zona donde está actualmente, y la latencia obtenida con `getLatency(peerId)` en milisegundos. La lista se actualiza automáticamente cuando llegan eventos de `peer-join`, `peer-leave`, `peer-exit` y `position`.

**Tab Chat:**
Arriba el historial de mensajes. Cada mensaje muestra el nombre del remitente en negrita y el texto del mensaje. Los mensajes propios se alinean a la derecha con un color diferente. Los mensajes de otros se alinean a la izquierda. Abajo un campo de texto y un botón de enviar. Al enviar llamas a `broadcast("chat", { id, nombre, texto })` y limpias el campo. Escuchas mensajes entrantes con `onMessage("chat", callback)` y los agregas al historial.

**Botón flotante Cambiar zona:**
Siempre visible en la pantalla principal, flotando en la esquina inferior izquierda. Al tocarlo muestra el mismo mapa de selección de zona de la entrada. Al elegir una zona nueva llamas a `broadcast("position", { id, nombre, zona })` y actualizas tu punto en el Tab Mapa.

**Botón Salir:**
Visible en la pantalla principal. Al tocarlo muestra un mensaje de confirmación: "¿Seguro que quieres salir de la red?". Si confirma, Andrés maneja internamente el aviso a la red via `webrtc.js`. La app vuelve a la pantalla de entrada limpia.

### Días 5 al 7 — Integrar webrtc.js de Andrés

Cuando Andrés suba `webrtc.js` al repositorio el día 7:

- Cambia la importación en `peer.js` de `mock-webrtc.js` a `webrtc.js`
- Prueba con celulares reales del equipo que el chat llega a todos
- Prueba que la lista de nodos se actualiza cuando alguien entra o sale
- Reporta al grupo cualquier diferencia entre lo que devolvía el mock y lo que devuelve el real

---

## Semana 2 — Zonas reales y pulido

### Días 8 al 10 — Integrar zonas reales de María

El día 10 María define los nombres exactos de las zonas del recinto y avisa al grupo. Cuando tengas esa lista:

- Reemplaza los nombres simulados de zonas por los nombres reales en la pantalla de selección de zona
- Verifica que el botón Cambiar zona también muestra los nombres reales
- Verifica que los mensajes de `position` con esos nombres se procesan correctamente en el Tab Mapa y el Tab Nodos

### Días 11 al 14 — Latencia real y pruebas en celulares

Cuando `getLatency()` de Andrés devuelva valores reales en vez de simulados verifica que el Tab Nodos los muestra correctamente actualizándose cada vez que hay una nueva medición.

Prueba la app en estos browsers porque se comportan diferente:
- Chrome en Android
- Safari en iPhone
- Samsung Internet si tienes acceso

Los problemas más comunes de compatibilidad son el campo de texto del chat que en Safari a veces no hace scroll correctamente cuando aparece el teclado, y el CSS de posición fija del botón flotante que en algunos celulares Android queda tapado por la barra de navegación. Resuelve lo que aparezca.

---

## Semana 3 — Optimización y feria

### Días 15 al 17 — Velocidad y compatibilidad final

Mide cuánto tarda en cargar la app desde que se escanea el QR hasta que el usuario está en la pantalla de selección de zona. El objetivo es menos de 3 segundos. Para lograrlo asegúrate de que el CSS está en un solo archivo sin imports externos innecesarios, las imágenes si las hay están optimizadas, y el JavaScript se carga al final del body para no bloquear el render.

### Días 18 al 21 — Pitch y feria

Prepara el pitch de 2 minutos que le das a cada visitante que llega al stand. El pitch es así: señalas la pantalla grande y dices que eso es una red de comunicación en tiempo real donde cada celular conectado es un nodo. Le muestras el QR y lo invitas a escanear. Mientras se conecta le explicas que no instaló nada, que abrió una página web normal. Cuando su punto aparece en la pantalla grande le dices que su celular ahora es parte de la infraestructura de la red. Le muestras el chat y le dices que si manda un mensaje va directo al celular de los demás sin pasar por ningún servidor. Eso es todo. Simple, rápido e impactante.

---

## Tus entregas críticas

| Día | Qué entregas | Quién lo necesita |
|---|---|---|
| Día 1 | `mock-webrtc.js` listo con todas las funciones | Solo tú |
| Día 4 | HTML y CSS completo, tres tabs funcionando con mock | Solo tú |
| Día 7 | App conectada a `webrtc.js` real de Andrés | Andrés (verificación) |
| Día 10 | Zonas reales de María integradas | María (verificación) |
| Día 14 | Pruebas en celulares reales exitosas | Todo el equipo |
| Día 17 | App optimizada, menos de 3 segundos de carga | Todo el equipo |

---

## Lo que NO haces

- No tocas `server.js` ni `signaling.js` — esos son de Erasmo
- No tocas `display.html`, `display.js`, `recinto.svg` — esos son de María
- No tocas `webrtc.js` — ese es de Andrés
- No tocas `protocol.js` ni `config.js` — esos son de Erasmo
- No implementas GPS — la posición es siempre el nombre de una zona que el visitante elige manualmente

---

## Reglas del equipo

- Cada vez que hagas un cambio importante lo subes al repositorio y avisas en el grupo
- Si necesitas un cambio en la API de `webrtc.js` se lo pides a Andrés
- Si necesitas los nombres de zonas antes del día 10 se los pides a María
- Si llevas más de 2 horas atascado en algo, lo dices en el grupo
- La semana 3 es de pruebas, no de código nuevo

---

## Lo que necesitas saber antes de arrancar

- HTML, CSS y JavaScript básico-intermedio
- Diseño responsive y mobile-first
- No necesitas saber nada de redes ni protocolos

---

## Preguntas que te puede hacer el jurado

**¿Por qué no usan GPS para la ubicación?**
Porque el GPS en interiores tiene un margen de error de 15 a 50 metros, que es mayor que el tamaño del recinto mismo. Tomamos la decisión de usar selección manual de zona porque es más precisa, más confiable y más honesta técnicamente. El visitante sabe mejor que cualquier sensor dónde está parado.

**¿Cómo funciona la selección de zona?**
Al entrar a la red el visitante toca en el mapa del recinto la zona donde está. Esa selección se envía a todos los peers conectados mediante el DataChannel de WebRTC como un mensaje de tipo POSITION con el nombre de la zona. Todos los dispositivos reciben ese mensaje y actualizan la posición del peer en sus propias interfaces.

**¿Qué hace el botón Salir técnicamente?**
Cuando el visitante presiona Salir, `webrtc.js` cierra todos los DataChannels activos con los peers conectados y notifica al servidor de señalización. El servidor emite un evento PEER_EXIT a todos los demás peers con el ID y nombre del peer que salió. En la pantalla grande el nodo desaparece con una animación y su nombre aparece en el historial de eventos.

**¿Cómo llegan los mensajes de chat al celular?**
Viajan directamente desde el celular del remitente al celular del destinatario por un WebRTC DataChannel. No pasan por ningún servidor. El cifrado DTLS que WebRTC aplica obligatoriamente garantiza que nadie en la red pueda leer el contenido de los mensajes.

**¿Qué muestra la latencia en el tab Nodos?**
Muestra el tiempo en milisegundos que tarda un mensaje en ir de tu celular al celular de ese peer y volver. Se mide con un sistema de ping/pong que `webrtc.js` ejecuta automáticamente cada 5 segundos. Una latencia baja significa que los dos celulares tienen un canal directo fluido.

**¿Por qué no hay que instalar ninguna app?**
Porque la aplicación es una página web normal que usa APIs nativas del browser: WebRTC para la comunicación P2P, y la API de notificaciones para los eventos de la red. Todo el código se descarga automáticamente cuando el browser abre la URL del QR. No requiere Play Store ni App Store.

---

Ese es el documento completo de Jesús. ¿Lo tienes todo o quieres que te lo pase como archivo .md también?