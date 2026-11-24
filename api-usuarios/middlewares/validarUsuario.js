// =====================================================================
// middlewares/validarUsuario.js - VALIDACIÓN de datos de entrada
// ---------------------------------------------------------------------
// Este middleware revisa el req.body ANTES de que llegue al controlador.
// Ventaja: devuelve un mensaje claro con TODOS los errores encontrados
// (400 Bad Request), en lugar de un error genérico de Mongoose.
//
// Hay dos capas de validación (buena práctica, se puede defender así):
//   1) Esta capa (middleware): respuestas claras para el cliente.
//   2) El esquema de Mongoose: garantía final antes de guardar.
// =====================================================================

// Importamos los perfiles válidos.
const { PERFILES } = require('../config/constantes');

// Expresión regular para validar la forma de un email.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------
// Función auxiliar: revisa los campos y devuelve la lista de errores.
// Recibe "esActualizacion": en un PUT los campos son opcionales (solo se
// valida lo que se envía); en un POST todos los obligatorios deben estar.
// ---------------------------------------------------------------------
function validarCampos(body, esActualizacion) {
  const errores = [];

  // Desestructuramos los campos que nos interesan del body.
  const { nombre, email, password, perfil, activo } = body;

  // Helper: indica si el campo debe validarse en este caso.
  // En alta: siempre. En actualización: solo si vino en el body.
  const debeValidar = (valor) => !esActualizacion || valor !== undefined;

  // --- nombre ---
  if (debeValidar(nombre)) {
    if (typeof nombre !== 'string' || nombre.trim().length < 2 || nombre.trim().length > 100) {
      errores.push('nombre: debe ser un texto de 2 a 100 caracteres');
    }
  }

  // --- email ---
  if (debeValidar(email)) {
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      errores.push('email: formato de correo electrónico inválido');
    }
  }

  // --- password ---
  // Se valida el texto plano ANTES de hashearlo.
  if (debeValidar(password)) {
    if (typeof password !== 'string' || password.length < 6) {
      errores.push('password: debe ser un texto de al menos 6 caracteres');
    }
  }

  // --- perfil ---
  if (debeValidar(perfil)) {
    // includes() verifica que el valor esté dentro de la lista permitida.
    if (!PERFILES.includes(perfil)) {
      errores.push(`perfil: debe ser uno de: ${PERFILES.join(', ')}`);
    }
  }

  // --- activo (opcional, siempre booleano si viene) ---
  if (activo !== undefined && typeof activo !== 'boolean') {
    errores.push('activo: debe ser true o false');
  }

  return errores;
}

// ---------------------------------------------------------------------
// MIDDLEWARE para POST /api/usuarios (alta)
// ---------------------------------------------------------------------
function validarCrear(req, res, next) {
  // req.body puede ser undefined si no se envió cuerpo; usamos {} por seguridad.
  const errores = validarCampos(req.body || {}, false);

  // Si hay errores, cortamos la cadena y respondemos 400.
  // "return" evita que se ejecute next() más abajo.
  if (errores.length > 0) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: errores });
  }

  // Todo correcto: pasamos al siguiente middleware / controlador.
  next();
}

// ---------------------------------------------------------------------
// MIDDLEWARE para PUT /api/usuarios/:id (modificación)
// ---------------------------------------------------------------------
function validarActualizar(req, res, next) {
  const body = req.body || {};

  // Lista de campos que el cliente puede modificar.
  const camposPermitidos = ['nombre', 'email', 'password', 'perfil', 'activo'];

  // Verificamos si vino al menos uno de ellos. Un PUT vacío no tiene sentido.
  const hayAlgunCampo = camposPermitidos.some((campo) => body[campo] !== undefined);
  if (!hayAlgunCampo) {
    return res.status(400).json({
      error: 'No se enviaron campos para actualizar',
      detalles: [`Campos permitidos: ${camposPermitidos.join(', ')}`],
    });
  }

  const errores = validarCampos(body, true);
  if (errores.length > 0) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: errores });
  }

  next();
}

// ---------------------------------------------------------------------
// MIDDLEWARE para POST /api/usuarios/login
// ---------------------------------------------------------------------
// Solo verificamos que lleguen los dos datos como texto no vacío.
// La comprobación real de la contraseña la hace el controlador.
function validarLogin(req, res, next) {
  const { email, password } = req.body || {};
  const errores = [];

  if (typeof email !== 'string' || email.trim() === '') {
    errores.push('email: es obligatorio');
  }
  if (typeof password !== 'string' || password === '') {
    errores.push('password: es obligatoria');
  }

  if (errores.length > 0) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: errores });
  }

  next();
}

module.exports = {
  validarCrear,
  validarActualizar,
  validarLogin,
};
