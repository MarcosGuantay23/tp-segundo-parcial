// =====================================================================
// models/Producto.js - ESQUEMA de la entidad principal "Producto"
// ---------------------------------------------------------------------
// Esta entidad la administra DIRECTAMENTE esta aplicación con Mongoose
// (no pasa por la API de usuarios). Colección resultante: "productos".
// =====================================================================

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { CATEGORIAS } = require('../config/constantes');

const productoSchema = new Schema(
  {
    // Código interno del producto. Es único: no pueden existir dos
    // productos con el mismo código.
    codigo: {
      type: String,
      required: [true, 'El código es obligatorio'],
      unique: true,           // Índice único en MongoDB.
      uppercase: true,        // "ab-12" se guarda como "AB-12".
      trim: true,
      minlength: [3, 'El código debe tener al menos 3 caracteres'],
      maxlength: [20, 'El código no puede superar los 20 caracteres'],
    },

    marca: {
      type: String,
      required: [true, 'La marca es obligatoria'],
      trim: true,
      maxlength: [50, 'La marca no puede superar los 50 caracteres'],
    },

    modelo: {
      type: String,
      required: [true, 'El modelo es obligatorio'],
      trim: true,
      maxlength: [80, 'El modelo no puede superar los 80 caracteres'],
    },

    // Precio en pesos. min: 0 impide valores negativos.
    precio: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },

    descripcion: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'La descripción no puede superar los 500 caracteres'],
    },

    // Categoría: solo se aceptan los valores de CATEGORIAS.
    categoria: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      enum: {
        values: CATEGORIAS,
        message: 'La categoría no es válida',
      },
    },

    // Ruta pública de la fotografía (por ejemplo "/uploads/123.jpg").
    // Guardamos solo la RUTA, nunca el archivo dentro de MongoDB.
    // null significa que el producto no tiene foto.
    fotografia: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,       // createdAt y updatedAt automáticos.
    versionKey: false,      // Sin campo __v.
  }
);

module.exports = mongoose.model('Producto', productoSchema);
