/* form-decox.js — Formulario de contacto Chalamandra Magistral DecoX */
(function () {
  'use strict';
  var form = document.getElementById('decox-contact-form');
  if (!form) return;
  var statusEl = document.getElementById('decox-form-status');
  var submitBtn = form.querySelector('button[type="submit"]');
  var originalText = submitBtn ? submitBtn.textContent : 'Enviar';

  function setStatus(kind, msg) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.dataset.state = kind;
  }
  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Enviando…' : originalText;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = new FormData(form);
    if (data.get('_gotcha')) return;
    data.append('_next', 'https://www.chalamandramagistral.com/thanks.html');

    setLoading(true);
    setStatus('sending', 'Enviando mensaje…');

    fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    })
    .then(function (res) {
      if (res.ok) {
        window.location.href = 'https://www.chalamandramagistral.com/thanks.html';
      } else {
        return res.json().catch(function(){return{};}).then(function (json) {
          var msg = (json.errors && json.errors[0] && json.errors[0].message)
            || 'No se pudo enviar. Escríbenos a contacto@chalamandramagistral.com';
          setStatus('error', msg);
          setLoading(false);
        });
      }
    })
    .catch(function () {
      setStatus('error', 'Error de conexión. Intenta de nuevo.');
      setLoading(false);
    });
  });
})();
