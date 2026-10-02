/* form-decox.js — Formulario de contacto Chalamandra Magistral DecoX */
(function () {
  'use strict';
  var form = document.getElementById('decox-contact-form');
  if (!form) return;
  var statusEl = document.getElementById('decox-form-status');
  var submitBtn = form.querySelector('button[type="submit"]');
  var originalText = submitBtn ? submitBtn.textContent : 'Enviar';

  function setStatus(kind, message) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.dataset.state = kind;
  }
  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Enviando…' : originalText;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var data = new FormData(form);
    if (data.get('_gotcha')) return;

    setLoading(true);
    setStatus('sending', 'Enviando mensaje…');

    try {
      var res = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        form.reset();
        setStatus('success', 'Mensaje enviado. Te responderemos pronto.');
        if (window.dataLayer) {
          window.dataLayer.push({ event: 'decox_form_submit', form: 'contact' });
        }
      } else {
        var json = await res.json().catch(function () { return {}; });
        var msg = (json.errors && json.errors[0] && json.errors[0].message)
          || 'No se pudo enviar. Escríbenos a contacto@chalamandramagistral.com';
        setStatus('error', msg);
      }
    } catch (err) {
      setStatus('error', 'Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  });
})();
