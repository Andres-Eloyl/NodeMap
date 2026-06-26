NodeMap Work — Instrucciones técnicas de implementación
¿Qué es NodeMap Work?
NodeMap Work es la versión empresarial de NodeMap. Usa exactamente la misma infraestructura P2P que ya está construida pero agrega una capa de identidad corporativa, roles y permisos, canales por departamento, sistema de reportes y panel de topología de red. Todo corre sobre la misma red P2P descentralizada sin servidor central de mensajes.

Lo que se agrega al proyecto existente
NodeMap Work no reemplaza nada de lo que ya está construido. Agrega encima tres cosas: una pantalla principal que divide los dos modos, una nueva entrada con login corporativo, y un conjunto de pantallas internas propias de la versión Work. La red P2P, el servidor de señalización y el motor WebRTC no se tocan.

Archivos nuevos que se crean
client/
├── index.html              ← pantalla principal con los dos modos
├── work/
│   ├── login.html          ← login corporativo de NodeMap Work
│   ├── work.html           ← app principal de NodeMap Work
│   ├── work.js             ← lógica de NodeMap Work
│   └── work.css            ← estilos corporativos
server/
└── work-auth.js            ← manejo de usuarios y roles corporativos
shared/
└── work-protocol.js        ← tipos de mensajes nuevos de NodeMap Work
Los archivos existentes peer.html, peer.js, peer.css, webrtc.js, server.js y signaling.js no se modifican.

Pantalla principal — index.html
Es la primera pantalla que ve cualquier persona. Tiene el logo de NodeMap, un tagline, y dos opciones claramente diferenciadas: NodeMap para el público general y NodeMap Work para acceso corporativo. Cada opción tiene su propio botón de acceso que lleva a su respectivo login.
Lo que construye Jesús:

Reemplaza peer.html como punto de entrada por index.html. Desde index.html el visitante elige su modo. El botón de NodeMap lleva a peer.html como siempre. El botón de NodeMap Work lleva a work/login.html.

Login corporativo — work/login.html
Formulario con dos paneles. El panel izquierdo muestra la identidad de NodeMap Work con sus características clave. El panel derecho tiene el formulario de acceso con los siguientes campos:

Correo corporativo (tipo email)
Contraseña
Selector de rol: Colaborador, Gerente, Administrador
Selector de departamento: Tecnología, Operaciones, Recursos Humanos, Dirección, Finanzas
Checkbox de mantener sesión activa

Además hay una opción secundaria de acceso por token corporativo para cuando el administrador genera claves de acceso sin contraseña.
Validaciones que implementa Jesús:

El correo no puede estar vacío. La contraseña debe tener mínimo 6 caracteres. El rol y departamento son obligatorios. Al enviar el formulario guarda en sessionStorage el objeto de usuario: { nombre, correo, rol, departamento } y redirige a work/work.html.
Lo que construye Erasmo en work-auth.js:

Un Map en memoria con los usuarios registrados de la organización. Cada usuario tiene { correo, password, rol, departamento, nombre }. Al recibir las credenciales verifica que existan y que el password coincida. Devuelve el objeto de usuario si es correcto o un error si no. No usa base de datos, todo en memoria durante la sesión de la feria.

Nuevos tipos de mensajes — work-protocol.js
Erasmo agrega este archivo en la carpeta shared. Define los tipos de mensajes nuevos que usa NodeMap Work. Los mensajes existentes en protocol.js no cambian.
ConstanteValorQuién lo usaPara quéWORK_CHANNEL_MSG"work-channel-msg"DataChannel directoMensaje en un canal de departamentoWORK_PRIVATE_MSG"work-private-msg"DataChannel directoMensaje privado entre dos empleadosWORK_REPORT"work-report"DataChannel directoEnvío de un reporteWORK_REPORT_UPDATE"work-report-update"DataChannel directoActualización de estado de un reporteWORK_STATUS"work-status"DataChannel directoCambio de estado del empleadoWORK_POSITION"work-position"DataChannel directoCambio de ubicación en las instalaciones
Formato de cada mensaje:
WORK_CHANNEL_MSG:
{
  id: "abc123",
  nombre: "Carlos Andrés",
  departamento: "Tecnología",
  canal: "general-tech",
  texto: "Buenos días equipo",
  timestamp: 1718123456789
}
WORK_PRIVATE_MSG:
{
  id: "abc123",
  nombre: "Carlos Andrés",
  destino_id: "def456",
  destino_nombre: "María López",
  texto: "Te mando el link",
  timestamp: 1718123456789
}
WORK_REPORT:
{
  id: "abc123",
  nombre: "Juan Pérez",
  departamento: "Tecnología",
  tipo: "incidente",
  titulo: "Servidor staging caído",
  descripcion: "El servidor dejó de responder...",
  prioridad: "urgente",
  departamento_destino: "Tecnología",
  ubicacion: "Sala A",
  timestamp: 1718123456789
}
WORK_REPORT_UPDATE:
{
  reporte_id: "rep123",
  estado: "resuelto",
  comentario: "Se reinició el servidor",
  actualizado_por: "Carlos Andrés",
  timestamp: 1718123456789
}
WORK_STATUS:
{
  id: "abc123",
  nombre: "Ana Soto",
  estado: "en-reunion",
  timestamp: 1718123456789
}
WORK_POSITION:
{
  id: "abc123",
  nombre: "Carlos Andrés",
  departamento: "Tecnología",
  ubicacion: "Sala B",
  timestamp: 1718123456789
}

App principal — work/work.html y work.js
Es la interfaz que ve el empleado después de iniciar sesión. Tiene una barra lateral de navegación y un área de contenido principal que cambia según la sección activa.
Barra lateral de navegación
La barra lateral muestra las secciones disponibles según el rol del usuario. Los tres roles ven secciones diferentes.
Colaborador ve:

