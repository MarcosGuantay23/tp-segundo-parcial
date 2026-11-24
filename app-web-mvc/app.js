// =====================================================================
// app.js - CONFIGURACIÓN de la aplicación Express (MVC)
// ---------------------------------------------------------------------
// Acá se arma la aplicación: vistas EJS, middlewares globales, sesiones,
// rutas y manejo de errores. El arranque (puerto y conexión a MongoDB)
// está en bin/www.
// =====================================================================

// Carga las variables del archivo .env (PORT, MONGODB_URI, SESSION_SECRET...).
// Debe ejecutarse antes de leer process.env en el resto de los módulos.
require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');

const indexRouter = require('./routes/index');
const usuariosRouter = require('./routes/usuarios');
const productosRouter = require('./routes/productos');

const app = express();

// ---------------------------------------------------------------------
// MOTOR DE VISTAS: EJS. Las plantillas están en /views.
// ---------------------------------------------------------------------
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Detrás de un proxy (Render), confiamos en él para detectar HTTPS.
// Necesario para que la cookie "secure" de la sesión funcione en la nube.
app.set('trust proxy', 1);

// ---------------------------------------------------------------------
// MIDDLEWARES GLOBALES
// ---------------------------------------------------------------------
app.use(logger('dev'));                              // Log de cada solicitud en consola.
app.use(express.json());                             // Lee bodies JSON.
app.use(express.urlencoded({ extended: true }));     // Lee datos de formularios HTML.
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); // CSS, JS, imágenes, uploads.

// ---------------------------------------------------------------------
// SESIONES (express-session)
// ---------------------------------------------------------------------
// La sesión vive en el SERVIDOR (memoria). Al navegador solo llega una
// cookie con un identificador firmado con SESSION_SECRET.
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'cambiar-en-produccion',
    resave: false,              // No guardar si no hubo cambios.
    saveUninitialized: false,   // No crear sesiones vacías (solo al loguear).
    cookie: {
      httpOnly: true,           // JavaScript del navegador no puede leer la cookie.
      secure: process.env.NODE_ENV === 'production', // Solo por HTTPS en producción.
      maxAge: 1000 * 60 * 60 * 2, // Expira a las 2 horas.
    },
  })
);

// Variables disponibles en TODAS las vistas:
//   usuario -> datos del usuario logueado (o null)
//   flash   -> mensaje de un solo uso (se borra al mostrarse)
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

// ---------------------------------------------------------------------
// RUTAS
// ---------------------------------------------------------------------
app.use('/', indexRouter);
app.use('/usuarios', usuariosRouter);
app.use('/productos', productosRouter);

// ---------------------------------------------------------------------
// MANEJO DE ERRORES
// ---------------------------------------------------------------------
// 404: ninguna ruta coincidió.
app.use((req, res, next) => {
  next(createError(404, 'La página solicitada no existe'));
});

// Manejador final (4 parámetros). Muestra la página de error.
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  // El detalle técnico (stack) solo se muestra en desarrollo.
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error', { titulo: 'Error' });
});

module.exports = app;
