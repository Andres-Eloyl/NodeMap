# 🎯 Guía Maestra de Prompts — NodeMap Display

> **Objetivo:** Construir paso a paso la visualización en tiempo real de la red P2P para la pantalla del stand de feria, usando D3.js con datos simulados que luego se integran con WebRTC real.

---

## 📋 Índice de Fases

| Fase | Prompts | Archivos que se crean/modifican |
|------|---------|--------------------------------|
| **Fase 1** — Mock WebRTC | Prompt 1 | `client/mock-webrtc.js` |
| **Fase 2** — Estructura HTML + CSS | Prompt 2 | `client/display.html`, `client/display.css` |
| **Fase 3** — Grafo D3.js | Prompts 3, 4, 5 | `client/display.js` |
| **Fase 4** — Panel Técnico | Prompt 6 | `client/display.js`, `client/display.css` |
| **Fase 5** — Mapa del Recinto | Prompts 7, 8, 9, 10 | `client/recinto.svg`, `client/display.js` |
| **Fase 6** — Integración Real | Prompts 11, 12 | `client/display.js` |

> [!IMPORTANT]
> **Cada prompt es autocontenido.** Incluye el contexto del proyecto para que la IA no necesite adivinar nada. Úsalos en orden secuencial — cada uno depende del anterior.

> [!TIP]
> **Cómo usar esta guía:** Copia cada prompt completo y pégalo en el chat. Revisa el resultado antes de pasar al siguiente. Si algo no queda bien, pide ajustes antes de avanzar.

---

## Fase 1 — Mock WebRTC

### 🟢 Prompt 1: Crear `mock-webrtc.js`

```
Crea el archivo `client/mock-webrtc.js` para el proyecto NodeMap.

## Contexto del proyecto
NodeMap es un sistema P2P en tiempo real para una feria universitaria. Los celulares se
conectan vía WebRTC y la "pantalla grande" (display.html) muestra la red en un mapa
interactivo. El módulo WebRTC real (`webrtc.js`) ya existe y expone un objeto global
`WebRTCEngine` con esta API:

- `WebRTCEngine.getPeers()` → [{ id, nombre }]
- `WebRTCEngine.onMessage(tipo, callback)` → registra un callback para un tipo de evento
- `WebRTCEngine.broadcast(tipo, datos)` → envía a todos los peers
- `WebRTCEngine.sendMessage(peerId, tipo, datos)` → envía a un peer específico
- `WebRTCEngine.getLatency(peerId)` → latencia en ms o null

Los tipos de evento están definidos en `shared/protocol.js` como:
- PROTOCOL.PEER_JOIN = "peer-join"   → { id, nombre }
- PROTOCOL.PEER_LEAVE = "peer-leave" → { id }
- PROTOCOL.PEER_EXIT = "peer-exit"   → { id, nombre }
- PROTOCOL.CHAT = "chat"             → { id, nombre, texto }
- PROTOCOL.POSITION = "position"     → { id, nombre, zona }

## Qué debe hacer el mock
Crea un mock que replica EXACTAMENTE la misma API de `WebRTCEngine` pero con datos
simulados. El objetivo es que `display.js` pueda desarrollarse completamente sin esperar
al módulo WebRTC real. Cuando el real esté listo, solo se cambia la línea de importación.

### Peers iniciales (devueltos por getPeers):
```js
[
  { id: "p1", nombre: "Carlos",  zona: "Zona A" },
  { id: "p2", nombre: "Ana",     zona: "Zona B" },
  { id: "p3", nombre: "Pedro",   zona: "Zona A" },
  { id: "p4", nombre: "Laura",   zona: "Pasillo" },
  { id: "p5", nombre: "Miguel",  zona: "Escenario" }
]
```

### Simulación de eventos con temporizadores:
- **CHAT** cada 3-5 segundos (intervalo aleatorio): callback con
  `{ id, nombre, texto }` de un peer aleatorio. Usa un array de mensajes variados en
  español (mínimo 12 mensajes distintos). El campo `destino` debe ser el id de otro peer
  aleatorio de la lista (diferente al emisor).
- **POSITION** cada 5-8 segundos: callback con `{ id, nombre, zona }` de un peer
  aleatorio cambiando a una zona aleatoria distinta a la actual.
  Zonas posibles: "Zona A", "Zona B", "Zona C", "Pasillo", "Escenario", "Entrada"
- **PEER_JOIN** cada 10-15 segundos: callback con `{ id, nombre }` de un peer nuevo.
  Genera nombres de visitante con un contador incremental ("Visitante 7", "Visitante 8"...).
  Agrega el nuevo peer a la lista interna.
- **PEER_LEAVE** cada 20-30 segundos: callback con `{ id }` de un peer aleatorio que NO
  sea de los 5 originales (solo los visitantes que entraron dinámicamente). Elimínalo de la
  lista interna.
- **PEER_EXIT** cada 25-35 segundos: callback con `{ id, nombre }` similar a PEER_LEAVE
  pero para salida voluntaria. Misma regla: solo visitantes dinámicos.

### getLatency:
Devuelve un número aleatorio entre 5 y 45 ms para cualquier peerId que exista en la lista.
Retorna null para peers inexistentes.

### broadcast y sendMessage:
No hacen nada pero no dan error. Solo hacen `console.log` discreto.

### Requisitos técnicos:
- Exporta como `window.MockWebRTC` con la misma estructura que `window.WebRTCEngine`
- Usa intervalos con variación aleatoria (no fijos) para que la simulación se vea orgánica
- Los temporizadores deben auto-reiniciarse con intervalos diferentes cada vez
- Incluye un método extra `MockWebRTC.start()` que inicia todos los temporizadores (para
  que display.js controle cuándo empieza la simulación)
- Incluye `MockWebRTC.stop()` para detener toda la simulación
- Documenta cada función con JSDoc
```

