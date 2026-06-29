# Plan de Implementación Final - NodeMap Works

## Bloque 1 — Base de datos SQLite + IndexedDB

**Qué hace:** Persiste todos los datos del sistema para que no se pierdan si alguien recarga la página o el servidor se reinicia. SQLite guarda lo que es de toda la organización y IndexedDB guarda lo que es personal de cada dispositivo.

**Qué incluye SQLite:**
- Tabla `usuarios` con id, nombre, correo, password, rol, departamento y estado activo
- Tabla `reportes` con todos los campos del reporte incluyendo estado y timestamps de resolución
- Tabla `eventos` con el log global de actividad de la red
- Tabla `tareas` para el Kanban con estado, asignación y canal
- Tabla `eventos_calendario` para las reuniones y eventos por departamento

**Qué incluye IndexedDB:**
- Store `mensajes` con historial de los últimos 100 mensajes por canal
- Store `preferencias` para guardar apodo, zona y departamento del usuario
- Store `notificaciones` con historial de alertas recibidas y estado de leída

**Cómo se implementa:**
Instala `better-sqlite3` con `npm install better-sqlite3`. Crea `server/database.js` que abre o crea el archivo `nodemap-work.db` y define todas las tablas con `CREATE TABLE IF NOT EXISTS`. Exporta funciones específicas por entidad: `usuarios.crear()`, `usuarios.buscarPorCorreo()`, `reportes.crear()`, `reportes.listarTodos()`, `eventos.registrar()`, `tareas.crear()`, `tareas.actualizarEstado()`, `calendario.crear()`. En el servidor importas estas funciones y las llamas desde los endpoints REST y desde los eventos de Socket.io. Para IndexedDB crea `client/src/utils/localDB.js` con `initLocalDB()` que abre la base de datos del browser y define los stores. Llamas a `initLocalDB()` en el `useEffect` del componente principal de NodeMap Work.

**Quién lo implementa:**
Erasmo crea `database.js` completo y agrega las llamadas a `eventos.registrar()` en cada evento de Socket.io. Andrés agrega las llamadas a los endpoints REST desde `work.js` cuando ocurren acciones relevantes. Jesús integra `localDB.js` en el frontend y llama a `guardarMensaje()` cada vez que llega un mensaje de chat. María lee los datos de los endpoints en vez de la RAM para el dashboard y el PDF.

---

## Bloque 2 — Exportar reporte en PDF

**Qué hace:** Desde el panel del administrador un botón genera y descarga un PDF con el resumen completo de actividad de la red del día, listo para presentar en una reunión corporativa.

**Qué incluye el PDF:**
- Encabezado con logo de NodeMap Work, nombre de la organización y fecha de generación
- Resumen ejecutivo con total de empleados conectados, tiempo promedio de sesión, mensajes enviados y reportes generados
- Tabla de actividad por departamento con mensajes enviados, reportes creados y empleados activos
- Lista completa de reportes del día con tipo, título, autor, prioridad y estado actual
- Métricas técnicas de la red: latencia promedio, conexiones P2P activas y uptime del servidor
- Pie de página con timestamp exacto de generación

**Cómo se implementa:**
Instala jsPDF con `npm install jspdf` en el proyecto React. Crea `client/src/utils/generarPDF.js` con una función `generarReportePDF(metricas, reportes, empleados)` que recibe los datos ya disponibles y construye el PDF. Usa `jsPDF` para agregar texto, líneas y tablas con `doc.text()`, `doc.line()` y `doc.autoTable()` si agregas `jspdf-autotable`. Al terminar llamas a `doc.save('nodemap-work-reporte.pdf')` que dispara la descarga automáticamente en el browser. El botón en el dashboard del administrador llama a esta función pasándole los datos que ya tienes en el estado de React.

**Quién lo implementa:**
María crea `generarPDF.js` y agrega el botón en el panel del administrador. Erasmo verifica que el endpoint `/metrics` devuelva todos los datos necesarios incluyendo los reportes del día desde SQLite.

---

## Bloque 3 — Notificaciones push del sistema

