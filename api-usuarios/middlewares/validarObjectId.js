// =====================================================================
// middlewares/validarObjectId.js - VALIDACIÓN del parámetro :id
// ---------------------------------------------------------------------
// Un ObjectId de MongoDB es un texto de exactamente 24 caracteres
// hexadecimales (0-9, a-f). Si el cliente envía otra cosa, por ejemplo
// /api/usuarios/abc, Mongoose lanzaría un CastError. Este middleware
// responde antes, con un 400 claro, sin llegar a consultar la base.
// =====================================================================

// Expresión regular: exactamente 24 caracteres hexadecimales.
const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

function validarObjectId(req, res, next) {
  // req.params.id contiene el valor que aparece en la URL después de /usuarios/
  if (!OBJECT_ID_REGEX.test(req.params.id)) {
    return res.status(400).json({
      error: `El identificador "${req.params.id}" no es un ID válido`,
    });
  }

  // ID válido: continuamos con el controlador.
  next();
}

module.exports = validarObjectId;
