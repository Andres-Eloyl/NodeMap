# Instrucciones del Proyecto — María
## Rol: Visualización y Pantalla del Stand

---

## ¿Qué es tu parte?

Tu trabajo es el espectáculo. Es lo primero que ve cualquier persona que pase por el stand y lo que hace que se detengan. La pantalla grande muestra el mapa del recinto con todos los dispositivos conectados, sus nombres, en qué zona están, los mensajes viajando entre ellos en tiempo real, y un panel técnico con métricas para cuando el jurado pregunte.

Tu parte tiene una responsabilidad extra que afecta a todo el equipo: **tú defines los nombres de las zonas del recinto**. Erasmo los necesita para protocol.js y Jesús los necesita para el menú de selección de la app. Esto lo haces en la semana 2 cuando dibujes el mapa real, pero avisa al grupo en cuanto los tengas.

No necesitas saber nada de WebRTC internamente. Andrés te entrega un módulo (webrtc.js) con funciones simples que usas como caja negra. Mientras ese módulo no esté listo, trabajas con datos simulados desde el día 1.

---

## Lo primero que haces — Día 1

Antes de escribir código, dedica las primeras horas del día 1 a estudiar D3.js. Ve a **d3js.org** y busca los ejemplos de **force-directed graph**. Ese tipo de grafo es exactamente lo que vas a usar. Entiende cómo funciona antes de escribir una sola línea porque te ahorra un día entero de trabajo.

Luego clona el repositorio que Erasmo creó y abre tu carpeta de trabajo.

---

## Tus archivos — solo tú los modificas

```
client/display.html     ← estructura de la pantalla grande
client/display.js       ← lógica D3.js, grafo y panel técnico
client/recinto.svg      ← plano del salón de la feria
```

Nadie más toca esos archivos. Si necesitas algo de Erasmo o Andrés se los pides, no modificas sus archivos.

---

## La librería que usas

D3.js se importa desde CDN en display.html. No necesitas instalar nada:

```
https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js
```

---

## El mock-webrtc.js — tu independencia en la semana 1

Andrés entrega webrtc.js el día 7. Mientras tanto creas un archivo llamado `mock-webrtc.js` en la carpeta `client/` que tiene exactamente las mismas funciones pero devuelve datos inventados. Así puedes construir y probar toda la visualización sin esperar a nadie.

**Las funciones que debe tener tu mock:**

`getPeers()` — devuelve una lista fija de peers simulados:
```
[
  { id: "p1", nombre: "Carlos",  zona: "Zona A" },
  { id: "p2", nombre: "Ana",     zona: "Zona B" },
  { id: "p3", nombre: "Pedro",   zona: "Zona A" },
  { id: "p4", nombre: "Laura",   zona: "Pasillo" },
  { id: "p5", nombre: "Miguel",  zona: "Escenario" }
]
```

`onMessage("chat", callback)` — llama al callback cada 4 segundos con un mensaje falso:
```
{ id: "p1", nombre: "Carlos", texto: "Hola desde Zona A!" }
```

`onMessage("position", callback)` — llama al callback cada 5 segundos simulando que alguien cambia de zona:
```
{ id: "p2", nombre: "Ana", zona: "Zona C" }
```

`onMessage("peer-join", callback)` — llama al callback cada 10 segundos simulando que entra un peer nuevo:
```
{ id: "p6", nombre: "Visitante nuevo" }
```

`onMessage("peer-leave", callback)` — llama al callback cada 20 segundos simulando desconexión abrupta:
```
{ id: "p6" }
```

`onMessage("peer-exit", callback)` — llama al callback cada 25 segundos simulando salida voluntaria:
```
{ id: "p3", nombre: "Pedro" }
```

`broadcast()` y `sendMessage()` — no hacen nada pero tampoco dan error.

Cuando Andrés suba webrtc.js el día 7, en display.js solo cambias la línea de importación del mock por el archivo real. Todo lo demás funciona igual.

---

## Semana 1 — Lo que haces día a día

