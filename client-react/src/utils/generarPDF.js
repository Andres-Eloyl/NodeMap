import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generarReportePDF({ metrics, networkStatus, reports, channels }) {
  const doc = new jsPDF();
  const fecha = new Date().toLocaleString();

  // Configuración base
  doc.setFont("helvetica");

  // 1. Encabezado
  doc.setFontSize(22);
  doc.setTextColor(41, 128, 185); // Color azul principal
  doc.text("NODEMAP WORKS", 14, 22);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text("Reporte Ejecutivo de Actividad de Red", 14, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`Generado el: ${fecha}`, 14, 36);

  // Línea separadora
  doc.setDrawColor(200);
  doc.line(14, 40, 196, 40);

  // 2. Resumen Ejecutivo
  doc.setFontSize(14);
  doc.setTextColor(50);
  doc.text("Resumen Ejecutivo", 14, 52);

  const stats = [
    ["Total Empleados Conectados:", (networkStatus?.length || 0).toString()],
    ["Mensajes Transmitidos (P2P):", (metrics?.mensajes_totales || 0).toString()],
    ["Reportes en Sistema:", (reports?.length || 0).toString()],
    ["Uptime del Servidor:", metrics?.uptime_segundos ? `${Math.floor(metrics.uptime_segundos / 60)} min` : 'N/A']
  ];

  autoTable(doc, {
    startY: 58,
    body: stats,
    theme: 'plain',
    styles: { cellPadding: 1, fontSize: 11, textColor: [80, 80, 80] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { cellWidth: 50 }
    }
  });

  // 3. Tabla de Usuarios Conectados
  let finalY = doc.lastAutoTable.finalY || 80;
  
  doc.setFontSize(14);
  doc.setTextColor(50);
  doc.text("Personal Conectado Actualmente", 14, finalY + 15);

  const usuariosBody = (networkStatus || []).map(u => [
    u.id.substring(0, 8),
    u.nombre,
    u.departamento,
    u.zona || 'N/A'
  ]);

  autoTable(doc, {
    startY: finalY + 20,
    head: [['Peer ID', 'Nombre', 'Departamento', 'Zona']],
    body: usuariosBody.length ? usuariosBody : [['-', 'No hay usuarios conectados', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 10 }
  });

  // 4. Tabla de Reportes
  finalY = doc.lastAutoTable.finalY || 120;
  
  doc.setFontSize(14);
  doc.setTextColor(50);
  doc.text("Estado de Reportes", 14, finalY + 15);

  const reportesBody = (reports || []).map(r => [
    r.tipo,
    r.titulo.substring(0, 30) + (r.titulo.length > 30 ? '...' : ''),
    r.autor,
    r.departamento,
    r.estado,
    new Date(r.timestamp).toLocaleDateString()
  ]);

  autoTable(doc, {
    startY: finalY + 20,
    head: [['Tipo', 'Título', 'Autor', 'Depto', 'Estado', 'Fecha']],
    body: reportesBody.length ? reportesBody : [['-', 'No hay reportes', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [52, 73, 94] },
    styles: { fontSize: 9 }
  });

  // 5. Pie de página con números
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount} - NodeMap Works Enterprise`, 14, doc.internal.pageSize.height - 10);
  }

  // Descargar PDF
  doc.save(`nodemap_reporte_${new Date().getTime()}.pdf`);
}
