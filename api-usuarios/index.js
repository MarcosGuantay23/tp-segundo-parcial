// =====================================================================
// index.js - PUNTO DE ENTRADA de la API REST de Usuarios
// ---------------------------------------------------------------------
// Responsabilidad de este archivo: ARRANCAR la aplicación.
//   1) Cargar las variables de entorno desde el archivo .env
//   2) Conectarse a MongoDB
//   3) Levantar el servidor HTTP de Express en un puerto
//
// La configuración de Express (rutas, middlewares) vive en app.js.
// Separar "armar la app" (app.js) de "arrancarla" (index.js) permite
// importar app.js en pruebas automatizadas sin levantar el servidor.
// =====================================================================

// 1) Cargamos el archivo .env y lo volcamos en process.env.
//    IMPORTANTE: esta línea debe ejecutarse ANTES de require('./app'),
//    porque los módulos leen process.env al cargarse.
require('dotenv').config();

// Importamos la aplicación Express ya configurada (rutas y middlewares).
const app = require('./app');

// Importamos la función que abre la conexión con MongoDB.
const conectarBD = require('./config/database');

// Puerto de escucha. Si no existe la variable PORT (ej.: en local),
// usamos 3000 por defecto. En Render, PORT la define la plataforma.
const PORT = process.env.PORT || 3000;

// Función asíncrona de arranque. Usamos async/await porque conectarBD()
// devuelve una Promesa: primero esperamos la conexión y recién después
// abrimos el puerto. Así nunca atendemos peticiones sin base de datos.
async function iniciarServidor() {
  try {
    // Esperamos a que Mongoose establezca la conexión con MongoDB.
    await conectarBD();

    // Ponemos a Express a escuchar solicitudes HTTP en el puerto indicado.
    app.listen(PORT, () => {
      console.log(`[API Usuarios] Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    // Si no hay conexión a la base, no tiene sentido seguir: informamos
    // el error y terminamos el proceso con código 1 (error).
    console.error('[API Usuarios] No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
}

// Llamamos a la función para que comience el arranque.
iniciarServidor();
