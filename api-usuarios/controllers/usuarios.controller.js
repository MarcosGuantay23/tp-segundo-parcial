// =====================================================================
// controllers/usuarios.controller.js - LÓGICA DE NEGOCIO de usuarios
// ---------------------------------------------------------------------
// Los controladores reciben la solicitud (req), consultan o modifican
// la base a través del modelo y devuelven la respuesta (res).
//
// Patrón usado en TODAS las funciones:
//   async (req, res, next) => {
//     try { ...lógica con await... } catch (error) { next(error); }
//   }
// - async/await: el código asíncrono se lee como si fuera sincrónico.
// - try/catch: captura errores de la base o de bcrypt.
// - next(error): envía el error al middleware centralizado (errorHandler).
// =====================================================================

// bcrypt: librería para hashear y comparar contraseñas de forma segura.
const bcrypt = require('bcrypt');

// Modelo Usuario: nos permite operar sobre la colección "usuarios".
const Usuario = require('../models/Usuario');

// Rondas de salt configuradas en el entorno.
const { SALT_ROUNDS, PERFILES } = require('../config/constantes');

// Clase para lanzar errores HTTP con código de estado.
const HttpError = require('../utils/httpError');

// ---------------------------------------------------------------------
// Función auxiliar: normaliza el email para comparar y guardar siempre igual.
// trim() quita espacios; toLowerCase() pasa a minúsculas.
// ---------------------------------------------------------------------
function normalizarEmail(email) {
  return String(email).trim().toLowerCase();
}

// Función auxiliar: escapa caracteres especiales de las expresiones regulares.
// Motivo de seguridad: si el usuario busca "a+(" sin escapar, la RegExp
// falla o puede hacer una búsqueda muy costosa. Escapar lo trata como texto.
function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// =====================================================================
// POST /api/usuarios  -  REGISTRAR un usuario
// =====================================================================
async function registrar(req, res, next) {
  try {
    // Extraemos los datos enviados en el cuerpo de la solicitud.
    const { nombre, email, password, perfil, activo } = req.body;

    // Normalizamos el email antes de buscar y guardar.
    const emailNormalizado = normalizarEmail(email);

    // Control de DUPLICADOS: Usuario.exists() devuelve null o { _id } sin
    // traer el documento completo (es más liviano que findOne).
    const yaExiste = await Usuario.exists({ email: emailNormalizado });
    if (yaExiste) {
      // 409 Conflict: el recurso ya existe.
      throw new HttpError(409, 'Ya existe un usuario registrado con ese email');
    }

    // Encriptamos la contraseña. bcrypt.hash() genera un salt aleatorio,
    // lo combina con la clave y devuelve un hash irreversible.
    // "await" espera el resultado porque el cálculo es costoso (a propósito).
    const passwordHasheada = await bcrypt.hash(password, SALT_ROUNDS);

    // Creamos el documento. Mongoose valida los datos con el esquema
    // antes de insertarlo; si algo falla, lanza ValidationError.
    const nuevoUsuario = await Usuario.create({
      nombre: nombre.trim(),
      email: emailNormalizado,
      password: passwordHasheada,           // Guardamos el HASH, nunca la clave original.
      perfil,
      activo: activo ?? true,               // "??" usa true si activo viene undefined o null.
    });

    // 201 Created: recurso creado correctamente.
    // nuevoUsuario se convierte a JSON sin la contraseña (ver toJSON en el modelo).
    res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      usuario: nuevoUsuario,
    });
  } catch (error) {
    // Cualquier error (validación, base, bcrypt) pasa al manejador central.
    next(error);
  }
}

// =====================================================================
// POST /api/usuarios/login  -  VALIDAR CREDENCIALES
// ---------------------------------------------------------------------
// No se usa JWT ni tokens (alcance del TP). La API responde con los datos
// del usuario y su perfil; la app MVC guarda esa información en la sesión.
// =====================================================================
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Buscamos el usuario por email. select('+password') es necesario porque
    // en el esquema el campo password tiene select:false (no viene por defecto).
    const usuario = await Usuario.findOne({ email: normalizarEmail(email) }).select('+password');

    // Mensaje GENÉRICO a propósito: no revelamos si el email existe o no.
    // Esto dificulta que alguien enumere cuentas válidas.
    if (!usuario) {
      throw new HttpError(401, 'Credenciales inválidas');
    }

    // bcrypt.compare() toma la contraseña en texto plano que envió el cliente,
    // la hashea internamente con el mismo salt del hash guardado y compara.
    // Nunca desencriptamos nada: el hash es de una sola vía.
    const coincide = await bcrypt.compare(password, usuario.password);
    if (!coincide) {
      throw new HttpError(401, 'Credenciales inválidas');
    }

    // Verificamos si el usuario está habilitado. Se valida DESPUÉS de la
    // contraseña para no revelar el estado de la cuenta a quien no la conoce.
    if (!usuario.activo) {
      // 403 Forbidden: las credenciales son correctas, pero el acceso está prohibido.
      throw new HttpError(403, 'El usuario se encuentra deshabilitado');
    }

    // Login exitoso: devolvemos la información necesaria para identificar
    // al usuario y conocer su perfil. toJSON() ya oculta la contraseña.
    res.status(200).json({
      mensaje: 'Login exitoso',
      usuario,
    });
  } catch (error) {
    next(error);
  }
}

