// =====================================================================
// controllers/productosController.js - CRUD de PRODUCTOS (entidad principal)
// ---------------------------------------------------------------------
// Esta entidad se administra DIRECTAMENTE con Mongoose sobre tp_negocio.
// Acceso: perfiles Administrador y Operador (ver routes/productos.js).
//
//   Listar     -> GET  /productos             (tabla + filtros)
//   Buscar     -> GET  /productos/api/buscar (JSON para Fetch API)
//   Consultar  -> GET  /productos/:id
//   Alta       -> GET  /productos/nuevo  +  POST /productos
//   Modificar  -> GET  /productos/:id/editar  +  POST /productos/:id/editar
//   Baja       -> POST /productos/:id/eliminar
// =====================================================================

const createError = require('http-errors');
const Producto = require('../models/Producto');
const { CATEGORIAS, FORMATOS_FOTO, FOTO_POR_DEFECTO } = require('../config/constantes');
const { borrarFotografia } = require('../services/archivos');
const { setFlash } = require('../utils/flash');

// ID válido de MongoDB: exactamente 24 caracteres hexadecimales.
const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

// Escapa caracteres especiales de RegExp para buscar texto literal.
function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Construye el filtro de Mongoose a partir de la query string.
// q        -> busca en código, marca, modelo y descripción
// categoria-> coincidencia exacta con una categoría válida
function construirFiltro(query) {
  const filtro = {};

  if (query.categoria && CATEGORIAS.includes(query.categoria)) {
    filtro.categoria = query.categoria;
  }

  const texto = String(query.q || '').trim();
  if (texto) {
    const patron = new RegExp(escaparRegex(texto), 'i'); // 'i' = sin distinguir mayúsculas
    filtro.$or = [
      { codigo: patron },
      { marca: patron },
      { modelo: patron },
      { descripcion: patron },
    ];
  }

  return filtro;
}

// Toma los campos del formulario y los normaliza (tipos y espacios).
function datosDesdeBody(body) {
  return {
    codigo: String(body.codigo || '').trim().toUpperCase(),
    marca: String(body.marca || '').trim(),
    modelo: String(body.modelo || '').trim(),
    // Los formularios envían texto; Number() lo convierte. Si no es número, queda NaN
    // y la validación del esquema lo rechaza.
    precio: Number(body.precio),
    descripcion: String(body.descripcion || '').trim(),
    categoria: body.categoria,
  };
}

// Traduce los errores de validación de Mongoose a una lista de mensajes.
function mensajesDeError(error) {
  if (error.name === 'ValidationError') {
    return Object.values(error.errors).map((e) => e.message);
  }
  // 11000 = código duplicado (índice único de MongoDB).
  if (error.code === 11000) {
    return ['Ya existe un producto con ese código'];
  }
  return null; // No es un error de formulario: se maneja como error interno.
}

// Agrega imagenUrl al objeto: la foto del producto o la imagen por defecto.
// Se calcula acá (y no con un virtual de Mongoose) para que las vistas y el
// JSON del buscador tengan siempre el mismo dato.
function conImagen(producto) {
  return { ...producto, imagenUrl: producto.fotografia || FOTO_POR_DEFECTO };
}

// Borra el archivo recién subido si el guardado falló (evita archivos huérfanos).
function descartarArchivoNuevo(req) {
  if (req.file) {
    borrarFotografia('/uploads/' + req.file.filename);
  }
}

