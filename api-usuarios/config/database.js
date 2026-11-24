// =====================================================================
// config/database.js - CONEXIÓN a MongoDB mediante Mongoose
// ---------------------------------------------------------------------
// Qué es Mongoose: un ODM (Object Document Mapper). Traduce objetos de
// JavaScript a documentos de MongoDB y viceversa, y permite definir
// esquemas con validaciones. Este módulo solo se encarga de conectarse.
//
// Por qué separarlo en un archivo: si mañana cambia la forma de conectar
// (por ejemplo, otra base o un nuevo host), solo se toca este archivo.
// =====================================================================

// Importamos Mongoose, la librería que habla con MongoDB.
const mongoose = require('mongoose');

// Función que establece la conexión. Es asíncrona porque conectarse a
// una base de datos (red, disco, autenticación) toma tiempo.
async function conectarBD() {
  // Leemos la cadena de conexión desde las variables de entorno.
  // NUNCA se escribe la URI directamente en el código: contiene usuario
  // y contraseña de la base, y no debe quedar en el repositorio.
  const uri = process.env.MONGODB_URI;

  // Validación temprana: si falta la variable, mostramos un error claro
  // en lugar de dejar que Mongoose falle con un mensaje confuso.
  if (!uri) {
    throw new Error('Falta la variable de entorno MONGODB_URI (revisar el archivo .env)');
  }

  // mongoose.connect() devuelve una Promesa. "await" espera a que se
  // resuelva (conexión exitosa) o se rechace (error de red/credenciales).
  await mongoose.connect(uri);

  // Mensaje informativo para saber a qué servidor nos conectamos.
  // mongoose.connection.host es el host del servidor de MongoDB.
  console.log(`[MongoDB] Conectado a: ${mongoose.connection.host} (base: ${mongoose.connection.name})`);
}

// Exportamos la función para que index.js y scripts/seed.js la usen.
module.exports = conectarBD;
