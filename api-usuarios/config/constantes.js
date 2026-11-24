// =====================================================================
// config/constantes.js - VALORES FIJOS de la aplicación
// ---------------------------------------------------------------------
// Centralizar las constantes en un único lugar evita "números mágicos"
// y "textos mágicos" repartidos por el código. Si se cambia un perfil
// o las rondas de bcrypt, se modifica solo aquí.
// =====================================================================

// Perfiles válidos del sistema. Son los únicos valores que acepta el
// campo "perfil" del modelo Usuario (validación en el esquema y en el
// middleware de validación).
const PERFILES = Object.freeze(['Administrador', 'Operador']);
// Object.freeze() impide que alguien modifique el arreglo en tiempo de
// ejecución (por ejemplo, agregando un perfil no autorizado).

// Rondas de "salt" para bcrypt. El salt es un valor aleatorio que se
// mezcla con la contraseña antes de hashearla, para que dos usuarios
// con la misma clave no tengan el mismo hash.
// Number(...) convierte el texto del .env a número. Si no está definido
// (NaN o 0), usamos 10 como valor por defecto razonable.
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

module.exports = {
  PERFILES,
  SALT_ROUNDS,
};
