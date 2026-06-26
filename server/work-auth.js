const express = require('express');
const router = express.Router();

// Base de datos en memoria para la feria
const usersDB = new Map([
  ['admin@empresa.com', { correo: 'admin@empresa.com', password: 'password123', rol: 'Administrador', departamento: 'Dirección', nombre: 'Admin Global' }],
  ['gerente@empresa.com', { correo: 'gerente@empresa.com', password: 'password123', rol: 'Gerente', departamento: 'Tecnología', nombre: 'Gerente Tech' }],
  ['colaborador1@empresa.com', { correo: 'colaborador1@empresa.com', password: 'password123', rol: 'Colaborador', departamento: 'Tecnología', nombre: 'Dev Frontend' }],
  ['colaborador2@empresa.com', { correo: 'colaborador2@empresa.com', password: 'password123', rol: 'Colaborador', departamento: 'Recursos Humanos', nombre: 'Especialista RRHH' }],
  ['maria@empresa.com', { correo: 'maria@empresa.com', password: 'password123', rol: 'Gerente', departamento: 'Operaciones', nombre: 'María Operaciones' }],
]);

// Endpoint de login
router.post('/login', express.json(), (req, res) => {
  const { correo, password } = req.body;
  
  if (!correo || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
  }

  const user = usersDB.get(correo);
  
  if (user && user.password === password) {
    // Retornamos sin el password
    const { password: _, ...safeUser } = user;
    return res.json({ success: true, user: safeUser });
  }

  return res.status(401).json({ error: 'Credenciales inválidas.' });
});

module.exports = router;