// ---------------------------------------------------------------------
// LISTAR (vista con tabla)
// ---------------------------------------------------------------------
async function lista(req, res, next) {
  try {
    const filtros = {
      q: String(req.query.q || '').trim(),
      categoria: req.query.categoria || '',
    };
    // sort({ createdAt: -1 }) muestra primero los más recientes.
    const productos = await Producto.find(construirFiltro(req.query))
      .sort({ createdAt: -1 })
      .lean();

    res.render('productos/lista', {
      titulo: 'Productos',
      productos: productos.map(conImagen),
      filtros,
      categorias: CATEGORIAS,
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------
// BUSCAR (respuesta JSON para el script de Fetch API)
// ---------------------------------------------------------------------
// Este endpoint NO devuelve HTML: solo datos. El navegador lo llama con
// fetch() desde public/javascripts/buscador-productos.js y reconstruye la tabla.
async function buscarJson(req, res, next) {
  try {
    const productos = await Producto.find(construirFiltro(req.query))
      .sort({ createdAt: -1 })
      .limit(100)   // Límite de seguridad para no devolver miles de registros.
      .lean();

    // Devolvemos solo los campos que necesita el frontend.
    res.json(
      productos.map(conImagen).map((p) => ({
        _id: p._id,
        codigo: p.codigo,
        marca: p.marca,
        modelo: p.modelo,
        precio: p.precio,
        categoria: p.categoria,
        imagenUrl: p.imagenUrl,
      }))
    );
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------
// CONSULTAR (detalle)
// ---------------------------------------------------------------------
async function detalle(req, res, next) {
  const { id } = req.params;
  if (!OBJECT_ID_REGEX.test(id)) return next(createError(404, 'Producto no encontrado'));

  try {
    const producto = await Producto.findById(id).lean();
    if (!producto) return next(createError(404, 'Producto no encontrado'));

    res.render('productos/detalle', { titulo: producto.codigo, producto: conImagen(producto) });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------
// ALTA
// ---------------------------------------------------------------------
function formNuevo(req, res) {
  res.render('productos/form', {
    titulo: 'Nuevo producto',
    accion: '/productos',
    esNuevo: true,
    producto: { precio: '', categoria: '' },
    errores: [],
    categorias: CATEGORIAS,
    formatos: Object.keys(FORMATOS_FOTO).join(','),
  });
}

async function crear(req, res, next) {
  const datos = datosDesdeBody(req.body);

  // Errores de la subida (tipo o tamaño) y foto obligatoria en el alta.
  const errores = [];
  if (req.uploadError) errores.push(req.uploadError);
  if (!req.file && !req.uploadError) errores.push('La fotografía es obligatoria');

  if (errores.length) {
    descartarArchivoNuevo(req);
    return res.status(400).render('productos/form', {
      titulo: 'Nuevo producto',
      accion: '/productos',
      esNuevo: true,
      producto: { ...datos, precio: req.body.precio },
      errores,
      categorias: CATEGORIAS,
      formatos: Object.keys(FORMATOS_FOTO).join(','),
    });
  }

  try {
    // Guardamos la RUTA pública de la foto, no el archivo.
    await Producto.create({
      ...datos,
      fotografia: '/uploads/' + req.file.filename,
    });

    setFlash(req, 'success', `Producto ${datos.codigo} creado correctamente`);
    return res.redirect('/productos');
  } catch (error) {
    const mensajes = mensajesDeError(error);
    if (mensajes) {
      descartarArchivoNuevo(req);
      return res.status(400).render('productos/form', {
        titulo: 'Nuevo producto',
        accion: '/productos',
        esNuevo: true,
        producto: { ...datos, precio: req.body.precio },
        errores: mensajes,
        categorias: CATEGORIAS,
        formatos: Object.keys(FORMATOS_FOTO).join(','),
      });
    }
    descartarArchivoNuevo(req);
    return next(error);
  }
}

// ---------------------------------------------------------------------
// MODIFICACIÓN
// ---------------------------------------------------------------------
async function formEditar(req, res, next) {
  const { id } = req.params;
  if (!OBJECT_ID_REGEX.test(id)) return next(createError(404, 'Producto no encontrado'));

  try {
    const producto = await Producto.findById(id).lean();
    if (!producto) return next(createError(404, 'Producto no encontrado'));

    res.render('productos/form', {
      titulo: 'Modificar producto',
      accion: `/productos/${id}/editar`,
      esNuevo: false,
      producto,
      errores: [],
      categorias: CATEGORIAS,
      formatos: Object.keys(FORMATOS_FOTO).join(','),
    });
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  const { id } = req.params;
  if (!OBJECT_ID_REGEX.test(id)) return next(createError(404, 'Producto no encontrado'));

  const datos = datosDesdeBody(req.body);

  if (req.uploadError) {
    descartarArchivoNuevo(req);
    try {
      // Necesitamos la foto actual para mostrarla de nuevo en el formulario.
      const actual = await Producto.findById(id).lean();
      return res.status(400).render('productos/form', {
        titulo: 'Modificar producto',
        accion: `/productos/${id}/editar`,
        esNuevo: false,
        producto: { ...datos, _id: id, fotografia: actual && actual.fotografia },
        errores: [req.uploadError],
        categorias: CATEGORIAS,
        formatos: Object.keys(FORMATOS_FOTO).join(','),
      });
    } catch (error) {
      return next(error);
    }
  }

  try {
    const producto = await Producto.findById(id);
    if (!producto) {
      descartarArchivoNuevo(req);
      return next(createError(404, 'Producto no encontrado'));
    }

    // Guardamos la foto anterior para borrarla SOLO si se reemplazó con éxito.
    const fotoAnterior = producto.fotografia;

    producto.set(datos);
    if (req.file) {
      producto.fotografia = '/uploads/' + req.file.filename;
    }

    await producto.save(); // save() ejecuta las validaciones del esquema.

    if (req.file && fotoAnterior) {
      borrarFotografia(fotoAnterior);
    }

    setFlash(req, 'success', `Producto ${producto.codigo} actualizado`);
    return res.redirect('/productos/' + id);
  } catch (error) {
    const mensajes = mensajesDeError(error);
    if (mensajes) {
      descartarArchivoNuevo(req);
      return res.status(400).render('productos/form', {
        titulo: 'Modificar producto',
        accion: `/productos/${id}/editar`,
        esNuevo: false,
        producto: { ...datos, _id: id },
        errores: mensajes,
        categorias: CATEGORIAS,
        formatos: Object.keys(FORMATOS_FOTO).join(','),
      });
    }
    descartarArchivoNuevo(req);
    return next(error);
  }
}

// ---------------------------------------------------------------------
// BAJA (eliminación física del producto y de su foto)
// ---------------------------------------------------------------------
async function eliminar(req, res, next) {
  const { id } = req.params;
  if (!OBJECT_ID_REGEX.test(id)) return next(createError(404, 'Producto no encontrado'));

  try {
    // findByIdAndDelete devuelve el documento eliminado (o null si no existía).
    const eliminado = await Producto.findByIdAndDelete(id);
    if (!eliminado) return next(createError(404, 'Producto no encontrado'));

    // Al eliminar el registro, también se borra su foto para no dejar archivos sueltos.
    borrarFotografia(eliminado.fotografia);

    setFlash(req, 'success', `Producto ${eliminado.codigo} eliminado`);
    return res.redirect('/productos');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  lista,
  buscarJson,
  detalle,
  formNuevo,
  crear,
  formEditar,
  actualizar,
  eliminar,
};