**Qué hace:** Cuando ocurre un evento importante, el empleado recibe una notificación en la barra de notificaciones de su celular aunque tenga la app en segundo plano, igual que WhatsApp.

**Casos en que dispara:**
- Reporte urgente dirigido al departamento del usuario
- Reporte urgente dirigido a todos los departamentos
- Mensaje privado recibido cuando la app está en segundo plano
- Alerta enviada por el gerente a todo el equipo

**Casos en que NO dispara:**
- Mensajes de chat grupal normales
- Reportes de prioridad normal o media
- Actualizaciones de posición o zona

**Cómo se implementa:**
Crea `client/src/utils/notificaciones.js` con tres funciones. La primera es `solicitarPermiso()` que llama a `Notification.requestPermission()` y guarda el resultado. La segunda es `mostrarNotificacion(titulo, cuerpo, icono)` que crea una instancia de `new Notification()` con los parámetros recibidos solo si el permiso está concedido. La tercera es `debeNotificar(mensaje, usuarioActual)` que recibe el mensaje entrante y el usuario actual y devuelve true o false según las reglas definidas arriba. Llamas a `solicitarPermiso()` en el `useEffect` del componente principal al cargar la app. En el manejador de `onMessage` de cada tipo de mensaje relevante llamas a `debeNotificar()` y si devuelve true llamas a `mostrarNotificacion()`. Para guardar el historial de notificaciones llamas a `guardarNotificacion()` de IndexedDB.

**Quién lo implementa:**
Jesús crea `notificaciones.js` y lo integra en los manejadores de mensajes de `work.js`. Funciona en Chrome Android sin configuración extra. En Safari iOS el usuario debe agregar la app a la pantalla de inicio primero, lo cual es aceptable para la feria.

---

## Bloque 4 — Historial de sesión descargable

**Qué hace:** Desde el panel del administrador o al cerrar sesión, se puede descargar un archivo JSON con todo lo que ocurrió durante la sesión activa: quién se conectó, cuánto tiempo estuvo, cuántos mensajes envió, qué reportes generó y todos los eventos de la red.

**Qué incluye el JSON:**
- Objeto `sesion` con organización, timestamp de inicio, timestamp de fin y duración en minutos
- Objeto `resumen` con empleados conectados, mensajes totales, reportes creados, reportes resueltos y latencia promedio
- Array `empleados` donde cada entrada tiene id, nombre, departamento, rol, tiempo conectado en minutos, mensajes enviados, reportes creados y zonas visitadas
- Array `reportes` con todos los reportes de la sesión incluyendo timestamps de creación y resolución
- Array `eventos_red` con el log cronológico de todos los eventos: entradas, salidas, cambios de zona y alertas

**Cómo se implementa:**
Crea `client/src/utils/sesionLog.js` con un objeto `sesionLog` en memoria que se inicializa cuando el usuario entra a la app con el timestamp de inicio y los datos de la organización. Exporta funciones `registrarEvento(tipo, datos)`, `registrarMensaje(peerId)`, `registrarReporte(reporte)` y `descargarHistorial()`. La función `descargarHistorial()` cierra el log con el timestamp actual, calcula la duración, construye el JSON final con `JSON.stringify()`, crea un `Blob` con ese contenido, genera una URL temporal con `URL.createObjectURL()`, crea un elemento `<a>` invisible con el atributo `download` apuntando a esa URL, lo hace click programáticamente y luego lo elimina. Llamas a las funciones de registro desde los manejadores de mensajes de `work.js` cada vez que ocurre algo relevante. El botón de descarga en el dashboard del administrador llama a `descargarHistorial()`.

**Quién lo implementa:**
Erasmo llama a `registrarEvento()` desde `signaling.js` cuando un peer entra o sale. Andrés llama a `registrarMensaje()` y `registrarReporte()` desde `work.js`. María agrega el botón de descarga en el panel del administrador y llama a `descargarHistorial()`.

---

## Bloque 5 — Kanban por proyecto

**Qué hace:** Dentro de cada canal de departamento hay un tablero con tres columnas: Pendiente, En progreso y Completado. Cualquier miembro puede crear tareas, asignarlas a un compañero y moverlas entre columnas. Cada movimiento se sincroniza en tiempo real entre todos los peers del canal vía DataChannel.