---

## Fase 2 — Estructura Visual

### 🟢 Prompt 2: Crear `display.html` y `display.css`

```
Crea los archivos `client/display.html` y `client/display.css` para el proyecto NodeMap.

## Contexto del proyecto
NodeMap es un sistema P2P para una feria universitaria. La "pantalla grande" del stand
muestra un mapa interactivo del recinto con todos los dispositivos conectados, mensajes
viajando en tiempo real, y un panel de métricas técnicas.

Esta pantalla se proyecta en un monitor grande y se ve desde 3+ metros de distancia.

## Dependencias que carga display.html (en este orden):
1. Google Fonts: Inter (400, 500, 600, 700) y JetBrains Mono (400, 600)
2. D3.js v7 desde CDN: https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js
3. display.css (archivo propio)
4. /shared/config.js
5. /shared/protocol.js
6. mock-webrtc.js (después se reemplazará por webrtc.js)
7. display.js

## Diseño visual que quiero — NO genérico, sino premium y creativo:

### Estética general:
- Fondo: gradiente oscuro profundo, NO un negro plano. Usa algo como
  `radial-gradient` con tonos `#06080d` → `#0c1020` → `#0a0f1e` que dé sensación de
  profundidad cósmica/tecnológica.
- Grid sutil de fondo: líneas muy finas (0.5px, opacidad 0.04) formando una cuadrícula
  que da sensación de "interfaz de control de misión" o "mapa digital"
- Toda la interfaz debe sentirse como un HUD futurista pero elegante, no gamer

### Layout (pantalla completa, sin scroll):
```
┌─────────────────────────────────────────────────────────┐
│  [Logo/Título]                    [Indicadores en vivo] │  ← Header (60px)
├─────────────────────────────────────────────┬───────────┤
│                                             │           │
│                                             │  Historial│
│           Área del Grafo / Mapa             │  de       │
│           (SVG principal)                   │  Eventos  │
│                                             │           │
│                                             │           │
│                                             │           │
├─────────────────────────────────────────────┤           │
│  [Panel Técnico — métricas en fila]         │           │
└─────────────────────────────────────────────┴───────────┘
```

