// =====================================================================
// controllers/homeController.js - PANEL PRINCIPAL (dashboard)
// ---------------------------------------------------------------------
// Muestra un resumen: cantidad de productos, últimos cargados y accesos
// rápidos según el perfil del usuario.
// =====================================================================

const Producto = require('../models/Producto');

// GET / -> dashboard
async function dashboard(req, res, next) {
  try {
    // Dos consultas en paralelo con Promise.all: mejor rendimiento que
    // esperar una y luego la otra.
    const [totalProductos, ultimos] = await Promise.all([
      Producto.countDocuments(),                              // Cantidad total.
      Producto.find().sort({ createdAt: -1 }).limit(5).lean() // 5 más recientes.
      // lean() devuelve objetos JavaScript simples (más liviano que documentos Mongoose).
    ]);

    res.render('index', {
      titulo: 'Panel principal',
      totalProductos,
      ultimos,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { dashboard };
