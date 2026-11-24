// =====================================================================
// config/database.js - CONEXIÓN a la base de la entidad principal
// ---------------------------------------------------------------------
// Esta aplicación tiene SU PROPIA base (tp_negocio), distinta de
// usuarios_db, que pertenece a la API REST. Así cada proyecto administra
// solo sus datos (requisito del TP: base independiente).
// =====================================================================

const mongoose = require('mongoose');

// Abre la conexión con MongoDB. Devuelve una Promesa (usar con await).
async function conectarBD() {
  // La URI viene del archivo .env; nunca se escribe en el código.
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Falta la variable de entorno MONGODB_URI (revisar .env)');
  }

  await mongoose.connect(uri);
  console.log(`[MongoDB] Conectado a la base: ${mongoose.connection.name}`);
}

module.exports = conectarBD;
