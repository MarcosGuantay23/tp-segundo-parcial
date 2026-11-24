// =====================================================================
// routes/productos.js - RUTAS del CRUD de productos
// ---------------------------------------------------------------------
// Accesible para Administrador y Operador (requisito del TP).
// IMPORTANTE: las rutas fijas ("/nuevo", "/api/buscar") se declaran ANTES
// que "/:id", porque Express evalúa en orden y ":id" captaría cualquier texto.
// =====================================================================

const express = require('express');
const router = express.Router();

const productos = require('../controllers/productosController');
const subirFotografia = require('../middlewares/subirFotografia');
const { requiereSesion, permitirPerfiles } = require('../middlewares/auth');
const { PERFILES } = require('../config/constantes');

// Control de acceso: sesión válida y perfil Operador o Administrador.
router.use(requiereSesion, permitirPerfiles(PERFILES.ADMINISTRADOR, PERFILES.OPERADOR));

router.get('/', productos.lista);                  // Listado con filtros
router.get('/api/buscar', productos.buscarJson);   // JSON para el buscador dinámico (Fetch)
router.get('/nuevo', productos.formNuevo);         // Formulario de alta

router.post('/', subirFotografia, productos.crear);          // Alta (con foto)
router.get('/:id', productos.detalle);                       // Consulta
router.get('/:id/editar', productos.formEditar);             // Formulario de modificación
router.post('/:id/editar', subirFotografia, productos.actualizar); // Modificación (foto opcional)
router.post('/:id/eliminar', productos.eliminar);            // Baja

module.exports = router;
