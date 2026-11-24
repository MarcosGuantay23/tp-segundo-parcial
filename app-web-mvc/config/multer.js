// =====================================================================
// config/multer.js - CONFIGURACIÓN de Multer (subida de fotografías)
// ---------------------------------------------------------------------
// Multer procesa solicitudes "multipart/form-data" (las que mandan
// archivos desde un <input type="file">). Acá definimos:
//   - DÓNDE se guarda el archivo (storage)
//   - QUÉ archivos se aceptan (fileFilter: tipo)
//   - CUÁNTO pesa como máximo (limits: tamaño)
//
// NOTA de despliegue: en Render el disco es temporal. Por eso, en la
// nube, este almacenamiento debe reemplazarse por Cloudinary (la
// URL pública se guarda igual en el campo "fotografia").
// =====================================================================

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { FORMATOS_FOTO, TAMANO_MAX_FOTO } = require('./constantes');

// Carpeta donde se guardan las fotos (public/uploads), servida como estática.
const CARPETA_UPLOADS = path.join(__dirname, '..', 'public', 'uploads');

const storage = multer.diskStorage({
  // Destino: la carpeta de uploads.
  destination: (req, file, cb) => cb(null, CARPETA_UPLOADS),

  // Nombre único: timestamp + bytes aleatorios + extensión según el tipo.
  // Así dos archivos con el mismo nombre original nunca se pisan.
  filename: (req, file, cb) => {
    const sufijo = crypto.randomBytes(6).toString('hex');
    const extension = FORMATOS_FOTO[file.mimetype];
    cb(null, `${Date.now()}-${sufijo}${extension}`);
  },
});

// Filtro de tipo: rechaza cualquier archivo que no sea JPG, PNG o WEBP.
// cb(error) -> Multer no guarda el archivo y entrega el error.
// cb(null, true) -> se acepta.
function filtrarTipo(req, file, cb) {
  if (FORMATOS_FOTO[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Formato no permitido. Use JPG, PNG o WEBP'));
  }
}

// Instancia lista para usar. Un solo archivo, máximo 2 MB.
const upload = multer({
  storage,
  fileFilter: filtrarTipo,
  limits: { fileSize: TAMANO_MAX_FOTO },
});

module.exports = { upload, CARPETA_UPLOADS };
