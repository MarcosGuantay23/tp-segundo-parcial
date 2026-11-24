// =====================================================================
// controllers/authController.js - LOGIN y LOGOUT
// ---------------------------------------------------------------------
// Flujo de inicio de sesión:
//   1) El formulario envía email y password por POST /login.
//   2) Este controlador llama a la API REST (POST /api/usuarios/login).
//   3) Si la API valida las credenciales, guardamos los datos del usuario
//      en req.session.usuario (express-session).
//   4) Las rutas protegidas leen esa sesión para permitir o denegar acceso.
// =====================================================================

const apiUsuarios = require('../services/apiUsuarios');
const { setFlash } = require('../utils/flash');

// GET /login -> muestra el formulario.
function mostrarLogin(req, res) {
  // Si ya tiene sesión, no tiene sentido mostrar el login.
  if (req.session.usuario) {
    return res.redirect('/');
  }

  // "motivo" llega desde el middleware cuando la sesión se cerró por
  // deshabilitación o por usuario inexistente.
  const mensajesMotivo = {
    deshabilitado: 'Tu usuario está deshabilitado. Consultá con un administrador.',
    inexistente: 'Tu sesión ya no es válida. Volvé a iniciar sesión.',
  };

  res.render('login', {
    titulo: 'Iniciar sesión',
    error: mensajesMotivo[req.query.motivo] || null,
    email: '',
  });
}

// POST /login -> valida credenciales contra la API.
async function procesarLogin(req, res, next) {
  // Campos del formulario. trim() quita espacios accidentales del email.
  const email = String(req.body.email || '').trim();
  const password = String(req.body.password || '');

  // Validación básica en el servidor (además de la del navegador).
  if (!email || !password) {
    return res.status(400).render('login', {
      titulo: 'Iniciar sesión',
      error: 'Completá email y contraseña',
      email,
    });
  }

  try {
    // Solicitud HTTP a la API REST.
    const { usuario } = await apiUsuarios.login(email, password);

    // Regenerate: crea una sesión nueva al iniciar sesión. Evita el
    // "session fixation" (que alguien fije una sesión conocida antes del login).
    req.session.regenerate((errorSesion) => {
      if (errorSesion) return next(errorSesion);

      // Guardamos solo los datos necesarios (nunca la contraseña).
      req.session.usuario = {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        perfil: usuario.perfil,
      };

      setFlash(req, 'success', `Bienvenido, ${usuario.nombre}`);
      res.redirect('/');
    });
  } catch (error) {
    // 401 credenciales inválidas, 403 deshabilitado: mostramos el mensaje
    // de la API. Para otros errores (API caída = 503) mostramos el mensaje tal cual.
    const estado = error.status === 401 || error.status === 403 ? error.status : 503;
    return res.status(estado).render('login', {
      titulo: 'Iniciar sesión',
      error: error.message,
      email,
    });
  }
}

// POST /logout -> destruye la sesión en el servidor.
function cerrarSesion(req, res, next) {
  req.session.destroy((error) => {
    if (error) return next(error);
    // La sesión ya no existe; el mensaje se muestra en el login.
    res.redirect('/login');
  });
}

module.exports = { mostrarLogin, procesarLogin, cerrarSesion };
