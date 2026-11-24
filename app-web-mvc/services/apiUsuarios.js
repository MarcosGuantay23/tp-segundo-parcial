// =====================================================================
// services/apiUsuarios.js - CLIENTE HTTP de la API REST de usuarios
// ---------------------------------------------------------------------
// Esta aplicación NO accede a la base de usuarios. Para todo lo relacionado
// con usuarios hace solicitudes HTTP a la API (Proyecto 1) usando fetch,
// que es el cliente HTTP nativo de Node.js 18+ (equivale a la Fetch API
// del navegador).
//
// Todas las funciones son async: devuelven Promesas y se usan con await.
// Si la API responde con error (4xx/5xx), se lanza un Error con:
//   err.status   -> código HTTP recibido
//   err.message  -> mensaje de la API
//   err.detalles -> lista de detalles de validación (si los hay)
// =====================================================================

// URL base de la API, configurable por .env (en Render apunta a la URL pública).
const BASE_URL = process.env.API_USUARIOS_URL || 'http://localhost:3000/api/usuarios';

// Función interna que hace la solicitud y normaliza la respuesta.
async function peticion(metodo, ruta, cuerpo) {
  let respuesta;

  try {
    respuesta = await fetch(BASE_URL + ruta, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      // Solo enviamos body si hay datos (GET y DELETE no lo llevan).
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch (error) {
    // fetch lanza error cuando NO hay conexión (API apagada, sin red, etc.).
    // Lo traducimos a un 503 "Servicio no disponible".
    const err = new Error('No se pudo conectar con la API de usuarios');
    err.status = 503;
    throw err;
  }

  // Intentamos leer el JSON. Si el cuerpo viene vacío o no es JSON, datos = null.
  let datos = null;
  try {
    datos = await respuesta.json();
  } catch (error) {
    datos = null;
  }

  // respuesta.ok es true para códigos 200-299. Cualquier otro es un error.
  if (!respuesta.ok) {
    const err = new Error((datos && datos.error) || 'Error en la API de usuarios');
    err.status = respuesta.status;
    err.detalles = (datos && datos.detalles) || [];
    throw err;
  }

  return datos;
}

// POST /login -> valida credenciales. Devuelve { mensaje, usuario }.
function login(email, password) {
  return peticion('POST', '/login', { email, password });
}

// GET /api/usuarios?q=&perfil=&activo= -> listado con filtros opcionales.
// "filtros" es un objeto; se convierte a query string con URLSearchParams.
function listar(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== '') params.append(clave, valor);
  });
  const qs = params.toString();
  return peticion('GET', qs ? `?${qs}` : '');
}

// GET /api/usuarios/:id -> un usuario.
function obtener(id) {
  return peticion('GET', `/${id}`);
}

// POST /api/usuarios/ -> alta de usuario.
function crear(datos) {
  return peticion('POST', '/', datos);
}

// PUT /api/usuarios/:id -> modificación parcial.
function actualizar(id, datos) {
  return peticion('PUT', `/${id}`, datos);
}

// DELETE /api/usuarios/:id -> baja lógica (la API marca activo = false).
function deshabilitar(id) {
  return peticion('DELETE', `/${id}`);
}

module.exports = {
  login,
  listar,
  obtener,
  crear,
  actualizar,
  deshabilitar,
};
