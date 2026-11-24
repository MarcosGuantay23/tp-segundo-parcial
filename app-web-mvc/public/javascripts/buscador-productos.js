// =====================================================================
// public/javascripts/buscador-productos.js - BÚSQUEDA DINÁMICA (Fetch API)
// ---------------------------------------------------------------------
// Qué hace: mientras el usuario escribe o cambia la categoría, pide los
// productos filtrados al servidor en formato JSON y reconstruye la tabla,
// SIN recargar la página.
//
// Conceptos usados:
//   - fetch()        -> solicitud HTTP asíncrona desde el navegador
//   - async/await    -> código asíncrono legible, con try/catch
//   - JSON           -> formato del intercambio con el servidor
//   - Manipulación del DOM -> crear filas con createElement y textContent
// =====================================================================

// Esperamos a que el HTML esté cargado antes de buscar elementos en la página.
document.addEventListener('DOMContentLoaded', () => {
  const inputBuscador = document.getElementById('buscador');
  const selectCategoria = document.getElementById('filtro-categoria');
  const tbody = document.getElementById('tabla-productos-body');
  const contador = document.getElementById('contador');

  // Si no estamos en la página del listado, no hacemos nada.
  if (!inputBuscador || !selectCategoria || !tbody) return;

  // Evitamos el envío del formulario (que recargaría la página).
  document.getElementById('formBusqueda').addEventListener('submit', (evento) => {
    evento.preventDefault();
    buscar();
  });

  // "Debounce": esperamos 300 ms sin escribir antes de consultar al servidor.
  // Así no mandamos una solicitud por cada tecla.
  let temporizador = null;
  inputBuscador.addEventListener('input', () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(buscar, 300);
  });

  // Cambiar la categoría dispara la búsqueda de inmediato.
  selectCategoria.addEventListener('change', buscar);

  // Función asíncrona que consulta la API del servidor.
  async function buscar() {
    // URLSearchParams arma la query string de forma segura (escapa caracteres).
    const parametros = new URLSearchParams({
      q: inputBuscador.value.trim(),
      categoria: selectCategoria.value,
    });

    try {
      // await espera la respuesta HTTP sin bloquear la interfaz.
      const respuesta = await fetch(`/productos/api/buscar?${parametros}`, {
        headers: { Accept: 'application/json' },
      });

      if (!respuesta.ok) {
        throw new Error(`El servidor respondió con el código ${respuesta.status}`);
      }

      // Convertimos el cuerpo JSON en un arreglo de objetos JavaScript.
      const productos = await respuesta.json();
      renderizarTabla(productos);
    } catch (error) {
      mostrarMensaje(`No se pudo realizar la búsqueda: ${error.message}`);
    }
  }

  // Reconstruye las filas de la tabla con los productos recibidos.
  function renderizarTabla(productos) {
    // Vaciamos el contenido anterior.
    tbody.replaceChildren();

    if (productos.length === 0) {
      tbody.append(crearFilaMensaje('No hay productos para mostrar.'));
    } else {
      productos.forEach((producto) => tbody.append(crearFila(producto)));
    }

    contador.textContent = `${productos.length} resultado(s)`;
  }

  // Crea un <tr> con los datos de un producto.
  // Se usa textContent (no innerHTML) para que el texto no se interprete como HTML:
  // esto evita inyección de código (XSS) si alguien cargó caracteres raros.
  function crearFila(producto) {
    const tr = document.createElement('tr');

    // Celda de la foto.
    const tdFoto = document.createElement('td');
    const img = document.createElement('img');
    img.src = producto.imagenUrl;
    img.alt = `Foto de ${producto.modelo}`;
    img.className = 'foto-miniatura rounded';
    tdFoto.append(img);

    // Celdas de texto.
    const tdCodigo = celda(producto.codigo, 'fw-semibold');
    const tdMarca = celda(producto.marca);
    const tdModelo = celda(producto.modelo);

    // Categoría dentro de un badge.
    const tdCategoria = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'badge bg-light text-dark border';
    badge.textContent = producto.categoria;
    tdCategoria.append(badge);

    // Precio formateado en pesos argentinos.
    const tdPrecio = celda(formatearPrecio(producto.precio), 'text-end');

    // Enlaces de acción.
    const tdAcciones = document.createElement('td');
    tdAcciones.className = 'text-end text-nowrap';
    tdAcciones.append(
      enlace(`/productos/${producto._id}`, 'Ver', 'btn btn-sm btn-outline-secondary'),
      ' ',
      enlace(`/productos/${producto._id}/editar`, 'Editar', 'btn btn-sm btn-outline-primary')
    );

    tr.append(tdFoto, tdCodigo, tdMarca, tdModelo, tdCategoria, tdPrecio, tdAcciones);
    return tr;
  }

  // Crea una celda <td> con texto y clase opcional.
  function celda(texto, clase = '') {
    const td = document.createElement('td');
    if (clase) td.className = clase;
    td.textContent = texto;
    return td;
  }

  // Crea un enlace <a> con clases de Bootstrap.
  function enlace(href, texto, clase) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = texto;
    a.className = clase;
    return a;
  }

  // Fila de una sola celda para mensajes ("sin resultados", "error").
  function crearFilaMensaje(texto) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 7;
    td.className = 'text-center text-muted py-4';
    td.textContent = texto;
    tr.append(td);
    return tr;
  }

  // Muestra un error en la tabla sin romper la página.
  function mostrarMensaje(texto) {
    tbody.replaceChildren(crearFilaMensaje(texto));
  }

  // Formatea un número como precio: 1234.5 -> "$ 1.234,50".
  function formatearPrecio(valor) {
    return '$ ' + Number(valor).toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
});
