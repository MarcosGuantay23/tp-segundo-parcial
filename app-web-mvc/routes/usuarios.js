// =====================================================================
// routes/usuarios.js - RUTAS de administración de usuarios
// ---------------------------------------------------------------------
// TODAS las rutas exigen sesión Y perfil Administrador.
// router.use(...) aplica esos middlewares a todo el router.
// El Operador recibe 403 si intenta entrar acá.
// =====================================================================

const express = require('express');
const router = express.Router();

const usuarios = require('../controllers/usuariosController');
const { requiereSesion, permitirPerfiles } = require('../middlewares/auth');
const { PERFILES } = require('../config/constantes');

// Control de acceso para todo el módulo.
router.use(requiereSesion, permitirPerfiles(PERFILES.ADMINISTRADOR));

router.get('/', usuarios.listar);            // Listado
router.get('/nuevo', usuarios.formNuevo);    // Formulario de alta
router.post('/', usuarios.crear);            // Alta
router.get('/:id/editar', usuarios.formEditar);     // Formulario de modificación
router.post('/:id/editar', usuarios.actualizar);    // Modificación
router.post('/:id/eliminar', usuarios.deshabilitar); // Baja lógica
router.post('/:id/habilitar', usuarios.habilitar);   // Rehabilitar

module.exports = router;