### Días 1 y 2 — Mock + estructura base

- Crea `mock-webrtc.js` con todas las funciones descritas arriba
- Crea la estructura básica de `display.html`: pantalla completa, sin scroll, fondo oscuro
- Crea en `display.js` la conexión al mock e imprime en consola los datos que llegan para verificar que funciona

### Días 2 al 4 — Grafo D3.js completo con datos simulados

Construye el grafo con estas características, todas usando los datos del mock:

**Nodos:**
- Un círculo de color por cada peer en `getPeers()`
- Cada peer tiene un color único asignado desde una paleta fija
- El nombre del peer aparece debajo del círculo en texto pequeño
- Cuando un peer nuevo entra (evento `peer-join`) su nodo aparece con animación de escala desde cero
- Cuando un peer sale (evento `peer-leave` o `peer-exit`) su nodo desaparece con animación suave

**Links:**
- Una línea entre cada par de nodos representando el DataChannel activo entre ellos
- Las líneas son semitransparentes para no saturar la pantalla cuando hay muchos nodos

**Física D3:**
- Usa `d3.forceSimulation` con `forceManyBody` para que los nodos se repelen entre sí
- Usa `forceLink` para mantener los links con distancia cónsistente
- Usa `forceCollide` para que los nodos no se encimen
- La física hace que los nodos se acomoden solos de forma natural

**Animación de mensajes de chat:**
- Cuando llega un evento `chat`, una bolita del color del nodo origen viaja por la pantalla desde la posición del nodo origen hasta la posición del nodo destino
- La bolita sigue una línea curva suave, no recta
- Al llegar al destino desaparece con un pulso de onda circular que se expande y se desvanece
- El destino del mensaje es un peer aleatorio de la red para efectos visuales del mock

### Día 5 — Panel técnico con datos simulados

En una esquina de la pantalla (esquina inferior derecha) agrega el panel técnico con estos datos simulados por ahora:

```
Peers activos: 5
Mensajes enviados: 142
Tiempo activo: 00:45:23
```

Y debajo un log de eventos que se actualiza en tiempo real con los eventos del mock:
```
> Carlos entró a la red
> Ana cambió a Zona B
> Pedro salió de la red
> Visitante nuevo entró a la red
```

El log muestra los últimos 8 eventos. Cuando llega el evento 9 eliminas el más antiguo.

### Días 6 y 7 — Integrar webrtc.js de Andrés

Cuando Andrés suba webrtc.js al repositorio el día 7:
- Cambia la importación en display.js de `mock-webrtc.js` a `webrtc.js`
- Prueba que el grafo reacciona a peers reales
- Reporta al grupo cualquier diferencia entre lo que devuelve el mock y lo que devuelve el real

---

## Semana 2 — Mapa del recinto y zonas

Esta es tu semana más importante. Tienes que dibujar el mapa real y posicionar los nodos en él.

### Días 8 al 10 — Definir zonas y dibujar recinto.svg

**Primero define las zonas:**
Antes de dibujar nada, decide cuántas zonas tiene el recinto de la feria y cómo se llaman. Ejemplo:
- Zona A
- Zona B
- Zona C
- Pasillo principal
- Escenario
- Entrada

Cuando tengas los nombres exactos **avisa inmediatamente a Erasmo y a Jesús**. Erasmo los agrega a protocol.js y Jesús los pone en el menú de selección de la app. Sin esto ellos no pueden avanzar en esa parte.

**Luego dibuja recinto.svg:**
Consigue el plano real del salón de la feria. Simplifícalo en formas básicas: rectángulos para las zonas, líneas para los pasillos, texto para los nombres. El SVG debe tener un viewBox que cubra todo el recinto. Cada zona es un elemento `<rect>` con su nombre como atributo `id` para que display.js pueda referenciarlo.

