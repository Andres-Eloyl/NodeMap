const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'nodemap-work.db');
const db = new Database(dbPath, { verbose: console.log });
db.pragma('journal_mode = WAL'); // Better concurrency

function initDB() {
  // WORKS TABLES
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      correo TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      rol TEXT NOT NULL,
      departamento TEXT NOT NULL,
      activo INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS reportes (
      id TEXT PRIMARY KEY,
      tipo TEXT NOT NULL,
      titulo TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      departamento TEXT NOT NULL,
      autor TEXT NOT NULL,
      autor_id TEXT NOT NULL,
      estado TEXT NOT NULL,
      prioridad TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS eventos (
      id TEXT PRIMARY KEY,
      tipo TEXT NOT NULL,
      datos TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tareas (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      asignado_a TEXT,
      estado TEXT NOT NULL,
      canal TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS eventos_calendario (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      departamento TEXT NOT NULL,
      fecha_inicio INTEGER NOT NULL,
      fecha_fin INTEGER NOT NULL,
      creador TEXT NOT NULL
    );
  `);

  // CONSUMER TABLES
  db.exec(`
    CREATE TABLE IF NOT EXISTS consumer_foro (
      id TEXT PRIMARY KEY,
      senderId TEXT NOT NULL,
      senderName TEXT NOT NULL,
      content TEXT NOT NULL,
      color TEXT,
      avatar TEXT,
      likes INTEGER DEFAULT 0,
      comentarios INTEGER DEFAULT 0,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS consumer_mensajes (
      id TEXT PRIMARY KEY,
      senderId TEXT NOT NULL,
      senderName TEXT NOT NULL,
      content TEXT NOT NULL,
      color TEXT,
      avatar TEXT,
      isSystem INTEGER DEFAULT 0,
      timestamp INTEGER NOT NULL
    );
  `);
}

initDB();

// --- EXPORTED METHODS ---

module.exports = {
  db,
  
  // USUARIOS
  usuarios: {
    crear: (u) => {
      const stmt = db.prepare('INSERT OR REPLACE INTO usuarios (id, nombre, correo, password, rol, departamento, activo) VALUES (?, ?, ?, ?, ?, ?, ?)');
      return stmt.run(u.id, u.nombre, u.correo, u.password, u.rol, u.departamento, u.activo ? 1 : 0);
    },
    buscarPorCorreo: (correo) => db.prepare('SELECT * FROM usuarios WHERE correo = ?').get(correo),
    listar: () => db.prepare('SELECT id, nombre, correo, rol, departamento, activo FROM usuarios').all(),
  },

  // REPORTES
  reportes: {
    crear: (r) => {
      const stmt = db.prepare('INSERT OR REPLACE INTO reportes (id, tipo, titulo, descripcion, departamento, autor, autor_id, estado, prioridad, timestamp, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      return stmt.run(r.id, r.tipo, r.titulo, r.descripcion, r.departamento, r.autor, r.autor_id, r.estado, r.prioridad, r.timestamp, r.metadata ? JSON.stringify(r.metadata) : null);
    },
    actualizarEstado: (id, estado) => {
      return db.prepare('UPDATE reportes SET estado = ? WHERE id = ?').run(estado, id);
    },
    listarTodos: () => db.prepare('SELECT * FROM reportes ORDER BY timestamp DESC').all(),
  },

  // EVENTOS (LOG)
  eventos: {
    registrar: (tipo, datos) => {
      const id = Date.now().toString() + Math.random().toString().substring(2, 6);
      return db.prepare('INSERT INTO eventos (id, tipo, datos, timestamp) VALUES (?, ?, ?, ?)').run(id, tipo, JSON.stringify(datos), Date.now());
    },
    listar: (limit = 100) => db.prepare('SELECT * FROM eventos ORDER BY timestamp DESC LIMIT ?').all(limit),
  },

  // TAREAS KANBAN
  tareas: {
    crear: (t) => {
      return db.prepare('INSERT OR REPLACE INTO tareas (id, titulo, descripcion, asignado_a, estado, canal, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)').run(t.id, t.titulo, t.descripcion, t.asignado_a, t.estado, t.canal, t.timestamp);
    },
    actualizarEstado: (id, estado) => db.prepare('UPDATE tareas SET estado = ? WHERE id = ?').run(estado, id),
    listarPorCanal: (canal) => db.prepare('SELECT * FROM tareas WHERE canal = ? ORDER BY timestamp DESC').all(canal),
  },

  // CALENDARIO
  calendario: {
    crear: (e) => {
      return db.prepare('INSERT OR REPLACE INTO eventos_calendario (id, titulo, descripcion, departamento, fecha_inicio, fecha_fin, creador) VALUES (?, ?, ?, ?, ?, ?, ?)').run(e.id, e.titulo, e.descripcion, e.departamento, e.fecha_inicio, e.fecha_fin, e.creador);
    },
    listarPorDepartamento: (dep) => db.prepare('SELECT * FROM eventos_calendario WHERE departamento = ? OR departamento = "ALL" ORDER BY fecha_inicio ASC').all(dep),
  },

  // CONSUMER FORO
  consumerForo: {
    crear: (f) => {
      return db.prepare('INSERT OR REPLACE INTO consumer_foro (id, senderId, senderName, content, color, avatar, likes, comentarios, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(f.id, f.senderId, f.senderName, f.content, f.color, f.avatar, f.likes || 0, f.comentarios || 0, f.timestamp);
    },
    listar: (limit = 50) => db.prepare('SELECT * FROM consumer_foro ORDER BY timestamp DESC LIMIT ?').all(limit),
  },

  // CONSUMER MENSAJES
  consumerMensajes: {
    crear: (m) => {
      return db.prepare('INSERT INTO consumer_mensajes (id, senderId, senderName, content, color, avatar, isSystem, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(m.id, m.senderId, m.senderName, m.content, m.color, m.avatar, m.isSystem ? 1 : 0, m.timestamp);
    },
    listar: (limit = 100) => db.prepare('SELECT * FROM consumer_mensajes ORDER BY timestamp ASC LIMIT ?').all(limit),
  }
};
