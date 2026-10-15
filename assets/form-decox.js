/* form-decox.js — Formulario de contacto Chalamandra Magistral DecoX */
(function () {
  'use strict';
  var form = document.getElementById('decox-contact-form');
  if (!form) return;
  var statusEl = document.getElementById('decox-form-status');
  var submitBtn = form.querySelector('button[type="submit"]');
  var originalText = submitBtn ? submitBtn.textContent : 'Enviar';

  // Reconocer consultas que llegan desde el CTA del Mapa SRAP.
  var query = new URLSearchParams(window.location.search);
  var mapaIntent = query.get('interes') === 'mapa-srap';
  if (mapaIntent) {
    var typeField = form.querySelector('[name="type"]');
    var messageField = form.querySelector('[name="message"]');
    var subjectField = form.querySelector('[name="_subject"]');
    if (typeField) typeField.value = 'mapa_srap';
    if (messageField && !messageField.value) {
      messageField.value = 'Me interesa conocer el Mapa SRAP. Quisiera información sobre su alcance, entregable, precio y forma de contratación.';
    }
    if (subjectField) subjectField.value = '[DecoX] Consulta sobre Mapa SRAP';
  }

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

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var data = new FormData(form);
    if (data.get('_gotcha')) return;

    var query = new URLSearchParams(window.location.search);
    var interest = query.get('interes') || '';
    data.set('lead_source', interest === 'mapa-srap' ? 'mapa_srap_cta' : 'contact_form');
    data.set('utm_source', query.get('utm_source') || '');
    data.set('utm_medium', query.get('utm_medium') || '');
    data.set('utm_campaign', query.get('utm_campaign') || '');

    setLoading(true);
    setStatus('sending', 'Enviando mensaje…');

    fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    })
    .then(function (res) {
      if (res.ok) {
        window.dataLayer = window.dataLayer || [];
        var redirected = false;

        function goToThanks() {
          if (redirected) return;
          redirected = true;
          window.location.href = '/thanks.html';
        }

        window.dataLayer.push({
          event: 'generate_lead',
          lead_source: data.get('lead_source') || 'contact_form',
          lead_type: data.get('type') || 'unknown',
          utm_source: data.get('utm_source') || '',
          utm_medium: data.get('utm_medium') || '',
          utm_campaign: data.get('utm_campaign') || '',
          eventCallback: goToThanks,
          eventTimeout: 2000
        });

        window.setTimeout(goToThanks, 2500);
      } else {
        return res.json().catch(function(){return{};}).then(function (json) {
          var msg = (json.errors && json.errors[0] && json.errors[0].message)
            || 'No se pudo enviar. Escríbenos a decoxmagistral@gmail.com';
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
