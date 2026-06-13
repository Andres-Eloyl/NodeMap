# Guía de Ejecución y Visualización de NodeMap

Esta guía explica paso a paso cómo correr el proyecto **NodeMap** para ver su funcionamiento en tiempo real. 

El sistema cuenta con dos modos principales de ejecución:
1. **Modo Simulación (Mock)**: Para ver y probar todos los efectos visuales, simulando peers, chats, cambios de zonas y métricas sin necesidad de levantar otros dispositivos o configurar WebRTC real.
2. **Modo Real (Servidor y WebRTC)**: Para conectar múltiples dispositivos reales en la misma red local (o múltiples pestañas) y establecer canales P2P reales.

---

## Opción 1: Modo Simulación (Recomendado para verificar UI/Diseño)

Este modo utiliza `mock-webrtc.js` para generar datos simulados automáticamente. No requiere configurar servidores ni conectar otros dispositivos.

### Paso 1: Activar el simulador en la interfaz
1. Abre el archivo [client/display.html](file:///c:/Users/Maria%20Tovar/Documents/Proyecto%20Teleprocesos/NodeMap/client/display.html) en tu editor.
2. Ve a la sección final (aproximadamente en la línea 133) y **descomenta** la línea del script `mock-webrtc.js`.
   
   Debe quedar así:
   ```html
   <!-- Modo mock (descomentar para desarrollo sin servidor): -->
   <script src="mock-webrtc.js"></script>
   ```

### Paso 2: Abrir el Dashboard en el navegador
Puedes abrir el archivo de dos formas:

* **Método A (Doble Clic):** Abre directamente el archivo [client/display.html](file:///c:/Users/Maria%20Tovar/Documents/Proyecto%20Teleprocesos/NodeMap/client/display.html) haciendo doble clic sobre él en tu explorador de archivos.
  *(Nota: Al abrir directamente con el protocolo `file://`, las políticas CORS de seguridad del navegador bloquearán la carga del mapa `recinto.svg`. Gracias al soporte de respaldo añadido, el programa lo detectará y renderizará automáticamente un plano sintético con cajas de colores para cada zona para que puedas verificar el funcionamiento de las animaciones y nodos).*
* **Método B (Servidor Local Estático - Recomendado):** Si utilizas VS Code, haz clic derecho sobre `display.html` y selecciona **Open with Live Server**. O si tienes `npx` instalado, corre el siguiente comando en la raíz del proyecto para servir la carpeta `client`:
  ```powershell
  npx http-server client
  ```
  Y entra en la dirección que te indique (por defecto `http://localhost:8080/display.html`). Esto cargará el archivo real `recinto.svg` del mapa de fondo.

### ¿Qué verás en el Modo Simulación?
* **Badge de SIMULACIÓN:** En el encabezado superior verás una etiqueta violeta que indica `[ SIMULACIÓN ]`.
* **Nodos Iniciales:** Aparecerán 5 peers (Carlos, Ana, Pedro, Laura, Miguel) con colores vibrantes y efectos de sombra (glow).
* **Posicionamiento por Zonas:** Los nodos se agruparán de manera orgánica y ordenada dentro de los rectángulos del mapa del recinto (`recinto.svg` cargado de fondo).
* **Áreas de Conexión (Convex Hulls):** Se dibujarán contornos difusos y semitransparentes del color de cada zona rodeando a los nodos que compartan espacio.
* **Partículas en Movimiento:** Un fondo sutil de estrellas o partículas diminutas que flotan de forma fluida.
* **Mensajes de Chat Animados:** Bolitas del color del emisor viajarán siguiendo una curva Bezier hacia el nodo receptor cada 3-5 segundos.
* **Efecto de Respiración:** Los nodos que envíen mensajes empezarán a pulsar (animación de respiración) de forma más intensa durante 10 segundos.
* **Transiciones de Zona:** Los nodos viajarán de una zona a otra dejando un rastro visual curvo temporal y reorganizándose de manera inteligente al llegar a su destino.
* **Métricas y Logs:** El panel técnico inferior mostrará latencia media, nodos activos y tráfico. La barra lateral derecha (Historial de Eventos) irá imprimiendo las conexiones, desconexiones y chats simulados.

---

## Opción 2: Modo Real (Servidor P2P WebRTC)

Este modo conecta el panel de visualización central con los visitantes reales que envían su posición y chatean desde sus dispositivos.

### Paso 1: Instalar dependencias e iniciar el servidor de señalización
1. Abre una consola/terminal de PowerShell y navega a la carpeta del servidor:
   ```powershell
   cd server
   ```
2. Instala los paquetes requeridos por primera vez (Express y Socket.io):
   ```powershell
   npm install
   ```
3. Inicia el servidor de señalización:
   ```powershell
   npm start
   ```

El servidor mostrará un mensaje de arranque similar a este en la terminal:
```text
🚀 Servidor de señalización listo

   Local:    http://localhost:3000
   Red:      http://192.168.1.15:3000
   Métricas: http://192.168.1.15:3000/metrics
   Test:     http://192.168.1.15:3000/test-signaling.html

   Para celulares: conéctense a http://192.168.1.15:3000
```

### Paso 2: Asegurar que el Simulador está comentado
Asegúrate de que en [client/display.html](file:///c:/Users/Maria%20Tovar/Documents/Proyecto%20Teleprocesos/NodeMap/client/display.html), el script `mock-webrtc.js` esté **comentado** (o eliminado) para que la página intente cargar la API de WebRTC real en su lugar.

### Paso 3: Abrir la visualización principal (Display)
En tu navegador principal, accede a:
```text
http://localhost:3000/display.html
```
* Verás una etiqueta roja en vivo en el encabezado `[ 🔴 EN VIVO ]`.
* El panel mostrará "Esperando conexiones..." y el indicador de servidor se iluminará en verde indicando "Servidor conectado".
* El dashboard consultará automáticamente el endpoint `/metrics` del servidor cada 2 segundos.

### Paso 4: Conectar clientes de prueba (Peers)
Como el archivo `peer.html` y su interfaz de usuario móvil están siendo desarrollados por Jesús y pueden estar en blanco, puedes probar la red real usando la herramienta de prueba de señalización:

1. Abre múltiples pestañas del navegador o dispositivos móviles conectados a la **misma red WiFi** y entra a la dirección de red que imprimió el servidor (ejemplo: `http://192.168.1.15:3000/test-signaling.html`).
2. El sistema te pedirá un nombre de usuario. Introduce nombres diferentes (ej. *Diana*, *Lucas*, etc.).
3. En la visualización del dashboard principal (`display.html`), verás cómo se agregan dinámicamente nuevos nodos para cada visitante conectado, listos para negociar conexiones P2P en el grafo.
