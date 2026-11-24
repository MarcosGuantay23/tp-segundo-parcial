// =====================================================================
// utils/httpError.js - ERROR HTTP personalizado
// ---------------------------------------------------------------------
// Problema que resuelve: los errores de JavaScript normales no saben
// qué código HTTP devolver (404, 409, 401...). Esta clase agrega esa
// información al error.
//
// Uso típico en un controlador:
//   throw new HttpError(404, 'Usuario no encontrado');
// El middleware de errores lee "status" y responde con ese código.
// =====================================================================

// "extends Error" hace que HttpError sea un error real (tiene message,
// stack trace, y puede capturarse con try/catch).
class HttpError extends Error {
  constructor(status, mensaje) {
    // super(mensaje) llama al constructor de Error y asigna error.message.
    super(mensaje);

    // Código de estado HTTP (400, 401, 403, 404, 409, etc.).
    this.status = status;

    // Nombre de la clase, útil al depurar.
    this.name = 'HttpError';
  }
}

module.exports = HttpError;
