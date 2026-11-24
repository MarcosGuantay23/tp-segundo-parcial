// =====================================================================
// routes/usuarios.routes.js - DEFINICIÓN de las rutas de usuarios
// ---------------------------------------------------------------------
// Las rutas solo conectan "método HTTP + URL" con la cadena de middlewares
// y la función del controlador. NO contienen lógica de negocio.
//
// Una ruta se ejecuta en cadena, de izquierda a derecha:
//   router.put('/:id', validarObjectId, validarActualizar, actualizar)
//                        ↓               ↓                  ↓
//                    chequea ID     valida body        ejecuta lógica
// Si un middleware responde (res.status...) la cadena se corta.
// Si llama a next(), pasa al siguiente.
//
// Estas rutas se montan en app.js bajo el prefijo /api/usuarios.
// =====================================================================

// Importamos Express para crear un "router" (un mini-servidor de rutas).
const express = require('express');

// Creamos el router. Permite agrupar rutas relacionadas en un solo archivo.
const router = express.Router();

// Importamos las funciones del controlador.
const usuariosController = require('../controllers/usuarios.controller');

// Importamos los middlewares de validación.
const { validarCrear, validarActualizar, validarLogin } = require('../middlewares/validarUsuario');
const validarObjectId = require('../middlewares/validarObjectId');

// ---------------------------------------------------------------------
// IMPORTANTE: "/login" se declara ANTES que las rutas con ":id".
// Express evalúa las rutas en orden; si "/:id" estuviera primero, la
// palabra "login" se interpretaría como un ID.
// ---------------------------------------------------------------------

// POST /api/usuarios/login -> validar credenciales
router.post('/login', validarLogin, usuariosController.login);

// POST /api/usuarios/ -> registrar usuario
// (Express trata "/" y "" de la misma forma dentro del router, así que
// tanto /api/usuarios como /api/usuarios/ funcionan).
router.post('/', validarCrear, usuariosController.registrar);

// GET /api/usuarios -> listar usuarios (acepta filtros por query string)
router.get('/', usuariosController.listar);

// GET /api/usuarios/:id -> consultar un usuario
// ":id" es un parámetro dinámico: Express lo guarda en req.params.id
router.get('/:id', validarObjectId, usuariosController.obtener);

// PUT /api/usuarios/:id -> modificar un usuario
router.put('/:id', validarObjectId, validarActualizar, usuariosController.actualizar);

// DELETE /api/usuarios/:id -> deshabilitar un usuario (baja lógica)
router.delete('/:id', validarObjectId, usuariosController.eliminar);

module.exports = router;
