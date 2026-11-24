// =====================================================================
// middlewares/errorHandler.js - MANEJO CENTRALIZADO DE ERRORES
// ---------------------------------------------------------------------
// Objetivo: que TODOS los errores de la API tengan el mismo formato de
// respuesta JSON y el código HTTP correcto, sin repetir try/catch con
// res.status(...) en cada controlador.
//
// Formato de respuesta de error:
//   { "error": "mensaje", "detalles": [ ... ] }   (detalles es opcional)
// =====================================================================

// ---------------------------------------------------------------------
// 1) MIDDLEWARE 404: ruta no encontrada
// ---------------------------------------------------------------------
// Se ejecuta solo si ninguna ruta anterior respondió.
// Tiene 3 parámetros (req, res, next): Express lo trata como middleware normal.
function manejadorNoEncontrado(req, res) {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}

// ---------------------------------------------------------------------
// 2) MIDDLEWARE DE ERRORES
// ---------------------------------------------------------------------
// Express identifica un middleware de ERRORES porque tiene EXACTAMENTE
// 4 parámetros (err, req, res, next). Si le quitamos "next" dejaría de
// funcionar como manejador de errores.
function manejadorErrores(err, req, res, next) {
  // Si la respuesta ya empezó a enviarse, no podemos enviar otra.
  // Delegamos en el manejador por defecto de Express.
  if (res.headersSent) {
    return next(err);
  }

  // a) JSON mal formado en el body (ej.: una coma de más).
  //    express.json() lanza este error con type 'entity.parse.failed'.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la solicitud no es un JSON válido' });
  }

  // b) Errores de validación de Mongoose (el esquema rechazó un dato).
  //    err.errors contiene un detalle por cada campo inválido.
  if (err.name === 'ValidationError') {
    const detalles = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Datos inválidos', detalles });
  }

  // c) Violación de índice único en MongoDB (código 11000).
  //    Pasa cuando dos requests registran el mismo email "al mismo tiempo".
  //    La validación previa en el controlador no alcanza para esa carrera,
  //    por eso este índice único es la "última barrera" de integridad.
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Ya existe un registro con ese valor único (email)' });
  }

  // d) ID con formato inválido para ObjectId (ej.: "abc").
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Valor inválido para el campo ${err.path}` });
  }

  // e) Errores propios lanzados con HttpError (tienen "status").
  //    Si no tienen status, asumimos error interno del servidor (500).
  const status = err.status || 500;

  // Para errores 500 NO enviamos el detalle técnico al cliente (sería una
  // fuga de información). Lo registramos en la consola del servidor.
  if (status === 500) {
    console.error('[ERROR INTERNO]', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }

  return res.status(status).json({ error: err.message });
}

module.exports = {
  manejadorNoEncontrado,
  manejadorErrores,
};
