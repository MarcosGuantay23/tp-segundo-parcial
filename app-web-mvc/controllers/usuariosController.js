// =====================================================================
// controllers/usuariosController.js - ADMINISTRACIÓN DE USUARIOS
// ---------------------------------------------------------------------
// Solo accesible para el perfil Administrador (ver routes/usuarios.js).
// Este controlador NO toca la base de usuarios: cada acción es una
// solicitud HTTP a la API REST (services/apiUsuarios.js).
//
// Mapeo de acciones -> endpoints de la API:
//   Listar      -> GET    /api/usuarios
//   Consultar   -> GET    /api/usuarios/:id
//   Registrar   -> POST   /api/usuarios
//   Modificar   -> PUT    /api/usuarios/:id
//   Deshabilitar-> DELETE /api/usuarios/:id
//   Habilitar   -> PUT    /api/usuarios/:id   { activo: true }
// =====================================================================

const apiUsuarios = require('../services/apiUsuarios');
const { PERFILES } = require('../config/constantes');
const { setFlash } = require('../utils/flash');

// Convierte el checkbox del formulario a booleano.
// Un checkbox marcado envía "on"; desmarcado no envía nada.
function leerActivo(valor) {
  return valor === 'on' || valor === 'true';
}

// GET /usuarios -> listado con filtros (q, perfil, activo).
async function listar(req, res, next) {
  // Filtros tomados de la query string (?q=...&perfil=...).
  const filtros = {
    q: String(req.query.q || '').trim(),
    perfil: req.query.perfil || '',
    activo: req.query.activo || '',
  };

  try {
    const { usuarios, total } = await apiUsuarios.listar(filtros);
    res.render('usuarios/lista', {
      titulo: 'Administración de usuarios',
      usuarios,
      total,
      filtros,
      perfiles: Object.values(PERFILES),
    });
  } catch (error) {
    // Si la API falla, mostramos la lista vacía con el aviso (no rompemos la página).
    setFlash(req, 'danger', error.message);
    res.render('usuarios/lista', {
      titulo: 'Administración de usuarios',
      usuarios: [],
      total: 0,
      filtros,
      perfiles: Object.values(PERFILES),
    });
  }
}

// GET /usuarios/nuevo -> formulario vacío de alta.
function formNuevo(req, res) {
  res.render('usuarios/form', {
    titulo: 'Nuevo usuario',
    accion: '/usuarios',
    esNuevo: true,
    datos: { activo: true },
    errores: [],
    perfiles: Object.values(PERFILES),
  });
}

// POST /usuarios -> registra un usuario llamando a POST /api/usuarios.
async function crear(req, res, next) {
  const datos = {
    nombre: String(req.body.nombre || '').trim(),
    email: String(req.body.email || '').trim(),
    password: String(req.body.password || ''),
    perfil: req.body.perfil,
    activo: leerActivo(req.body.activo),
  };

  try {
    await apiUsuarios.crear(datos);
    setFlash(req, 'success', `Usuario ${datos.email} registrado correctamente`);
    return res.redirect('/usuarios');
  } catch (error) {
    // 400 (validación) o 409 (email duplicado): volvemos al formulario con los errores.
    if (error.status === 400 || error.status === 409) {
      const errores = error.detalles.length ? error.detalles : [error.message];
      return res.status(error.status).render('usuarios/form', {
        titulo: 'Nuevo usuario',
        accion: '/usuarios',
        esNuevo: true,
        datos: { ...datos, password: '' }, // nunca devolvemos la contraseña al formulario
        errores,
        perfiles: Object.values(PERFILES),
      });
    }
    return next(error);
  }
}

// GET /usuarios/:id/editar -> formulario con los datos actuales.
async function formEditar(req, res, next) {
  try {
    const { usuario } = await apiUsuarios.obtener(req.params.id);
    res.render('usuarios/form', {
      titulo: 'Modificar usuario',
      accion: `/usuarios/${usuario._id}/editar`,
      esNuevo: false,
      datos: usuario,
      errores: [],
      perfiles: Object.values(PERFILES),
    });
  } catch (error) {
    if (error.status === 404) {
      setFlash(req, 'warning', 'El usuario no existe');
      return res.redirect('/usuarios');
    }
    return next(error);
  }
}

// POST /usuarios/:id/editar -> actualiza con PUT /api/usuarios/:id.
async function actualizar(req, res, next) {
  const { id } = req.params;

  // Solo enviamos la contraseña si el administrador escribió una nueva.
  const cambios = {
    nombre: String(req.body.nombre || '').trim(),
    email: String(req.body.email || '').trim(),
    perfil: req.body.perfil,
    activo: leerActivo(req.body.activo),
  };
  const nuevaPassword = String(req.body.password || '');
  if (nuevaPassword) cambios.password = nuevaPassword;

  try {
    await apiUsuarios.actualizar(id, cambios);
    setFlash(req, 'success', 'Usuario actualizado correctamente');
    return res.redirect('/usuarios');
  } catch (error) {
    if (error.status === 400 || error.status === 409) {
      const errores = error.detalles.length ? error.detalles : [error.message];
      return res.status(error.status).render('usuarios/form', {
        titulo: 'Modificar usuario',
        accion: `/usuarios/${id}/editar`,
        esNuevo: false,
        datos: { ...cambios, _id: id },
        errores,
        perfiles: Object.values(PERFILES),
      });
    }
    if (error.status === 404) {
      setFlash(req, 'warning', 'El usuario no existe');
      return res.redirect('/usuarios');
    }
    return next(error);
  }
}

// POST /usuarios/:id/eliminar -> deshabilita (DELETE /api/usuarios/:id).
async function deshabilitar(req, res, next) {
  const { id } = req.params;

  // Regla de negocio: un administrador no puede deshabilitarse a sí mismo.
  if (req.session.usuario._id === id) {
    setFlash(req, 'warning', 'No podés deshabilitar tu propio usuario');
    return res.redirect('/usuarios');
  }

  try {
    await apiUsuarios.deshabilitar(id);
    setFlash(req, 'success', 'Usuario deshabilitado (baja lógica)');
  } catch (error) {
    setFlash(req, 'danger', error.message);
  }
  return res.redirect('/usuarios');
}

// POST /usuarios/:id/habilitar -> PUT con { activo: true }.
async function habilitar(req, res, next) {
  try {
    await apiUsuarios.actualizar(req.params.id, { activo: true });
    setFlash(req, 'success', 'Usuario habilitado nuevamente');
  } catch (error) {
    setFlash(req, 'danger', error.message);
  }
  return res.redirect('/usuarios');
}

module.exports = {
  listar,
  formNuevo,
  crear,
  formEditar,
  actualizar,
  deshabilitar,
  habilitar,
};
