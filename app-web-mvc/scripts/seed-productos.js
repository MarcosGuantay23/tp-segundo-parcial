// =====================================================================
// scripts/seed-productos.js - DATOS INICIALES de productos
// ---------------------------------------------------------------------
// Carga productos de ejemplo en tp_negocio para probar el listado y el
// buscador. Ejecución:  npm run seed
// Es idempotente: si el código ya existe, lo omite.
// Los productos de ejemplo NO tienen foto (se muestra la imagen por defecto);
// las fotos se cargan desde la interfaz para probar Multer.
// =====================================================================

const path = require('path');
// Cargamos el .env de esta carpeta, sin importar desde dónde se ejecute el script.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const conectarBD = require('../config/database');
const Producto = require('../models/Producto');

const productosDemo = [
  { codigo: 'NB-001', marca: 'Lenovo', modelo: 'IdeaPad 3', precio: 589999, categoria: 'Notebook', descripcion: 'Procesador Ryzen 5, 8 GB RAM, SSD 512 GB.' },
  { codigo: 'NB-002', marca: 'HP', modelo: 'Pavilion 15', precio: 649500, categoria: 'Notebook', descripcion: 'Pantalla 15.6" Full HD, Intel Core i5.' },
  { codigo: 'CL-001', marca: 'Samsung', modelo: 'Galaxy A35', precio: 329900, categoria: 'Celular', descripcion: 'Pantalla 6.6", 128 GB, cámara triple.' },
  { codigo: 'CL-002', marca: 'Motorola', modelo: 'Moto G84', precio: 259000, categoria: 'Celular', descripcion: 'Pantalla OLED 6.5", 256 GB.' },
  { codigo: 'TB-001', marca: 'Apple', modelo: 'iPad 10', precio: 699000, categoria: 'Tablet', descripcion: 'Pantalla 10.9", 64 GB, Wi-Fi.' },
  { codigo: 'MN-001', marca: 'LG', modelo: '24MK430', precio: 189900, categoria: 'Monitor', descripcion: 'Monitor 24" Full HD IPS.' },
  { codigo: 'AC-001', marca: 'Logitech', modelo: 'MX Master 3', precio: 99900, categoria: 'Accesorio', descripcion: 'Mouse inalámbrico ergonómico.' },
];

async function cargar() {
  await conectarBD();

  for (const datos of productosDemo) {
    // Si el código ya existe, no lo duplicamos.
    const existe = await Producto.exists({ codigo: datos.codigo });
    if (existe) {
      console.log(`[seed] Ya existe ${datos.codigo}, se omite.`);
      continue;
    }
    await Producto.create(datos);
    console.log(`[seed] Creado: ${datos.codigo} ${datos.marca} ${datos.modelo}`);
  }

  await mongoose.disconnect();
  console.log('[seed] Proceso finalizado.');
}

cargar()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[seed] Error:', error.message);
    process.exit(1);
  });