Sus canales de departamento
Canales globales de la empresa
Mensajes privados
Sus reportes
Su estado y ubicación

Gerente ve todo lo del colaborador más:

Lista completa de su equipo con estado y ubicación
Todos los reportes de su departamento
Opción de enviar alerta a todo el departamento
Mapa de su departamento con ubicaciones en tiempo real

Administrador ve todo lo del gerente más:

Vista global de toda la organización
Gestión de departamentos y roles
Métricas globales de la red
Panel técnico completo
Topología de red
Configuración del sistema

Módulo de canales
Es el módulo central de NodeMap Work. Funciona igual que el chat del NodeMap consumer pero organizado por canales de departamento.
Estructura de canales:

Cada departamento tiene un canal general llamado general-[departamento]. Dentro del departamento puede haber subcanales por proyecto. Hay canales globales de empresa visibles para todos. Los mensajes privados aparecen como conversaciones individuales en la sección de privados.
Lo que construye Andrés en work.js:

Reutiliza exactamente las funciones de webrtc.js que ya existen. broadcast y sendMessage ya funcionan. Solo agrega el filtrado de mensajes por canal: cuando llega un WORK_CHANNEL_MSG verifica si el campo canal corresponde al canal actualmente visible y solo entonces lo muestra en pantalla.
Lo que construye Jesús en work.js:

La UI de los canales. Lista de canales en el sidebar con indicador de mensajes no leídos. Área de chat con historial de mensajes mostrando nombre, departamento y timestamp de cada mensaje. Campo de texto y botón de enviar. Al enviar llama a broadcast con tipo WORK_CHANNEL_MSG y los datos del mensaje incluyendo el nombre del canal activo.
Módulo de reportes
Formulario de creación:

Campos: tipo de reporte (incidente, solicitud, novedad, urgente), título, descripción, prioridad (normal, media, urgente), departamento destino, ubicación del incidente, adjunto opcional. Al enviar llama a broadcast con tipo WORK_REPORT.
Lista de reportes:

Muestra todos los reportes recibidos en la red ordenados por timestamp descendente. Cada reporte muestra tipo, título, autor, departamento, tiempo transcurrido, prioridad y estado. Los botones de acción varían según el rol: el colaborador puede responder, el gerente puede marcar como resuelto o escalar, el administrador puede hacer todo.
Actualización de estado:

Al cambiar el estado de un reporte llama a broadcast con tipo WORK_REPORT_UPDATE. Todos los peers actualizan el estado del reporte en su lista localmente.
Persistencia durante la sesión:

Los reportes se guardan en un array en memoria en work.js. No se pierden cuando cambia la sección activa. Se pierden cuando el empleado cierra la app, lo cual es aceptable para la feria.
Módulo de mapa de instalaciones
Similar al mapa del recinto de NodeMap consumer pero con departamentos en vez de zonas genéricas.
Lo que construye María:

Un nuevo SVG llamado work-instalaciones.svg con el plano de las instalaciones corporativas dividido por departamentos. Los departamentos son: Tecnología, Operaciones, Recursos Humanos, Dirección y Finanzas. Cada departamento puede tener subdivisiones internas como Sala A, Sala B y pasillo.
Posicionamiento:

Cuando un empleado cambia de ubicación en la app, llama a broadcast con tipo WORK_POSITION y el nombre de la sala. Todos los peers que tienen el mapa abierto mueven el punto de ese empleado a la nueva sala. Los puntos tienen el color del departamento del empleado, no un color aleatorio.
Panel técnico — solo para Administrador
Muestra en tiempo real las métricas de la red P2P. Lee la ruta /metrics de Erasmo cada 2 segundos igual que el display principal. Agrega encima las métricas propias de NodeMap Work:

Mensajes por canal en las últimas 24 horas
Reportes creados, resueltos y pendientes
Empleados conectados por departamento
Latencia promedio por departamento
Conexiones P2P activas totales
Log de eventos de señalización en tiempo real

Simulador de estrés:

Botones para introducir latencia artificial de 50ms, 200ms y 500ms. Botones para simular pérdida de paquetes de 5%, 15% y 30%. Andrés implementa esto en webrtc.js como una función que introduce un setTimeout artificial antes de enviar cada mensaje por el DataChannel.
Cifrado visible:

Una sección que muestra en tiempo real el texto plano de los últimos mensajes junto a su versión cifrada representada como caracteres aleatorios. Aclara que el servidor nunca ve el contenido real, solo los bytes cifrados.
Módulo de topología — solo para Administrador
Un grafo D3.js que muestra la red P2P completa de la organización. Los nodos son los empleados agrupados por departamento. Las líneas representan los DataChannels activos entre ellos.
Lo que construye María:

Reutiliza el grafo D3.js que ya existe en display.js pero con estas diferencias: los nodos se agrupan por departamento con un nodo padre por departamento, los colores corresponden al departamento del empleado, hay tres vistas switcheables (mesh completo, por departamento y árbol jerárquico), y el panel lateral muestra estadísticas de la topología como número de conexiones, grado promedio, diámetro de la red y nivel de resiliencia.

Roles y permisos — resumen
FunciónColaboradorGerenteAdministradorVer canales de su departamentoSíSíSíVer canales globalesSíSíSíCrear reportesSíSíSíResolver reportes de su equipoNoSíSíVer equipo completo con ubicaciónNoSolo su dept.Toda la org.Enviar alerta a departamentoNoSíSíPanel técnico completoNoNoSíTopología de redNoNoSíGestionar roles y departamentosNoNoSí

División de trabajo para NodeMap Work