// =====================================================================
// GET /api/usuarios  -  LISTAR usuarios (con filtros opcionales)
// ---------------------------------------------------------------------
// Parámetros de consulta opcionales (query string):
//   ?q=texto        busca en nombre o email (sin distinguir mayúsculas)
//   ?perfil=Operador
//   ?activo=true|false
// Ejemplo: GET /api/usuarios?q=ana&activo=true
// =====================================================================
async function listar(req, res, next) {
  try {
    // Filtro vacío: si no llega ningún parámetro, se listan todos.
    const filtro = {};

    // Filtro por perfil, solo si el valor es uno de los permitidos.
    if (req.query.perfil !== undefined) {
      if (!PERFILES.includes(req.query.perfil)) {
        throw new HttpError(400, `El perfil debe ser uno de: ${PERFILES.join(', ')}`);
      }
      filtro.perfil = req.query.perfil;
    }

    // Filtro por estado. Query params siempre llegan como texto, por eso
    // comparamos con 'true' / 'false' y convertimos a booleano.
    if (req.query.activo === 'true' || req.query.activo === 'false') {
      filtro.activo = req.query.activo === 'true';
    }

    // Búsqueda por texto en nombre o email.
    if (req.query.q) {
      const patron = new RegExp(escaparRegex(String(req.query.q).trim()), 'i');
      // $or: el documento coincide si cumple AL MENOS una de las condiciones.
      // 'i' = sin distinguir mayúsculas/minúsculas.
      filtro.$or = [{ nombre: patron }, { email: patron }];
    }

    // find() devuelve un arreglo con todos los documentos que cumplen el filtro.
    // sort({ nombre: 1 }) los ordena alfabéticamente (1 = ascendente).
    const usuarios = await Usuario.find(filtro).sort({ nombre: 1 });

    res.status(200).json({
      total: usuarios.length,
      usuarios,
    });
  } catch (error) {
    next(error);
  }
}

// =====================================================================
// GET /api/usuarios/:id  -  CONSULTAR un usuario
// =====================================================================
async function obtener(req, res, next) {
  try {
    // findById busca por _id. Si no existe, devuelve null.
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      // 404 Not Found: el recurso no existe.
      throw new HttpError(404, 'Usuario no encontrado');
    }

    res.status(200).json({ usuario });
  } catch (error) {
    next(error);
  }
}

// =====================================================================
// PUT /api/usuarios/:id  -  MODIFICAR un usuario (actualización parcial)
// ---------------------------------------------------------------------
// Solo se actualizan los campos que llegan en el body. El resto queda igual.
// Para habilitar/deshabilitar también se puede usar este endpoint con
// { "activo": true } o { "activo": false }.
// =====================================================================
async function actualizar(req, res, next) {
  try {
    const { nombre, email, password, perfil, activo } = req.body;

    // Armamos un objeto SOLO con los campos recibidos.
    // Así no pisamos con "undefined" valores que el cliente no quiso tocar.
    const cambios = {};

    if (nombre !== undefined) {
      cambios.nombre = nombre.trim();
    }

    if (email !== undefined) {
      const emailNormalizado = normalizarEmail(email);

      // Control de duplicados al modificar: el email puede ser nuevo, pero
      // no debe pertenecer a OTRO usuario. Por eso excluimos el propio _id.
      // $ne = "no igual" (not equal).
      const otroUsuario = await Usuario.exists({
        email: emailNormalizado,
        _id: { $ne: req.params.id },
      });
      if (otroUsuario) {
        throw new HttpError(409, 'Ya existe otro usuario registrado con ese email');
      }
      cambios.email = emailNormalizado;
    }

    if (password !== undefined) {
      // Si se cambia la contraseña, también debe guardarse hasheada.
      // Nota: findByIdAndUpdate NO dispara los hooks "pre save" de Mongoose,
      // por eso el hash se calcula explícitamente aquí.
      cambios.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    if (perfil !== undefined) {
      cambios.perfil = perfil;
    }

    if (activo !== undefined) {
      cambios.activo = activo;
    }

    // findByIdAndUpdate:
    //  - $set: modifica solo los campos indicados.
    //  - new: true  -> devuelve el documento YA modificado (no el anterior).
    //  - runValidators: true -> aplica las validaciones del esquema al actualizar.
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.params.id,
      { $set: cambios },
      { new: true, runValidators: true }
    );

    if (!usuarioActualizado) {
      throw new HttpError(404, 'Usuario no encontrado');
    }

    res.status(200).json({
      mensaje: 'Usuario actualizado correctamente',
      usuario: usuarioActualizado,
    });
  } catch (error) {
    next(error);
  }
}

// =====================================================================
// DELETE /api/usuarios/:id  -  DESHABILITAR usuario (baja LÓGICA)
// ---------------------------------------------------------------------
// Decisión de diseño: NO borramos el documento físicamente. Lo marcamos
// como inactivo (activo = false). Ventajas:
//   - Se conserva el historial y la integridad de datos relacionados.
//   - Se puede volver a habilitar con PUT /api/usuarios/:id { "activo": true }.
// =====================================================================
async function eliminar(req, res, next) {
  try {
    // Actualizamos solo el campo "activo". new: true devuelve el documento final.
    const usuarioDeshabilitado = await Usuario.findByIdAndUpdate(
      req.params.id,
      { $set: { activo: false } },
      { new: true }
    );

    if (!usuarioDeshabilitado) {
      throw new HttpError(404, 'Usuario no encontrado');
    }

    res.status(200).json({
      mensaje: 'Usuario deshabilitado correctamente (baja lógica)',
      usuario: usuarioDeshabilitado,
    });
  } catch (error) {
    next(error);
  }
}

// Exportamos todas las funciones para que las use el archivo de rutas.
module.exports = {
  registrar,
  login,
  listar,
  obtener,
  actualizar,
  eliminar,
};
