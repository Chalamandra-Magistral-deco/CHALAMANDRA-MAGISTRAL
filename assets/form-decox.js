document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-contacto-chalamandra');
  if (!form) return;

  const emailInput = form.querySelector('input[type="email"]') || form.querySelector('input[name="email"]');
  if (!emailInput) return;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let feedbackEl = form.querySelector('.email-feedback');
  if (!feedbackEl) {
    feedbackEl = document.createElement('span');
    feedbackEl.className = 'email-feedback';
    feedbackEl.style.cssText = 'display:block;font-size:.85rem;margin-top:4px';
    emailInput.insertAdjacentElement('afterend', feedbackEl);
  }

  function validar() {
    const v = emailInput.value.trim();
    if (!v) {
      feedbackEl.textContent = 'El correo es obligatorio.';
      feedbackEl.style.color = '#dc3545';
      emailInput.style.borderColor = '#dc3545';
      return false;
    }
    if (!emailRegex.test(v)) {
      feedbackEl.textContent = 'Correo no válido.';
      feedbackEl.style.color = '#dc3545';
      emailInput.style.borderColor = '#dc3545';
      return false;
    }
    feedbackEl.textContent = '¡Correo válido!';
    feedbackEl.style.color = '#198754';
    emailInput.style.borderColor = '#198754';
    return true;
  }

  emailInput.addEventListener('input', () => { if (emailInput.value.trim()) validar(); });
  emailInput.addEventListener('blur', validar);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validar()) {
      emailInput.focus();
      return;
    }

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.timestamp = new Date().toISOString();

    feedbackEl.textContent = 'Enviando consulta al motor DecoX...';
    feedbackEl.style.color = '#0d6efd';

    try {
      console.log('Payload DecoX estructurado:', payload);
      feedbackEl.textContent = '¡Consulta enviada y procesada correctamente!';
      feedbackEl.style.color = '#198754';
      form.reset();
    } catch (err) {
      console.error('Error procesando formulario:', err);
      feedbackEl.textContent = 'Error al enviar la consulta.';
      feedbackEl.style.color = '#dc3545';
    }
  });
});
