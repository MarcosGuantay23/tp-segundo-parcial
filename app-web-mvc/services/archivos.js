// =====================================================================
// services/archivos.js - OPERACIONES sobre archivos de fotografías
// ---------------------------------------------------------------------
// Un "servicio" agrupa lógica reutilizable que no es ni ruta ni vista.
// Acá: borrar la foto del disco cuando se reemplaza o elimina un producto.
// =====================================================================

const fs = require('fs');
const path = require('path');
const { CARPETA_UPLOADS } = require('../config/multer');

// Borra la foto asociada a un producto. Recibe la ruta pública guardada
// en la base, por ejemplo "/uploads/171-abc.jpg".
// Es "best effort": si el archivo ya no existe, no se considera error.
function borrarFotografia(rutaPublica) {
  // Solo actuamos sobre fotos guardadas en uploads. Así nunca se borra
  // una imagen por defecto ni un archivo ajeno por error.
  if (!rutaPublica || !rutaPublica.startsWith('/uploads/')) return;

  // path.basename evita rutas con "../" (path traversal): solo nos
  // quedamos con el nombre del archivo, dentro de la carpeta uploads.
  const nombre = path.basename(rutaPublica);
  const rutaFisica = path.join(CARPETA_UPLOADS, nombre);

  fs.unlink(rutaFisica, (error) => {
    // ENOENT = el archivo no existe: lo ignoramos. Otros errores se registran.
    if (error && error.code !== 'ENOENT') {
      console.error('[archivos] No se pudo borrar la foto:', error.message);
    }
  });
}

module.exports = { borrarFotografia };
