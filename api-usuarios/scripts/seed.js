// =====================================================================
// scripts/seed.js - DATOS INICIALES de prueba
// ---------------------------------------------------------------------
// Carga dos usuarios de ejemplo (uno por perfil) para poder probar la
// API y la app MVC sin registrar nada a mano.
// Ejecución:  npm run seed
//
// Es idempotente: si el email ya existe, no lo vuelve a crear.
// ATENCIÓN: las contraseñas de este script son de DEMO. Cambiarlas
// antes de cualquier uso real.
// =====================================================================

// Cargamos las variables de entorno (MONGODB_URI, BCRYPT_SALT_ROUNDS).
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const conectarBD = require('../config/database');
const Usuario = require('../models/Usuario');
const { SALT_ROUNDS } = require('../config/constantes');

// Datos de prueba. Uno por cada perfil del sistema.
const usuariosDemo = [
  {
    nombre: 'Administrador General',
    email: 'admin@demo.com',
    password: 'Admin123',
    perfil: 'Administrador',
  },
  {
    nombre: 'Operador Demo',
    email: 'operador@demo.com',
    password: 'Operador123',
    perfil: 'Operador',
  },
];

// Función principal asíncrona: conecta, inserta y desconecta.
async function cargarDatosIniciales() {
  // Conectamos a la base de usuarios.
  await conectarBD();

  // for...of permite usar await dentro del bucle (un usuario a la vez).
  for (const datos of usuariosDemo) {
    // Si ya existe, lo saltamos para no duplicar ni fallar por el índice único.
    const yaExiste = await Usuario.exists({ email: datos.email });
    if (yaExiste) {
      console.log(`[seed] Ya existe ${datos.email}, se omite.`);
      continue; // "continue" pasa a la siguiente iteración del bucle.
    }

    // Hasheamos la contraseña igual que en el controlador de registro.
    const passwordHasheada = await bcrypt.hash(datos.password, SALT_ROUNDS);

    await Usuario.create({ ...datos, password: passwordHasheada });
    console.log(`[seed] Creado: ${datos.email} (${datos.perfil})`);
  }

  // Cerramos la conexión: el script termina y no debe quedar abierto.
  await mongoose.disconnect();
  console.log('[seed] Proceso finalizado.');
}

// Ejecutamos y manejamos errores. process.exit(0) = éxito, (1) = error.
cargarDatosIniciales()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[seed] Error:', error.message);
    process.exit(1);
  });