### Header (60px de alto):
- Izquierda: Título "NodeMap" con gradiente de texto (cyan a violeta: #00f0ff → #8b5cf6)
  y subtítulo "Red P2P en Tiempo Real" en texto dim
- Derecha: 3 indicadores en vivo en cajas con borde glassmorphism:
  - "● Peers: 5" con el punto animado (breathing/pulsing verde)
  - "⚡ Mensajes: 142" con el número actualizándose
  - "◷ 00:45:23" uptime con fondo diferente

### Área principal del grafo (flex-grow):
- Fondo semi-transparente con borde sutil redondeado (border-radius: 16px)
- Aquí va el SVG de D3.js que se crea en display.js
- El SVG debe tener `width: 100%` y `height: 100%` del contenedor
- Un elemento `<div id="graph-container">` contenedor

### Panel técnico (esquina inferior, 90px de alto):
- Fila horizontal de tarjetas pequeñas con efecto glassmorphism:
  - `background: rgba(255,255,255,0.03)`
  - `border: 1px solid rgba(255,255,255,0.06)`
  - `backdrop-filter: blur(10px)`
  - `border-radius: 12px`
- Cada tarjeta tiene: icono (emoji), label, valor numérico grande

### Panel lateral de historial (280px de ancho, lado derecho):
- Scroll vertical interno
- Cada entrada: timestamp + nombre + acción
- Las entradas más nuevas arriba
- Cada entrada con un indicador de color según tipo:
  - Verde: entró a la red
  - Azul: cambió de zona
  - Rojo: salió de la red
  - Morado: envió un mensaje
- Animación de entrada: desliza desde la derecha con fade-in
- Máximo 15 entradas visibles, las más antiguas se eliminan

### CSS — efectos y microanimaciones:
- Animación `@keyframes pulse-glow` para el indicador de estado
- Animación `@keyframes slide-in-right` para las entradas del historial
- Animación `@keyframes fade-scale-in` para los nodos nuevos del grafo
- Transiciones suaves en todos los elementos interactivos
- Variables CSS para toda la paleta de colores (mínimo 12 variables)
- Media query para pantallas menores a 1200px que oculta el panel lateral

### HTML — IDs únicos obligatorios:
- `#app-header` — header completo
- `#graph-container` — contenedor del SVG D3.js
- `#graph-svg` — el SVG dentro del contenedor (lo crea display.js o lo pones vacío)
- `#tech-panel` — panel técnico inferior
- `#event-log` — panel lateral de historial
- `#peer-count` — número de peers activos
- `#message-count` — contador de mensajes
- `#uptime-display` — tiempo activo
- `#stat-peers`, `#stat-messages`, `#stat-uptime` — tarjetas del panel técnico

### Meta tags SEO:
- Charset UTF-8
- Viewport meta para no zoom en móviles
- Title: "NodeMap — Visualización P2P en Tiempo Real"
- Meta description relevante
- Favicon: usa un emoji rocket 🚀 como favicon inline (data URI SVG)

### Regla crítica:
- NO uses TailwindCSS — todo vanilla CSS
- NO uses frameworks JavaScript — solo D3.js y vanilla JS
- Pantalla completa: `html, body { margin: 0; overflow: hidden; height: 100vh; }`
- El layout debe funcionar con CSS Grid o Flexbox
- Todo el texto debe ser legible a 3 metros: mínimo 14px, títulos 20px+
```

---

## Fase 3 — Grafo D3.js

### 🟢 Prompt 3: Crear la base del grafo D3.js con force-simulation

```
Crea el archivo `client/display.js` que implementa el grafo D3.js de la red P2P.

## Contexto del proyecto
NodeMap muestra en pantalla grande una red P2P de dispositivos conectados a una feria. El
archivo `display.html` ya existe con el layout completo (header, graph-container, panel
técnico, historial de eventos). El mock (`mock-webrtc.js`) ya está cargado y expone
`MockWebRTC` con la misma API que `WebRTCEngine`:

- `.getPeers()` → [{ id, nombre, zona }]
- `.onMessage(tipo, callback)`
- `.broadcast(tipo, datos)`, `.sendMessage(peerId, tipo, datos)` — no-ops
- `.getLatency(peerId)` → número en ms o null
- `.start()` / `.stop()` — controla los temporizadores de simulación

El protocolo define: PROTOCOL.PEER_JOIN, PEER_LEAVE, PEER_EXIT, CHAT, POSITION

## Qué debe hacer display.js — FASE BASE (solo el grafo, nada de panel ni historial):

### 1. Inicialización
- Al cargar la página, selecciona `#graph-container` y crea un SVG que llene el 100% del
  contenedor
- Define un `<defs>` dentro del SVG con filtros y gradientes reutilizables:
  - Un filtro de glow suave (`feGaussianBlur` + compositing) para los nodos
  - Gradientes radiales para los nodos (centro brillante → borde oscuro)
- Usa el motor simulado: `const engine = window.MockWebRTC || window.WebRTCEngine`
  (así cuando se integre el real, solo hay que cambiar la prioridad)
- Llama a `engine.start()` si existe (solo MockWebRTC lo tiene)
- Carga los peers iniciales con `engine.getPeers()`

### 2. Paleta de colores para nodos
No uses colores genéricos. Define una paleta curada de 12 colores HSL que se ven
espectaculares sobre fondo oscuro:
```js
const PALETTE = [
  "hsl(174, 72%, 56%)",  // cyan tropical
  "hsl(262, 83%, 68%)",  // violeta eléctrico
  "hsl(338, 78%, 62%)",  // rosa magenta
  "hsl(45, 93%, 58%)",   // dorado ámbar
  "hsl(142, 69%, 52%)",  // verde esmeralda
  "hsl(199, 89%, 58%)",  // azul cielo
  "hsl(14, 90%, 62%)",   // coral cálido
  "hsl(280, 65%, 60%)",  // lila profundo
  "hsl(160, 84%, 44%)",  // turquesa
  "hsl(35, 95%, 54%)",   // naranja sunset
  "hsl(220, 80%, 62%)",  // azul real
  "hsl(350, 80%, 55%)",  // rojo rubí
];
```
Asigna colores por hash del ID del peer (para que sea consistente).

### 3. Estructura de datos del grafo
Mantén dos arrays que D3 usa para el simulation:
- `nodes` → [{ id, nombre, zona, color, x, y, radius }]
  - radius: 22px para peers originales, 18px para visitantes nuevos
- `links` → [{ source: nodeObj, target: nodeObj }]
  - Cada par de nodos tiene un link (mesh completo o los links existentes)
  - Cuando un nodo entra, crea links a TODOS los nodos existentes
  - Cuando un nodo sale, elimina todos sus links

### 4. D3 Force Simulation
Configura una simulación con estas fuerzas:
- `d3.forceCenter(width/2, height/2)` — centra el grafo
- `d3.forceManyBody().strength(-180)` — repulsión entre nodos
- `d3.forceLink(links).distance(120).strength(0.4)` — mantiene distancia en links
- `d3.forceCollide().radius(d => d.radius + 12)` — evita superposición

En cada tick de la simulación actualiza las posiciones de nodos y links.

### 5. Renderizado de links
- Dibuja cada link como una `<line>` en un grupo `<g class="links">`
- Color: blanco con opacidad 0.06 (apenas visible, como hilos de telaraña)
- Stroke-width: 1px
- Efecto sutil: cuando pasa un mensaje por el link, destella brevemente (esto es en otro
  prompt, por ahora solo el link estático)

### 6. Renderizado de nodos
Cada nodo es un `<g class="node">` que contiene:
- Un `<circle>` principal con:
  - Radio: `d.radius` (22px)
  - Fill: gradiente radial del color del peer (centro claro → borde oscuro)
  - Stroke: color del peer con opacidad 0.6
  - Stroke-width: 2px
  - Filtro de glow aplicado
- Un `<circle>` de pulso detrás del principal:
  - Radio: `d.radius + 4`
  - Fill: none
  - Stroke: color del peer con opacidad 0.15
  - Animación CSS de pulsing sutil (escala 1 → 1.5, opacidad 0.15 → 0)
- Un `<text>` debajo con el nombre del peer:
  - dy: d.radius + 16
  - Font: Inter, 12px, weight 500
  - Fill: blanco con opacidad 0.85
  - text-anchor: middle
  - Sombra de texto sutil para legibilidad

### 7. Nodo entra (PEER_JOIN)
Al recibir el evento:
1. Crea el nodo nuevo en la posición del centro del grafo
2. Crea links a todos los nodos existentes
3. Reinicia la simulación con `simulation.alpha(0.3).restart()`
4. Animación de entrada: el nodo escala de 0 a 1 con bounce (`d3.easeBounceOut`) en 600ms
5. El pulso de glow del nodo nuevo es más intenso los primeros 3 segundos

### 8. Nodo sale (PEER_LEAVE o PEER_EXIT)
Al recibir el evento:
1. Animación de salida: el nodo escala de 1 a 0 con ease-in en 400ms
2. Sus links se desvanecen en paralelo (opacidad → 0 en 400ms)
3. Después de la animación, elimina el nodo y links de los arrays
4. Reinicia la simulación

### 9. Drag interactivo
Permite arrastrar los nodos con el mouse (útil para demo en el stand):
- `d3.drag()` en cada nodo
- `dragstarted`: fija la posición, sube el alphaTarget
- `dragged`: actualiza fx, fy
- `dragended`: libera fx, fy, baja alphaTarget

### 10. Responsividad
Escucha `window.resize` y actualiza el SVG y el forceCenter para que el grafo siempre esté
centrado.

### REGLA CRÍTICA de organización:
Estructura display.js con funciones claras y separadas:
- `initGraph()` — crea SVG, defs, fuerzas
- `renderNodes()` — data join de nodos
- `renderLinks()` — data join de links
- `addNode(peer)` — agrega nodo con animación
- `removeNode(id)` — elimina nodo con animación
- `setupEventListeners()` — conecta con el engine
- `init()` — función principal que llama a todo

Usa el patrón D3 "enter/update/exit" correctamente en render.
```

---

### 🟢 Prompt 4: Animación de mensajes de chat (bolitas viajeras)

```
Agrega la animación de mensajes de chat al grafo D3.js en `client/display.js`.

## Contexto actual
display.js ya tiene un grafo D3.js con force-simulation funcionando. Los nodos representan
peers, los links representan conexiones entre ellos. El mock genera eventos CHAT cada 3-5
segundos con `{ id, nombre, texto, destino }` donde `id` es el emisor y `destino` es el
peer receptor.

El array `nodes` contiene objetos con `{ id, nombre, color, x, y, radius }`.

## Lo que debe pasar cuando llega un evento CHAT:

### 1. Bolita viajera
- Crea un `<circle>` temporal con:
  - Radio: 6px
  - Fill: el color del nodo emisor
  - Posición inicial: x, y del nodo emisor
  - Filtro de glow aplicado (el mismo que usan los nodos)

### 2. Trayectoria curva (NO recta)
La bolita NO viaja en línea recta. Calcula una curva cuadrática Bezier:
- Punto de control: perpendicular al punto medio entre emisor y destino,
  desplazado 50-80px (aleatorio) hacia arriba o abajo (aleatorio)
- Usa un generador de path SVG o interpola manualmente con `d3.transition`:
  - Crea un `<path>` invisible con la curva
  - Usa `getPointAtLength()` para mover la bolita a lo largo del path
- Duración del viaje: 800-1200ms (proporcional a la distancia)
- Easing: `d3.easeCubicInOut` para aceleración suave

### 3. Estela luminosa
Mientras la bolita viaja, deja una estela:
- Implementa con un segundo `<circle>` más grande (radio 10px) que sigue a la bolita
  con 100ms de delay
- Opacidad: 0.2, blur: 8px
- O alternativa: dibuja segmentos del path recorrido con opacidad decreciente

### 4. Efecto de impacto en destino
Cuando la bolita llega al nodo destino:
1. La bolita desaparece instantáneamente
2. Se crea un `<circle>` de "onda" centrado en el nodo destino:
   - Radio inicial: d.radius
   - Radio final: d.radius + 30
   - Opacidad: 0.5 → 0
   - Stroke: color del emisor, width 2px
   - Fill: none
   - Duración: 500ms
   - Easing: `d3.easeQuadOut`
3. El nodo destino hace un "bump" sutil: escala 1 → 1.15 → 1 en 300ms

### 5. Destello del link
El link que conecta al emisor con el destino destella:
- Opacidad sube de 0.06 a 0.4 y vuelve a 0.06 en 600ms
- Color cambia del blanco al color del emisor brevemente

### 6. Rendimiento
- Máximo 5 animaciones de mensaje simultáneas en pantalla
- Si llega un 6to mensaje mientras hay 5 animando, el más antiguo se elimina inmediatamente
- Limpia los elementos SVG temporales después de cada animación

### Integración con el historial
Cuando llega un chat, además de la animación visual, agrega una entrada al historial
lateral (#event-log) con formato:
```
[HH:MM] Carlos → Ana: "Hola desde Zona A!"
```
Color de la entrada: morado/violeta (para mensajes de chat).
```

---

### 🟢 Prompt 5: Animaciones de posición y movimiento entre zonas

```
Agrega la lógica de posición por zona al grafo D3.js en `client/display.js`.

## Contexto actual
display.js tiene un grafo D3.js con force-simulation y animación de mensajes de chat. Los
nodos flotan libremente en el espacio con física. Ahora necesitamos que cuando un peer
envíe su posición (zona), el nodo se agrupe visualmente en el área de esa zona.

Las zonas posibles del recinto son:
"Zona A", "Zona B", "Zona C", "Pasillo", "Escenario", "Entrada"

## Lo que debe hacer:

### 1. Definir coordenadas de zona
Crea un mapa de zonas con posiciones relativas dentro del SVG. Las zonas se distribuyen
como un plano simplificado del recinto:
```js
const ZONAS = {
  "Zona A":     { x: 0.20, y: 0.30, width: 0.20, height: 0.25, color: "hsl(174,72%,56%)" },
  "Zona B":     { x: 0.50, y: 0.30, width: 0.20, height: 0.25, color: "hsl(262,83%,68%)" },
  "Zona C":     { x: 0.80, y: 0.30, width: 0.20, height: 0.25, color: "hsl(338,78%,62%)" },
  "Pasillo":    { x: 0.50, y: 0.60, width: 0.60, height: 0.10, color: "hsl(45,93%,58%)"  },
  "Escenario":  { x: 0.50, y: 0.85, width: 0.40, height: 0.15, color: "hsl(142,69%,52%)" },
  "Entrada":    { x: 0.50, y: 0.05, width: 0.15, height: 0.08, color: "hsl(199,89%,58%)" },
};
```
(Las coordenadas son fracciones del ancho y alto total del SVG)

### 2. Dibujar zonas en el fondo del SVG
Dibuja cada zona como un `<rect>` con:
- Posición y tamaño calculados a partir de las fracciones × tamaño real del SVG
- Fill: color de la zona con opacidad 0.05 (casi invisible, solo tinte)
- Stroke: color de la zona con opacidad 0.15
- Stroke-width: 1px
- Border-radius (rx, ry): 12px
- Etiqueta `<text>` con el nombre de la zona en la esquina superior izquierda, fuente
  Inter 11px, opacidad 0.3
- Contador `<text>` con el número de peers en esa zona, esquina superior derecha, fuente
  JetBrains Mono 14px bold, color de la zona con opacidad 0.7

### 3. Reaccionar al evento POSITION
Cuando llega `{ id, nombre, zona }`:
1. Busca el nodo en el array `nodes`
2. Guarda la zona anterior
3. Actualiza `node.zona = zona`
4. Calcula la nueva posición target: centro del rectángulo de la zona + un offset
   para evitar que los nodos se encimen:
   - Cuenta cuántos nodos hay en esa zona
   - Distribuye en una cuadrícula flexible dentro del rectángulo de la zona
   - Ejemplo: si hay 3 nodos, posiciones [centro-30, centro, centro+30]
5. Usa `d3.transition().duration(800).ease(d3.easeCubicInOut)` para mover el nodo
   suavemente a su nueva posición
6. Actualiza el forceSimulation: fija temporalmente fx, fy del nodo al target, luego
   los libera después de la transición para que la física tome control suave

### 4. Rastro visual entre zonas
Cuando un peer cambia de zona, dibuja una línea curva entre la zona anterior y la nueva:
- Curva Bezier cuadrática con punto de control desplazado
- Color: color del peer con opacidad 0.3
- Stroke-width: 2px
- Stroke-dasharray: "6 4" (línea punteada sutil)
- Animación: la línea aparece completa y se desvanece en 4 segundos (opacidad → 0)
- Después de desvanecerse, se elimina del DOM

### 5. Actualizar contadores de zona
Cada vez que un peer entra o sale de una zona:
- Actualiza el texto del contador de la zona
- Animación del número: escala 1 → 1.3 → 1 con un brillo momentáneo

### 6. Integración con historial
Agrega una entrada al historial (#event-log) con formato:
```
[HH:MM] Ana cambió a Zona B
```
Color: azul (para cambios de posición).

### Nota importante:
Al inicio (cuando se cargan los peers con getPeers()), cada peer ya tiene un campo `zona`.
Posiciona los nodos iniciales en sus zonas respectivas SIN animación de transición (solo
la posición directa).
```

---

## Fase 4 — Panel Técnico

### 🟢 Prompt 6: Panel técnico y métricas

```
Implementa el panel técnico y el sistema de métricas en `client/display.js`.

## Contexto actual
display.js tiene el grafo D3.js completo con nodos, links, animaciones de chat, y
posicionamiento por zonas. El display.html tiene un `#tech-panel` en la parte inferior y
los indicadores `#peer-count`, `#message-count`, `#uptime-display` en el header.

## Lo que debe hacer:

### 1. Métricas locales (con datos del mock)
Mantén un objeto de estado con las métricas que display.js puede calcular por sí mismo:
```js
const metrics = {
  peersActivos: 0,       // se actualiza con getPeers().length y eventos join/leave
  mensajesTotales: 0,    // se incrementa con cada evento CHAT recibido
  startTime: Date.now(), // para calcular uptime
};
```

### 2. Actualización de indicadores del header
Cada segundo, actualiza:
- `#peer-count`: número de peers activos con animación de cambio (el número se desvanece
  y aparece el nuevo con scale-in)
- `#message-count`: total de mensajes con incremento animado (count-up effect)
- `#uptime-display`: formato HH:MM:SS calculado desde startTime

### 3. Panel técnico inferior (#tech-panel)
Actualiza las tarjetas del panel técnico con estos datos:
- Tarjeta 1: 👥 Peers Activos → número grande + texto "conectados"
- Tarjeta 2: 💬 Mensajes → número grande + texto "enviados"
- Tarjeta 3: ⏱️ Uptime → HH:MM:SS + texto "tiempo activo"
- Tarjeta 4: 📡 Latencia Promedio → promedio de todas las latencias (usa
  engine.getLatency para cada peer) + texto "ms promedio"
- Tarjeta 5: 🗺️ Zonas Activas → cuántas zonas tienen al menos 1 peer + texto "con
  actividad"

### 4. Integración futura con /metrics del servidor
Prepara una función `fetchServerMetrics()` que:
- Hace `fetch("/metrics")` — por ahora la envuelve en try/catch y si falla usa los
  datos locales
- Cuando funcione (semana 3), actualizará los datos con la respuesta del servidor:
  ```json
  {
    "peers_activos": 5,
    "mensajes_totales": 142,
    "uptime_segundos": 2723,
    "log": [{ "evento": "Carlos entró", "timestamp": 1234567890 }]
  }
  ```
- Llamarla cada 2 segundos con setInterval
- Si la llamada falla (servidor no disponible), usa los datos locales sin mostrar error

### 5. Historial de eventos (#event-log)
Consolida toda la lógica del historial en una función `addEventToLog(tipo, mensaje)`:
- Tipo puede ser: "join" (verde), "leave" (rojo), "zone" (azul), "chat" (morado)
- Formato: `[HH:MM:SS] mensaje`
- Máximo 15 entradas visibles
- Cada entrada nueva empuja a las demás hacia abajo con animación
- La entrada más antigua se desvanece cuando hay más de 15
- Al inicio, agrega los peers existentes como eventos "join"

### 6. Efecto visual de "actividad de red"
Agrega un indicador visual sutil en el header que muestra que la red está activa:
- Un pequeño gráfico de barras de "señal" (3 barritas) que se actualiza con cada evento
- Las barritas suben y bajan aleatoriamente entre 40% y 100% de altura
- Cuando llega un evento, las 3 barritas saltan a 100% y luego bajan suavemente
```

---

## Fase 5 — Mapa del Recinto

### 🟢 Prompt 7: Crear el SVG del recinto

```
Crea el archivo `client/recinto.svg` — el mapa del recinto de la feria universitaria.

## Contexto
Este SVG se incrustará como fondo del grafo D3.js en display.js. Debe ser una
representación simplificada pero visualmente atractiva del plano del recinto.

## Zonas del recinto (estas son las definitivas):
1. **Zona A** — Stands de tecnología (sector izquierdo)
2. **Zona B** — Stands de ciencia (sector central)
3. **Zona C** — Stands de innovación (sector derecho)
4. **Pasillo** — Corredor principal que conecta las zonas (horizontal, al centro)
5. **Escenario** — Área de presentaciones (parte inferior central)
6. **Entrada** — Acceso principal (parte superior central)

## Especificaciones del SVG:
- `viewBox="0 0 1200 800"` — proporción 3:2
- Cada zona es un `<rect>` con:
  - `id` descriptivo: "zona-a", "zona-b", "zona-c", "pasillo", "escenario", "entrada"
  - `data-nombre` con el nombre display: "Zona A", etc.
  - `rx="8"` para esquinas redondeadas
  - Fill: color tenue de la zona con opacidad baja (0.08)
  - Stroke: color de la zona con opacidad 0.2
  - Stroke-width: 1.5px

## Layout espacial (coordenadas aproximadas):
```
              [Entrada]
          x:500 y:20 w:200 h:60

  [Zona A]        [Zona B]        [Zona C]
  x:50 y:130      x:430 y:130     x:810 y:130
  w:320 h:280     w:340 h:280     w:320 h:280

          [Pasillo Principal]
          x:50 y:440 w:1100 h:80

              [Escenario]
          x:300 y:570 w:600 h:180
```

## Elementos decorativos (sutiles, no distractores):
- Líneas punteadas finas entre zonas simulando pasillos secundarios
- Iconos SVG minimalistas dentro de cada zona (ícono de laptop para Tech, matraz para
  Ciencia, bombilla para Innovación, micrófono para Escenario)
- Los iconos deben ser del color de la zona con opacidad 0.15 — son decorativos, no
  deben competir con los nodos
- Etiqueta `<text>` con el nombre de cada zona, fuente Inter, 14px, color de la zona
  con opacidad 0.4
- Un borde exterior con esquinas redondeadas que encuadra todo el recinto
- Pequeñas "puertas" (interrupciones en los bordes) en la entrada y salidas

## Paleta de colores de zonas:
```
Zona A:    hsl(174, 72%, 56%)  — Cyan
Zona B:    hsl(262, 83%, 68%)  — Violeta
Zona C:    hsl(338, 78%, 62%)  — Rosa
Pasillo:   hsl(45, 93%, 58%)   — Dorado
Escenario: hsl(142, 69%, 52%)  — Verde
Entrada:   hsl(199, 89%, 58%)  — Azul
```

## Regla importante:
- NO incluyas JavaScript dentro del SVG
- Los `id` de los `<rect>` de zona son obligatorios — display.js los usa para posicionar
  nodos
- El SVG debe verse bien tanto standalone como incrustado sobre fondo oscuro
```

---

### 🟢 Prompt 8: Integrar recinto.svg como fondo del grafo

```
Modifica `client/display.js` para integrar recinto.svg como fondo del grafo D3.js.

## Contexto actual
display.js tiene un grafo D3.js con force-simulation y zonas definidas como coordenadas
porcentuales. El archivo recinto.svg ya existe con zonas como <rect> con IDs: "zona-a",
"zona-b", "zona-c", "pasillo", "escenario", "entrada". Cada rect tiene `data-nombre`
con el nombre legible.

## Lo que debe cambiar:

### 1. Cargar el SVG del recinto
Al inicializar, carga `recinto.svg` con `d3.xml("recinto.svg")` y lo incrusta dentro del
SVG principal del grafo como un `<g id="recinto-layer">` que es la primera capa (detrás de
todo).

### 2. Mapear coordenadas de zona desde el SVG real
En lugar de usar coordenadas porcentuales hardcodeadas, lee las posiciones reales de los
`<rect>` del recinto:
```js
const zonaRects = {};
d3.selectAll("#recinto-layer rect[id]").each(function() {
  const rect = d3.select(this);
  zonaRects[rect.attr("data-nombre")] = {
    x: +rect.attr("x"),
    y: +rect.attr("y"),
    width: +rect.attr("width"),
    height: +rect.attr("height"),
  };
});
```

Usa estas coordenadas reales para posicionar los nodos dentro de cada zona.

### 3. Escalar el recinto al contenedor
El SVG del recinto tiene viewBox "0 0 1200 800". Calcula el factor de escala para que
encaje en el contenedor manteniendo la proporción. Aplica un `transform: scale()` al
grupo del recinto.

### 4. Capas SVG (orden de renderizado, de atrás hacia adelante):
1. `#recinto-layer` — el mapa del recinto
2. `#zone-counters` — contadores de peers por zona
3. `#trails-layer` — rastros de cambio de zona
4. `#links-layer` — links entre nodos
5. `#messages-layer` — bolitas de chat viajeras
6. `#nodes-layer` — los nodos (siempre encima de todo)

### 5. Contadores dinámicos sobre cada zona
Agrega un `<text>` encima de cada zona del recinto que muestra cuántos peers hay:
- Posición: esquina superior derecha del rect de la zona
- Fuente: JetBrains Mono, 16px, bold
- Color: color de la zona
- Fondo: un `<rect>` detrás del texto con fondo oscuro semi-transparente y border-radius
- Se actualiza cada vez que un peer entra o sale de una zona

### 6. Mantener compatibilidad
Todo lo que ya funciona (force-simulation, animaciones de chat, drag, historial) debe
seguir funcionando exactamente igual. Solo se agrega el fondo del recinto y se ajusta el
sistema de coordenadas.
```

---

### 🟢 Prompt 9: Transiciones suaves entre zonas con el mapa real

```
Mejora las transiciones de posición en `client/display.js` para usar el mapa del recinto.

## Contexto
display.js ahora tiene el mapa del recinto como fondo y lee las coordenadas reales de
cada zona desde el SVG. Los nodos ya se posicionan dentro de las zonas.

## Mejoras a implementar:

### 1. Distribución inteligente dentro de cada zona
Cuando varios peers están en la misma zona, distribúyelos en un patrón orgánico dentro
del rectángulo de la zona:
- 1 peer: centro del rectángulo
- 2 peers: centro-izquierda y centro-derecha
- 3 peers: triángulo equilátero centrado
- 4+: distribución en cuadrícula flexible con spacing uniforme
- Los nodos nunca deben salirse del rectángulo de la zona
- Deja un padding de 30px desde los bordes del rectángulo

### 2. Transición suave al cambiar de zona
Cuando un peer cambia de zona (evento POSITION):
1. Calcula la posición final dentro de la zona destino
2. Antes de mover: crea el rastro visual (curva entre zona origen y destino)
3. Mueve el nodo con `d3.transition().duration(1000).ease(d3.easeCubicInOut)`
4. Durante la transición, la opacidad del nodo baja a 0.6 y vuelve a 1.0
5. Al llegar, un pequeño pulso en el nodo destino (como "aterrizó")
6. Recalcula la distribución de la zona origen (los nodos restantes se reubican)
7. Recalcula la distribución de la zona destino (los nodos se hacen espacio)

### 3. Rastro visual mejorado con el mapa
El rastro ahora sigue un camino lógico:
- Si el cambio es entre zonas adyacentes: curva directa
- Si el cambio cruza el pasillo: el rastro pasa por el pasillo (2 segmentos curvos)
- Color: color del peer con opacidad 0.25
- La línea se dibuja progresivamente (como si se trazara en tiempo real) usando
  `stroke-dasharray` y `stroke-dashoffset` animados
- Desaparece en 5 segundos con fade-out

### 4. Hover de zona
Cuando el mouse pasa sobre una zona del recinto:
- El rectángulo de la zona sube su opacidad de fill a 0.12
- Aparece un tooltip con: nombre de la zona + número de peers + lista de nombres
- El tooltip desaparece al salir del hover
```

---

### 🟢 Prompt 10: Pulido final de efectos visuales

```
Agrega los efectos visuales finales y pulido a `client/display.js` y `client/display.css`.

## Efectos a implementar:

### 1. Partículas de fondo
Agrega un sistema de partículas muy sutil al fondo del SVG:
- 30-50 puntos diminutos (radio 1-2px) que flotan lentamente por el fondo
- Color: blanco con opacidad 0.03-0.08
- Movimiento: derivan lentamente en direcciones aleatorias
- Se reciclan cuando salen del viewport
- Rendimiento: usa requestAnimationFrame, NO setInterval

### 2. Efecto de respiración en nodos activos
Los nodos que han enviado un mensaje recientemente (últimos 10 segundos) tienen una
animación de "respiración" más intensa:
- Su glow exterior pulsa con mayor amplitud
- Su borde se vuelve más brillante temporalmente

### 3. Conexión visual entre nodos de la misma zona
Cuando hay 2+ nodos en la misma zona, dibuja un área semi-transparente (convex hull)
alrededor de ellos:
- Fill: color de la zona con opacidad 0.04
- Stroke: color de la zona con opacidad 0.1
- Border-radius con curvas suaves
- Se actualiza dinámicamente cuando los nodos se mueven

### 4. Estado vacío atractivo
Si no hay ningún peer conectado, muestra en el centro del grafo:
- Texto: "Esperando conexiones..."
- Subtexto: "Escanea el QR para unirte a la red"
- Animación de loading sutil (3 puntos pulsando)
- Desaparece con fade-out cuando llega el primer peer

### 5. Tooltip en nodos
Al hacer hover sobre un nodo:
- Muestra una tarjeta flotante con:
  - Nombre del peer
  - Zona actual
  - Latencia (si disponible)
  - Tiempo conectado
- La tarjeta tiene glassmorphism effect
- Aparece con animación de scale + fade
- Se posiciona inteligentemente para no salirse de la pantalla

### 6. Indicador de actividad de red
En la esquina superior derecha (o dentro del header), un indicador visual que muestra
la "salud" de la red:
- 3 anillos concéntricos que pulsan con diferente velocidad
- Cuando hay actividad (mensajes), los anillos se expanden más
- Cuando no hay actividad, los anillos se contraen
- Color: verde si todo está bien, amarillo si hay latencia alta, rojo si se pierden peers
```

---

## Fase 6 — Integración con WebRTC Real

### 🟢 Prompt 11: Cambiar de mock a WebRTC real

```
Modifica `client/display.js` para integrar el módulo WebRTC real.

## Contexto
display.js actualmente usa MockWebRTC como motor. El módulo real `webrtc.js` ya existe
y expone `window.WebRTCEngine` con EXACTAMENTE la misma API:
- getPeers(), onMessage(), broadcast(), sendMessage(), getLatency()

La diferencia es que WebRTCEngine tiene `conectar(nombre)` en lugar de `start()`.

## Cambios necesarios:

### 1. Detección automática de motor
```js
const engine = window.WebRTCEngine || window.MockWebRTC;
const IS_MOCK = !window.WebRTCEngine;
```

### 2. Inicialización diferente
- Si es WebRTC real: llamar `engine.conectar("Display")` — el display se conecta como
  un peer más con nombre "Display"
- Si es mock: llamar `engine.start()`

### 3. Adaptación de datos
El mock devuelve peers con `{ id, nombre, zona }` pero el WebRTC real devuelve
`{ id, nombre }` (sin zona). Cuando se usa el real:
- Nuevos peers entran sin zona asignada (posición libre en el centro del grafo)
- La zona se actualiza cuando llega un evento POSITION de ese peer
- Los nodos sin zona flotan libremente con la simulación de física

### 4. En display.html
Cambia el script de:
```html
<script src="mock-webrtc.js"></script>
```
a:
```html
<!-- Modo mock (descomentar para desarrollo sin servidor):
<script src="mock-webrtc.js"></script>
-->
<script src="/socket.io/socket.io.js"></script>
<script src="/shared/config.js"></script>
<script src="/shared/protocol.js"></script>
<script src="webrtc.js"></script>
```

### 5. Indicador visual de modo
Agrega un badge pequeño en el header que dice "SIMULACIÓN" cuando está en modo mock
y "EN VIVO" cuando está conectado al WebRTC real. El badge "EN VIVO" tiene un punto
rojo pulsando (como las transmisiones en vivo).
```

---

### 🟢 Prompt 12: Integrar métricas del servidor (/metrics)

```
Modifica `client/display.js` para integrar las métricas reales del servidor de Erasmo.

## Contexto
El servidor Express de Erasmo expone `GET /metrics` que devuelve:
```json
{
  "peers_activos": 5,
  "mensajes_totales": 142,
  "uptime_segundos": 2723,
  "log": [
    { "evento": "Carlos entró a la red", "timestamp": 1718000000000 },
    { "evento": "Ana cambió a Zona B", "timestamp": 1718000010000 }
  ]
}
```

## Implementar:

### 1. Polling de métricas
Cada 2 segundos, llama a `fetch("/metrics")`:
- Si la respuesta es exitosa, actualiza el panel técnico con los datos del servidor
- Si falla (servidor no disponible), usa las métricas locales calculadas por display.js
- No mostrar errores en pantalla — el fallback es silencioso

### 2. Actualizar panel técnico
Con los datos del servidor:
- `peers_activos` → #peer-count y tarjeta de peers
- `mensajes_totales` → #message-count y tarjeta de mensajes
- `uptime_segundos` → convertir a HH:MM:SS y mostrar en #uptime-display y tarjeta

### 3. Sincronizar historial
Si el servidor envía nuevos eventos en el `log` que no están en el historial local:
- Agregar solo los nuevos (comparar timestamps)
- Mantener el límite de 15 entradas
- Los eventos del servidor se formatean según su texto:
  - Si contiene "entró" → tipo "join" (verde)
  - Si contiene "salió" o "desconectó" → tipo "leave" (rojo)
  - Si contiene "cambió" → tipo "zone" (azul)
  - Default → tipo "info" (gris)

### 4. Indicador de conexión al servidor
Agrega un pequeño indicador en el panel técnico que muestra si el servidor responde:
- Punto verde + "Servidor conectado" si /metrics responde ok
- Punto rojo + "Servidor no disponible" si falla
- El punto pulsa suavemente cuando está conectado
```

---

## 🔧 Prompts Auxiliares (opcionales, para pulido)

### Prompt Extra A: Generar QR Code

```
Crea un archivo `client/qr-generator.html` que genera el código QR para el stand.

Debe ser una página simple que:
1. Detecta la IP local del servidor
2. Genera un QR que apunta a `http://<IP>:3000/peer.html`
3. El QR es grande (mínimo 400x400 px) y listo para imprimir
4. Usa la librería qrcode.js desde CDN
5. Incluye el texto de la URL debajo del QR
6. Botón "Imprimir" que abre el diálogo de impresión del browser
7. Fondo blanco para impresión limpia
```

### Prompt Extra B: Modo presentación para el jurado

```
Agrega un "modo presentación" a display.js que se activa con la tecla "P".

Cuando se activa:
1. Muestra etiquetas explicativas sobre cada componente de la pantalla
2. Flechas con texto: "Cada círculo = un celular", "Líneas = conexión directa",
   "Bolita viajera = mensaje de chat", etc.
3. Las etiquetas aparecen con animación secuencial (una tras otra)
4. Se desactiva presionando "P" otra vez
5. Es un overlay semi-transparente que no interfiere con la visualización
```

---

## 📌 Notas Importantes

> [!CAUTION]
> **Orden de ejecución:** Los prompts DEBEN ejecutarse en orden. Cada uno asume que el anterior ya se completó exitosamente. Si saltas un prompt, los siguientes fallarán.

> [!TIP]
> **Estrategia de review:** Después de cada prompt, abre display.html en el browser para verificar que todo funciona visualmente antes de pasar al siguiente.

> [!IMPORTANT]
> **Transición mock → real:** Los prompts 1-10 funcionan 100% offline con datos simulados. Los prompts 11-12 requieren que el servidor de Erasmo esté corriendo (`cd server && node server.js`).

> [!NOTE]
> **Compatibilidad con el equipo:** Estos archivos son SOLO de María: `display.html`, `display.js`, `display.css`, `recinto.svg`, `mock-webrtc.js`. NO se modifican archivos de otros integrantes.

---

## 🗂️ Resumen de Archivos Creados

| Archivo | Prompt | Descripción |
|---------|--------|-------------|
| `client/mock-webrtc.js` | 1 | Motor simulado con la misma API que WebRTCEngine |
| `client/display.html` | 2 | Estructura HTML del display de pantalla grande |
| `client/display.css` | 2 | Estilos premium con glassmorphism y animaciones |
| `client/display.js` | 3-6, 8-12 | Lógica D3.js, grafo, panel, mapa |
| `client/recinto.svg` | 7 | Plano vectorial del recinto de la feria |
