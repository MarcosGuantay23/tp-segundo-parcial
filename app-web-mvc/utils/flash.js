// =====================================================================
// utils/flash.js - MENSAJES de un solo uso entre peticiones
// ---------------------------------------------------------------------
// Problema: después de un POST que redirige (PRG: Post/Redirect/Get),
// necesitamos mostrar un mensaje ("Producto guardado") en la página
// siguiente. Guardamos el mensaje en la sesión y el middleware de app.js
// lo pasa a las vistas y lo borra, así se muestra UNA sola vez.
// =====================================================================

// Guarda un mensaje en la sesión.
// tipo: 'success' | 'danger' | 'warning' | 'info' (clases de Bootstrap)
function setFlash(req, tipo, texto) {
  req.session.flash = { tipo, texto };
}

module.exports = { setFlash };
