// =====================================================================
// middlewares/subirFotografia.js - ENVOLTORIO de Multer para formularios
// ---------------------------------------------------------------------
// Si usáramos upload.single() directamente, un archivo inválido (tipo o
// tamaño) cortaría la petición con un error genérico. Este envoltorio
// captura el error y lo guarda en req.uploadError para que el controlador
// vuelva a mostrar el formulario con un mensaje claro.
// =====================================================================

const multer = require('multer');
const { upload } = require('../config/multer');
const { TAMANO_MAX_FOTO } = require('../config/constantes');

function subirFotografia(req, res, next) {
  // upload.single('fotografia') espera un campo de formulario llamado "fotografia".
  upload.single('fotografia')(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        const mb = TAMANO_MAX_FOTO / (1024 * 1024);
        req.uploadError = `La fotografía supera el máximo de ${mb} MB`;
      } else {
        req.uploadError = error.message;
      }
    }
    // Siempre continuamos: el controlador decide qué hacer con el error.
    next();
  });
}

module.exports = subirFotografia;
