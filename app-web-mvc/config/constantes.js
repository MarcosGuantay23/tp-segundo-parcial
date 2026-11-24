// =====================================================================
// config/constantes.js - VALORES FIJOS de la aplicación MVC
// ---------------------------------------------------------------------
// Centralizar perfiles, categorías y límites en un solo lugar evita
// repetir textos "mágicos" en modelos, controladores y vistas.
// =====================================================================

// Perfiles que maneja la API de usuarios. Deben coincidir EXACTAMENTE
// con los valores que devuelve /api/usuarios/login.
const PERFILES = Object.freeze({
  ADMINISTRADOR: 'Administrador',
  OPERADOR: 'Operador',
});

// Categorías válidas para un Producto (campo "categoria" del esquema).
const CATEGORIAS = Object.freeze([
  'Notebook',
  'Celular',
  'Tablet',
  'Monitor',
  'Accesorio',
  'Otro',
]);

// Tipos de imagen aceptados para la fotografía y su extensión de archivo.
const FORMATOS_FOTO = Object.freeze({
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
});

// Tamaño máximo de la fotografía: 2 MB (en bytes).
const TAMANO_MAX_FOTO = 2 * 1024 * 1024;

// Imagen que se muestra cuando un producto no tiene fotografía.
const FOTO_POR_DEFECTO = '/images/sin-foto.svg';

module.exports = {
  PERFILES,
  CATEGORIAS,
  FORMATOS_FOTO,
  TAMANO_MAX_FOTO,
  FOTO_POR_DEFECTO,
};
