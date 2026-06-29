export async function solicitarPermiso() {
  if (!("Notification" in window)) {
    console.warn("Este navegador no soporta notificaciones de escritorio.");
    return false;
  }
  
  if (Notification.permission === "granted") return true;
  
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  
  return false;
}

export function mostrarNotificacion(titulo, opciones = {}) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }
  
  const defaultOptions = {
    icon: '/favicon.ico', // Reemplazar con el ícono de la app real
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
  };

  const notification = new Notification(titulo, { ...defaultOptions, ...opciones });
  
  notification.onclick = function(event) {
    event.preventDefault(); // prevenir que el navegador haga foco en otra pestaña si no es necesario
    window.focus();
    notification.close();
  };
}

/**
 * Lógica para decidir si un evento amerita una notificación Push
 */
export function debeNotificar(tipo, datos, usuarioActual) {
  // No notificar si la app está activa y visible, a menos que sea muy crítico
  const estaVisible = !document.hidden;

  switch (tipo) {
    case 'REPORTE_URGENTE':
      // Si el reporte es 'alto' o 'critico' y pertenece al departamento del usuario o es global
      if (datos.prioridad === 'alta' || datos.prioridad === 'critica') {
        if (datos.departamento === 'ALL' || datos.departamento === usuarioActual?.departamento) {
          return true; // Siempre notifica urgencias, incluso si está visible (o podríamos omitirlo si visible)
        }
      }
      return false;

    case 'MENSAJE_PRIVADO':
      // Notificar mensaje privado solo si la pestaña NO está visible
      if (!estaVisible && datos.destino === usuarioActual?.id) {
        return true;
      }
      return false;

    case 'ALERTA_GERENCIAL':
      // Alertas marcadas como 'broadcast' por la gerencia
      return true;

    case 'CHAT_GRUPAL':
    case 'POS_SYNC':
    case 'PEER_JOIN':
    default:
      // No interrumpir por eventos rutinarios o chat general
      return false;
  }
}
