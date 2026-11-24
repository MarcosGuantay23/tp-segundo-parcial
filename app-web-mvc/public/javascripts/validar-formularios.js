// =====================================================================
// public/javascripts/validar-formularios.js - VALIDACIÓN en el cliente
// ---------------------------------------------------------------------
// Complementa la validación del servidor (que es la definitiva):
//   1) Bootstrap: marca en verde/rojo los campos según checkValidity().
//   2) Archivos: revisa tipo y tamaño de la foto antes de subirla.
//   3) Confirmaciones: pide confirmar antes de borrar (data-confirm).
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {

  // ---- 1) Validación de formularios con clase needs-validation ----
  document.querySelectorAll('form.needs-validation').forEach((form) => {
    form.addEventListener('submit', (evento) => {
      // Validación extra para la foto: tipo y tamaño (si el formulario tiene archivo).
      const inputFoto = form.querySelector('input[type="file"]');
      if (inputFoto && !validarFoto(form, inputFoto)) {
        evento.preventDefault();
        evento.stopPropagation();
      }

      // checkValidity() evalúa required, minlength, min, type, etc.
      if (!form.checkValidity()) {
        evento.preventDefault();
        evento.stopPropagation();
      }

      // Bootstrap muestra los mensajes de error (.invalid-feedback) cuando existe esta clase.
      form.classList.add('was-validated');
    });
  });

  // ---- 2) Validación de la fotografía antes de enviarla ----
  // Devuelve true si el archivo es aceptable (o no hay archivo).
  function validarFoto(form, input) {
    const archivo = input.files[0];
    const mensajeError = document.getElementById('error-fotografia');

    // Sin archivo: dejamos que "required" (en el alta) decida.
    if (!archivo) {
      input.setCustomValidity('');
      return true;
    }

    // Formatos permitidos, leídos del atributo data-formatos del formulario.
    const formatos = (form.dataset.formatos || '').split(',');
    const tamanoMax = Number(form.dataset.maxBytes || 2097152);

    if (!formatos.includes(archivo.type)) {
      input.setCustomValidity('Formato no permitido');
      if (mensajeError) mensajeError.textContent = 'Use una imagen JPG, PNG o WEBP.';
      return false;
    }

    if (archivo.size > tamanoMax) {
      input.setCustomValidity('Archivo demasiado grande');
      if (mensajeError) mensajeError.textContent = 'La imagen supera los 2 MB.';
      return false;
    }

    input.setCustomValidity('');
    return true;
  }

  // ---- 3) Vista previa de la foto seleccionada ----
  const inputFoto = document.getElementById('fotografia');
  const vistaPrevia = document.getElementById('vista-previa');
  if (inputFoto && vistaPrevia) {
    inputFoto.addEventListener('change', () => {
      const archivo = inputFoto.files[0];
      if (archivo && archivo.type.startsWith('image/')) {
        // URL temporal en memoria del navegador (no se sube nada todavía).
        vistaPrevia.src = URL.createObjectURL(archivo);
      }
    });
  }

  // ---- 4) Confirmación antes de acciones destructivas ----
  // Los formularios con data-confirm piden confirmación; si el usuario cancela, no se envían.
  document.querySelectorAll('form[data-confirm]').forEach((form) => {
    form.addEventListener('submit', (evento) => {
      if (!window.confirm(form.dataset.confirm)) {
        evento.preventDefault();
      }
    });
  });
});
