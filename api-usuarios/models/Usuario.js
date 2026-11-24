// =====================================================================
// models/Usuario.js - ESQUEMA y MODELO de la colección "usuarios"
// ---------------------------------------------------------------------
// Un ESQUEMA (Schema) describe la forma de los documentos: qué campos
// existen, de qué tipo son y qué reglas deben cumplir.
// Un MODELO (Model) es la clase que usamos para crear, buscar,
// actualizar y borrar documentos de esa colección.
//
// Justificación para la defensa: el esquema valida los datos ANTES de
// que lleguen a MongoDB, evitando inconsistencias (por ejemplo, un
// email vacío o un perfil inventado).
// =====================================================================

// Importamos Mongoose y extraemos la clase Schema para escribirla corto.
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Importamos la lista de perfiles válidos desde constantes.
const { PERFILES } = require('../config/constantes');

// ---------------------------------------------------------------------
// Definición del esquema
// ---------------------------------------------------------------------
const usuarioSchema = new Schema(
  {
    // Nombre y apellido del usuario.
    nombre: {
      type: String,                       // Tipo: texto.
      required: [true, 'El nombre es obligatorio'], // No puede faltar.
      trim: true,                         // Quita espacios al inicio y al final.
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [100, 'El nombre no puede superar los 100 caracteres'],
    },

    // Correo electrónico: identificador de inicio de sesión.
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,                       // Crea un índice ÚNICO en MongoDB:
                                          // la base rechaza dos documentos con el mismo email.
      lowercase: true,                    // Guarda el email en minúsculas
                                          // (así "Ana@Mail.com" y "ana@mail.com" son lo mismo).
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El email no tiene un formato válido'],
      // match: expresión regular que valida la forma general de un email
      // (algo@algo.algo, sin espacios).
    },

    // Contraseña. NUNCA se guarda en texto plano: se guarda el HASH
    // generado por bcrypt (cadena de ~60 caracteres).
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      select: false,                      // Por defecto, las consultas NO devuelven
                                          // este campo. Solo se incluye con .select('+password')
                                          // (lo hacemos únicamente al validar el login).
    },

    // Perfil de acceso: define qué puede hacer el usuario en la app MVC.
    perfil: {
      type: String,
      required: [true, 'El perfil es obligatorio'],
      enum: {
        values: PERFILES,                 // Solo se aceptan "Administrador" u "Operador".
        message: 'El perfil debe ser Administrador u Operador',
      },
    },

    // Indica si el usuario está habilitado. Se usa para la "baja lógica":
    // en lugar de borrar el documento, se pone activo = false.
    activo: {
      type: Boolean,
      default: true,                      // Si no se envía, el usuario nace habilitado.
    },
  },
  {
    // Opciones del esquema:
    timestamps: true,                     // Agrega automáticamente createdAt y updatedAt.
    versionKey: false,                    // Quita el campo interno "__v" de Mongoose.
  }
);

// ---------------------------------------------------------------------
// Transformación al convertir a JSON
// ---------------------------------------------------------------------
// Cada vez que se envía un usuario como respuesta HTTP, Express llama a
// JSON.stringify(), que a su vez invoca toJSON() del documento.
// Esta opción modifica ese resultado para QUITAR la contraseña (por
// seguridad, aunque el campo ya viene oculto por select:false).
usuarioSchema.set('toJSON', {
  transform: (documento, objeto) => {
    delete objeto.password;               // Borramos el hash antes de salir de la API.
    return objeto;
  },
});

// Creamos y exportamos el modelo.
// mongoose.model('Usuario', ...) crea la colección "usuarios" en MongoDB
// (Mongoose la pluraliza en minúsculas automáticamente).
module.exports = mongoose.model('Usuario', usuarioSchema);
