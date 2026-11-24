// =====================================================================
// routes/index.js - RUTAS públicas y del panel principal
// ---------------------------------------------------------------------
//   GET  /login    -> formulario de inicio de sesión (público)
//   POST /login    -> procesa credenciales (público)
//   POST /logout   -> cierra sesión
//   GET  /         -> dashboard (requiere sesión)
// =====================================================================

const express = require('express');
const router = express.Router();

const auth = require('../controllers/authController');
const home = require('../controllers/homeController');
const { requiereSesion } = require('../middlewares/auth');

router.get('/login', auth.mostrarLogin);
router.post('/login', auth.procesarLogin);
router.post('/logout', auth.cerrarSesion);

// Cualquier perfil logueado puede ver el panel.
router.get('/', requiereSesion, home.dashboard);

module.exports = router;
