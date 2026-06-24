export const roomToMacroZone = {
    'Aula 6': 'Zona A',
    'Aula 5': 'Zona A',
    'Aula 4': 'Zona A',
    'Aula 3': 'Zona A',
    'Laboratorio 1': 'Zona A',
    'Laboratorio 2': 'Zona A',
    'Laboratorio 3': 'Zona A',
    'Almacen': 'Zona A',
    'Pasillo Central': 'Zona B', 
    'Laboratorio 4': 'Zona B',
    'Servicio Comunitario': 'Zona B',
    'Laboratorio 5': 'Zona B',
    'Laboratorio 6': 'Zona B',
    'Lab Computación': 'Zona B',
    'Lab Robótica': 'Zona B',
    'Pasillo Este': 'Zona C',
    'Telecomunicaciones': 'Zona C',
    'Baños': 'Zona C',
    'Laboratorio 7': 'Zona C',
    'Laboratorio 8': 'Zona C',
    'Laboratorio 9': 'Zona C',
    'Oficinas': 'Zona C',
    'Entrada': 'Zona C'
};

export function getMacroZone(zoneName) {
  if (!zoneName) return 'Zona A';
  if (['Zona A', 'Zona B', 'Zona C'].includes(zoneName)) return zoneName;
  return roomToMacroZone[zoneName] || 'Zona A';
}
