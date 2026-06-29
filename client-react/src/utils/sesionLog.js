const sesionLog = {
  organizacion: "NodeMap Enterprise",
  inicio: Date.now(),
  eventos_red: [],
  mensajes_track: {}, // peerId -> count
  reportes_creados: 0
};

export function registrarEvento(tipo, datos) {
  sesionLog.eventos_red.push({
    timestamp: Date.now(),
    tipo,
    datos
  });
}

export function registrarMensajeTrack(peerId) {
  if (!sesionLog.mensajes_track[peerId]) {
    sesionLog.mensajes_track[peerId] = 0;
  }
  sesionLog.mensajes_track[peerId]++;
}

export function registrarReporteTrack() {
  sesionLog.reportes_creados++;
}

export function descargarHistorialJSON({ networkStatus, reports }) {
  const fin = Date.now();
  const duracionMinutos = Math.round((fin - sesionLog.inicio) / 60000);

  // Mapeamos los empleados con sus estadisticas
  const empleados = (networkStatus || []).map(u => ({
    id: u.id,
    nombre: u.nombre,
    departamento: u.departamento,
    mensajes_enviados: sesionLog.mensajes_track[u.id] || 0
  }));

  const payload = {
    sesion: {
      organizacion: sesionLog.organizacion,
      timestamp_inicio: new Date(sesionLog.inicio).toISOString(),
      timestamp_fin: new Date(fin).toISOString(),
      duracion_minutos: duracionMinutos
    },
    resumen: {
      empleados_conectados: empleados.length,
      reportes_creados_sesion: sesionLog.reportes_creados,
      total_eventos_registrados: sesionLog.eventos_red.length
    },
    empleados,
    reportes_actuales: reports,
    eventos_red: sesionLog.eventos_red
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `nodemap_sesion_${fin}.json`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