Ejemplo de estructura del SVG:
```
<rect id="zona-a"       x="..." y="..." width="..." height="..." />
<rect id="zona-b"       x="..." y="..." width="..." height="..." />
<rect id="pasillo"      x="..." y="..." width="..." height="..." />
<rect id="escenario"    x="..." y="..." width="..." height="..." />
<text>Zona A</text>
<text>Zona B</text>
```

### Días 11 al 14 — Nodos en el mapa por zona

**Posicionamiento por zona:**
Cuando llega un mensaje POSITION con `{ id, nombre, zona }`, mueves el nodo de ese peer al área de esa zona en el SVG. El nodo no usa coordenadas GPS, usa el centro del rectángulo de esa zona como destino.

**Distribución sin encimarse:**
Si varios peers están en la misma zona sus nodos se distribuyen dentro del área de esa zona de forma ordenada. Puedes usar un offset calculado según cuántos peers hay ya en esa zona: el primero va al centro, el segundo a la izquierda del centro, el tercero a la derecha, y así.

**Movimiento suave entre zonas:**
Cuando un peer cambia de zona su nodo no salta bruscamente. Usa una transición D3 de 800ms con `d3.easeCubicInOut` para que se deslice suavemente desde la zona anterior hasta la zona nueva.

**Rastro entre zonas:**
Cuando un peer cambia de zona dibuja una línea curva suave entre el centro de la zona anterior y el centro de la zona nueva. Esa línea tiene el color del peer, es semitransparente, y desaparece gradualmente en 5 segundos.

**Contador por zona:**
En cada zona del SVG muestra el número de personas que hay en ese momento. El número se actualiza automáticamente cuando alguien entra o sale de esa zona. Ponlo en la esquina superior del rectángulo de cada zona con fuente grande y visible.

**Historial lateral:**
En el lado derecho de la pantalla agrega un panel con el historial de eventos en tiempo real:
```
09:42 — Carlos entró en Zona A
09:43 — Ana cambió a Zona B
09:45 — Pedro salió de la red
09:46 — Visitante nuevo entró en Pasillo
```
Muestra los últimos 10 eventos. Cada evento tiene timestamp, nombre del peer y qué hizo.

---

## Semana 3 — Pruebas, QR y feria

### Días 15 al 17 — Pruebas con carga real

- Prueba la visualización con 6 o más peers moviéndose simultáneamente
- Verifica que las animaciones no se vuelven lentas o se acumulan con muchos eventos seguidos
- Verifica que el contador por zona se actualiza correctamente cuando varios peers cambian de zona al mismo tiempo
- Conecta `/metrics` de Erasmo al panel técnico y verifica que los números son correctos

**Integrar /metrics:**
En display.js llamas a `fetch("/metrics")` cada 2 segundos y actualizas el panel técnico con los datos reales:
```
peers_activos     → número de peers conectados
mensajes_totales  → mensajes enviados en total
uptime_segundos   → conviertes a formato HH:MM:SS
log               → últimos eventos para el historial lateral
```

### Días 18 y 19 — QR y stand

**Generar el QR:**
El QR apunta a la dirección IP local del servidor de Erasmo en la red de la feria, por ejemplo `http://192.168.1.100:3000/peer.html`. Usa un generador de QR online para crear una imagen de alta resolución lista para imprimir. El QR debe ser grande, mínimo 15x15 cm impreso para que se pueda escanear desde 1 metro de distancia.

**Planificar el stand:**
- La pantalla grande con el display va al centro o fondo del stand, visible desde lejos
- El QR impreso va en un lugar visible desde la entrada del stand
- Los integrantes del equipo se posicionan donde puedan invitar a la gente y explicar el proyecto
- Ten 3 celulares del equipo ya conectados antes de que llegue el primer visitante para que el mapa no empiece vacío

### Días 20 y 21 — Ensayo y feria

- Ensaya la demo completa con todo el equipo conectado al menos 2 veces
- Verifica que la pantalla grande se ve bien desde 3 metros de distancia
- Prepara las respuestas del jurado que están al final de este documento

---

## Tus entregas críticas

