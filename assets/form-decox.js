/* form-decox.js — Formulario y atribución comercial Chalamandra Magistral DecoX */
(function () {
  'use strict';

  var form = document.getElementById('decox-contact-form');
  if (!form) return;

  var statusEl = document.getElementById('decox-form-status');
  var submitBtn = form.querySelector('button[type="submit"]');
  var originalText = submitBtn ? submitBtn.textContent : 'Enviar';
  var query = new URLSearchParams(window.location.search);
  var interest = query.get('interes') || '';
  var origin = query.get('origen') || '';

  var offers = {
    'mapa-srap': {
      id: 'mapa-srap',
      type: 'mapa_srap',
      name: 'Mapa SRAP',
      subject: '[DecoX] Solicitud de propuesta — Mapa SRAP',
      message: 'Me interesa el Mapa SRAP. Quisiera una propuesta con alcance, entregables, inversión y calendario.'
    },
    'consultoria': {
      id: 'consultoria',
      type: 'decodificar',
      name: 'Consultoría de decodificación',
      subject: '[DecoX] Solicitud de propuesta — Consultoría',
      message: 'Quisiera una propuesta de consultoría para decodificar un problema y definir una ruta de acción.'
    },
    'taller-srap': {
      id: 'taller-srap',
      type: 'taller_srap',
      name: 'Talleres SRAP y 6 Sombreros',
      subject: '[DecoX] Solicitud de propuesta — Taller',
      message: 'Quisiera una propuesta para un taller SRAP / 6 Sombreros. Me interesa conocer formato, alcance, inversión y calendario.'
    },
    'arquitectura-sistemas': {
      id: 'arquitectura-sistemas',
      type: 'arquitectura_sistemas',
      name: 'Arquitectura de sistemas y marca',
      subject: '[DecoX] Solicitud de propuesta — Arquitectura',
      message: 'Quisiera una propuesta para diseñar la arquitectura de un sistema, negocio o marca.'
    }
  };

  var selectedOffer = offers[interest] || null;

  if (selectedOffer) {
    var typeField = form.querySelector('[name="type"]');
    var messageField = form.querySelector('[name="message"]');
    var subjectField = form.querySelector('[name="_subject"]');
    if (typeField) typeField.value = selectedOffer.type;
    if (messageField && !messageField.value) messageField.value = selectedOffer.message;
    if (subjectField) subjectField.value = selectedOffer.subject;
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

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var data = new FormData(form);
    if (data.get('_gotcha')) return;

    var leadSource = origin === 'ofertas'
      ? 'ofertas_cta'
      : (interest === 'mapa-srap' ? 'mapa_srap_cta' : 'contact_form');

    data.set('lead_source', leadSource);
    data.set('lead_offer', selectedOffer ? selectedOffer.id : '');
    data.set('lead_origin', origin || 'contact');
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
    .then(function (response) {
      if (response.ok) {
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
          lead_offer: data.get('lead_offer') || '',
          lead_origin: data.get('lead_origin') || 'contact',
          utm_source: data.get('utm_source') || '',
          utm_medium: data.get('utm_medium') || '',
          utm_campaign: data.get('utm_campaign') || '',
          eventCallback: goToThanks,
          eventTimeout: 2000
        });

        window.setTimeout(goToThanks, 2500);
      } else {
        return response.json().catch(function () { return {}; }).then(function (json) {
          var message = (json.errors && json.errors[0] && json.errors[0].message)
            || 'No se pudo enviar. Escríbenos a decoxmagistral@gmail.com';
          setStatus('error', message);
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
