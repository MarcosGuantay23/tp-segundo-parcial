// =====================================================================
// app.js - CONFIGURACIÓN de la aplicación Express
// ---------------------------------------------------------------------
// Acá se "arma" la aplicación: se registran los middlewares globales,
// las rutas y los manejadores de error. NO se abre el puerto acá
// (eso lo hace index.js). Así este módulo puede importarse en tests.
//
// ORDEN IMPORTANTE de los middlewares en Express:
//   Express ejecuta los middlewares en el orden en que se registran.
//   1) Parsers (express.json) para que req.body esté disponible.
//   2) Rutas de la aplicación.
//   3) Manejador de "ruta no encontrada" (404).
//   4) Manejador de errores (siempre el ÚLTIMO, tiene 4 parámetros).
// =====================================================================

// Importamos el framework Express.
const express = require('express');

// Importamos el router con todas las rutas de /api/usuarios.
const usuariosRoutes = require('./routes/usuarios.routes');

// Importamos los dos middlewares de cierre: 404 y manejo de errores.
const {
  manejadorNoEncontrado,
  manejadorErrores,
} = require('./middlewares/errorHandler');

// Creamos la instancia de la aplicación. "app" representa el servidor.
const app = express();

// ---------------------------------------------------------------------
// MIDDLEWARE GLOBAL: express.json()
// ---------------------------------------------------------------------
// Lee el cuerpo (body) de las solicitudes que llegan con el encabezado
// "Content-Type: application/json", lo convierte de texto JSON a objeto
// JavaScript y lo deja en req.body. Sin esto, req.body sería undefined.
app.use(express.json());

// ---------------------------------------------------------------------
// RUTA RAÍZ: sirve como "health check".
// ---------------------------------------------------------------------
// Render (y cualquier monitor) puede consultar esta ruta para saber si
// el servicio está vivo. También sirve para verificar el despliegue.
app.get('/', (req, res) => {
  res.json({
    servicio: 'API REST de Usuarios',
    version: '1.0.0',
    estado: 'activo',
  });
});

// ---------------------------------------------------------------------
// RUTAS DE LA API
// ---------------------------------------------------------------------
// Todas las rutas de usuarios cuelgan del prefijo /api/usuarios.
// Por ejemplo, router.get('/') dentro del router se convierte en
// GET /api/usuarios, y router.get('/:id') en GET /api/usuarios/:id.
app.use('/api/usuarios', usuariosRoutes);

// ---------------------------------------------------------------------
// MANEJO DE ERRORES (siempre al final)
// ---------------------------------------------------------------------
// Si ninguna ruta anterior respondió, llegamos acá: respondemos 404.
app.use(manejadorNoEncontrado);

// Cualquier error lanzado con next(error) o dentro de una ruta cae en
// este middleware, que responde un JSON con el código HTTP adecuado.
app.use(manejadorErrores);

// Exportamos la app para que index.js (y los tests) puedan usarla.
module.exports = app;