**Qué incluye:**
- Tres columnas fijas: Pendiente, En progreso, Completado
- Tarjetas de tarea con título, descripción, asignado a y fecha de creación
- Botón de crear tarea disponible para todos los miembros del canal
- Drag and drop entre columnas en desktop, botones de mover en móvil
- Sincronización en tiempo real: cuando alguien mueve una tarea todos los peers del canal ven el cambio instantáneamente
- Persistencia en SQLite: las tareas sobreviven si alguien recarga la página

**Cómo se implementa:**
Agrega el tipo de mensaje `WORK_TASK_MOVE` y `WORK_TASK_CREATE` a `work-protocol.js`. Crea el componente React `KanbanBoard.jsx` con tres columnas renderizadas desde el estado local. El estado inicial se carga con `fetch('/work/tareas/' + canalActivo)` al abrir el tablero. Cuando el usuario crea una tarea llamas a `fetch POST /work/tareas` para guardarla en SQLite y luego llamas a `broadcast('WORK_TASK_CREATE', tarea)` para que todos los peers del canal la vean aparecer. Cuando el usuario mueve una tarea llamas a `fetch PATCH /work/tareas/:id` con el nuevo estado y luego llamas a `broadcast('WORK_TASK_MOVE', { id, estado })`. En el manejador de `onMessage` escuchas `WORK_TASK_CREATE` y `WORK_TASK_MOVE` y actualizas el estado local de React para que el tablero se re-renderice. Para drag and drop en desktop usa la API nativa de HTML5 drag and drop sin librerías extra.

**Quién lo implementa:**
Jesús crea el componente `KanbanBoard.jsx` y lo integra en la vista del canal. Andrés agrega los nuevos tipos de mensajes al enrutador de DataChannel en `webrtc.js`. Erasmo verifica que los endpoints de tareas en `database.js` funcionen correctamente.

---

## Bloque 6 — Calendario por departamento

**Qué hace:** El gerente puede crear eventos y reuniones en el calendario de su departamento. Todos los miembros del departamento ven los eventos en su dashboard con los próximos eventos destacados. Cuando se acerca la hora de un evento todos reciben una notificación push.

**Qué incluye:**
- Vista mensual del calendario con eventos marcados por día
- Formulario de creación de evento con título, descripción, fecha, hora de inicio y hora de fin
- Vista de próximos eventos en el dashboard mostrando los 5 siguientes
- Notificación push 15 minutos antes del inicio de cada evento
- Eventos visibles para todo el departamento o para toda la organización
- Persistencia en SQLite

**Cómo se implementa:**
Agrega el tipo de mensaje `WORK_CALENDAR_EVENT` a `work-protocol.js`. Crea el componente React `Calendario.jsx` que carga los eventos del departamento con `fetch('/work/calendario/' + departamento)` al montarse. El gerente ve un botón de crear evento que abre un formulario modal. Al crear un evento llamas a `fetch POST /work/calendario` para guardarlo en SQLite y luego llamas a `broadcast('WORK_CALENDAR_EVENT', evento)` para que todos los peers del departamento lo vean aparecer en su calendario sin recargar. Para las notificaciones de recordatorio crea una función `programarRecordatorio(evento)` que calcula cuántos milisegundos faltan para 15 minutos antes del evento y usa `setTimeout(() => mostrarNotificacion(...), milisegundosRestantes)`. Llamas a `programarRecordatorio()` para cada evento al cargar el calendario y cada vez que llega un `WORK_CALENDAR_EVENT` por DataChannel. En el manejador de `onMessage` escuchas `WORK_CALENDAR_EVENT` y agregas el evento al estado local de React.

**Quién lo implementa:**
Jesús crea el componente `Calendario.jsx` y lo integra en el dashboard. Andrés agrega `WORK_CALENDAR_EVENT` al enrutador de DataChannel. Erasmo verifica los endpoints del calendario en `database.js`. María agrega la vista de próximos eventos en el dashboard del gerente y administrador.
