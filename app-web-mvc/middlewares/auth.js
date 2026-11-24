// =====================================================================
// middlewares/auth.js - CONTROL DE ACCESO (sesión y perfil)
// ---------------------------------------------------------------------
// Dos controles encadenables en las rutas:
//   requiereSesion              -> hay un usuario logueado y HABILITADO
//   permitirPerfiles(...)       -> el perfil del usuario está permitido
//
// Ejemplo de uso:
//   router.use(requiereSesion, permitirPerfiles('Administrador'));
// =====================================================================

const createError = require('http-errors');
const apiUsuarios = require('../services/apiUsuarios');
const { setFlash } = require('../utils/flash');

// Verifica que haya sesión activa Y que el usuario siga habilitado.
// Es async porque consulta a la API: así, si el administrador deshabilita
// a un usuario, su sesión deja de servir en la siguiente navegación.
async function requiereSesion(req, res, next) {
  // 1) Sin sesión -> al login.
  if (!req.session.usuario) {
    setFlash(req, 'warning', 'Debés iniciar sesión para continuar');
    return res.redirect('/login');
  }

  try {
    // 2) Revalidamos contra la API (fuente de verdad de los usuarios).
    const { usuario } = await apiUsuarios.obtener(req.session.usuario._id);

    // 3) Usuario deshabilitado -> cerramos la sesión.
    if (!usuario.activo) {
      return cerrarSesionPorMotivo(req, res, 'deshabilitado');
    }

    // 4) Refrescamos los datos de la sesión (por si cambió el perfil).
    req.session.usuario = {
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      perfil: usuario.perfil,
    };

    return next();
  } catch (error) {
    // 404 = el usuario ya no existe en la API -> cerrar sesión.
    if (error.status === 404) {
      return cerrarSesionPorMotivo(req, res, 'inexistente');
    }
    // Cualquier otro error (API caída, etc.) se muestra en la página de error.
    return next(error);
  }
}

// Destruye la sesión y redirige al login indicando el motivo por la URL.
function cerrarSesionPorMotivo(req, res, motivo) {
  req.session.destroy(() => {
    res.redirect(`/login?motivo=${motivo}`);
  });
}

// Fábrica de middleware: recibe los perfiles permitidos y devuelve el
// middleware. Si el perfil no está en la lista -> error 403 Forbidden.
function permitirPerfiles(...perfilesPermitidos) {
  return function (req, res, next) {
    const perfil = req.session.usuario && req.session.usuario.perfil;

    if (perfilesPermitidos.includes(perfil)) {
      return next();
    }

    // createError crea un error HTTP; el manejador de errores de app.js
    // responderá con la página de error y el código 403.
    return next(createError(403, 'No tenés permisos para acceder a esta sección'));
  };
}

module.exports = { requiereSesion, permitirPerfiles };