| Día | Qué entregas | Quién lo necesita |
|---|---|---|
| Día 1 | `mock-webrtc.js` listo | Solo tú |
| Día 4 | Grafo D3 completo con simulación | Solo tú |
| Día 7 | Grafo conectado a `webrtc.js` real | Verificación con Andrés |
| Día 10 | Nombres de zonas definidos y avisados | Erasmo y Jesús |
| Día 14 | `recinto.svg` completo, nodos por zona funcionando | Todo el equipo |
| Día 17 | Panel técnico con `/metrics` real | Erasmo |
| Día 19 | QR generado, stand planificado | Feria |

---

## Lo que NO haces

- No tocas `peer.html`, `peer.js`, `peer.css` — esos son de Jesús
- No tocas `server.js`, `signaling.js` — esos son de Erasmo
- No tocas `webrtc.js` — ese es de Andrés
- No implementas lógica WebRTC
- No usas coordenadas GPS — la posición es siempre el nombre de una zona

---

## Reglas del equipo

- Cada vez que hagas un cambio importante lo subes al repositorio y avisas en el grupo diciendo qué cambiaste
- Si necesitas un cambio en `protocol.js` o `config.js` se lo pides a Erasmo
- Si necesitas un cambio en la API de `webrtc.js` se lo pides a Andrés
- Si llevas más de 2 horas atascada en algo, lo dices en el grupo
- La semana 3 es de pruebas, no de código nuevo

---

## Lo que necesitas saber antes de arrancar

- JavaScript intermedio
- D3.js — dedica el día 1 a los ejemplos de force-directed graph en d3js.org antes de escribir código
- SVG básico para dibujar el mapa del recinto
- No necesitas saber nada de redes ni protocolos

---

## Preguntas que te puede hacer el jurado

**¿Por qué los nodos se ubican por zona y no por GPS?**
Porque el GPS en interiores tiene un margen de error de 15 a 50 metros, que es mayor que el tamaño del recinto mismo. Tomamos la decisión de diseño de usar selección manual de zona porque es más precisa, más confiable y más honesta técnicamente. El visitante sabe mejor que cualquier sensor dónde está parado.

**¿Qué es D3.js y cómo funciona el grafo?**
D3.js es una librería de visualización de datos que usa SVG para dibujar elementos en el browser. El grafo usa un sistema de simulación de física donde los nodos se repelen entre sí y los links los mantienen conectados. El resultado es un grafo que se autoorganiza de forma natural y reacciona en tiempo real a los cambios de la red.

**¿Qué representa cada línea entre nodos?**
Cada línea representa un WebRTC DataChannel activo entre dos peers. Significa que esos dos dispositivos tienen un canal de comunicación directo, cifrado y sin servidor intermediario. Si la línea desaparece es porque uno de los dos peers se desconectó.

**¿Qué significa la bolita que viaja entre nodos?**
Representa un mensaje de chat viajando directamente de un celular a otro por el DataChannel. El color de la bolita corresponde al nodo que envió el mensaje. La animación dura lo que tarda el mensaje en llegar en tiempo real.

**¿Cómo sabe el display dónde está cada persona?**
Cuando el visitante selecciona su zona en la app de su celular, ese dato se transmite a todos los peers conectados vía WebRTC DataChannel. El display recibe ese mensaje con el ID del peer y el nombre de la zona, y mueve el nodo al área correspondiente en el mapa del recinto.

**¿Qué muestra el panel técnico?**
El panel técnico muestra métricas en tiempo real del servidor de señalización: cuántos peers están conectados actualmente, cuántos mensajes han viajado por la red en total, cuánto tiempo lleva el servidor activo, y un log de los últimos eventos de la red. Estos datos se actualizan cada 2 segundos consultando una ruta del servidor.

**¿Cuántas personas puede mostrar simultáneamente?**
La visualización puede manejar 30 o más nodos simultáneos sin problemas de rendimiento. D3.js está optimizado para actualizaciones frecuentes del DOM y las animaciones usan requestAnimationFrame del browser para no bloquear la interfaz.
