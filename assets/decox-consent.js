(function () {
  "use strict";

  var COOKIE = "decox_consent_v1";
  var VALID = ["necessary", "analytics", "all"];

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  // Consentimiento predeterminado: antes de cargar etiquetas.
  window.gtag("consent", "default", {
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
    personalization_storage: "denied",
    wait_for_update: 500
  });

  window.gtag("set", "ads_data_redaction", true);
  // No activar URL passthrough hasta revisar la política de medición.

  function readChoice() {
    var prefix = COOKIE + "=";
    var parts = document.cookie.split(";");

    for (var i = 0; i < parts.length; i++) {
      var item = parts[i].trim();

      if (item.indexOf(prefix) === 0) {
        var value = item.substring(prefix.length);
        return VALID.indexOf(value) !== -1 ? value : null;
      }
    }

    return null;
  }

  function consentValues(choice) {
    var ads = choice === "all";
    var analytics = choice === "all" || choice === "analytics";

    return {
      ad_storage: ads ? "granted" : "denied",
      analytics_storage: analytics ? "granted" : "denied",
      ad_user_data: ads ? "granted" : "denied",
      ad_personalization: ads ? "granted" : "denied",
      functionality_storage: "granted",
      security_storage: "granted",
      personalization_storage: ads ? "granted" : "denied"
    };
  }

  function loadAdSense() {
    var meta = document.querySelector(
      'meta[name="decox-adsense-consent"]'
    );

    if (!meta || !meta.content) return;

    if (document.querySelector("script[data-decox-adsense]")) return;

    var script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.decoxAdsense = "true";
    script.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
      encodeURIComponent(meta.content);

    document.head.appendChild(script);
  }

  function applyChoice(choice, persist) {
    if (VALID.indexOf(choice) === -1) return;

    var previous = readChoice();

    // Actualizar la medición inmediatamente.
    window.gtag("consent", "update", consentValues(choice));
    window.gtag("set", "ads_data_redaction", choice !== "all");

    if (persist) {
      document.cookie =
        COOKIE + "=" + choice +
        "; Max-Age=15552000; Path=/; SameSite=Lax; Secure";
    }

    // Solo cargar AdSense en páginas habilitadas y tras aceptar todo.
    if (choice === "all") {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadAdSense, {
          once: true
        });
      } else {
        loadAdSense();
      }
    }

    var panel = document.getElementById("decox-consent-panel");
    var settings = document.getElementById("decox-consent-settings");

    if (panel) panel.hidden = true;
    if (settings) settings.hidden = false;

    // Si se revoca el permiso publicitario, recargar sin volver
    // a cargar el script de publicidad en la nueva página.
    if (persist && previous === "all" && choice !== "all") {
      window.setTimeout(function () {
        window.location.reload();
      }, 150);
    }
  }

  var saved = readChoice();

  // Recuperar la preferencia antes de cargar Google Tag Manager.
  if (saved) applyChoice(saved, false);

  function buildInterface() {
    if (!document.body ||
        document.getElementById("decox-consent-panel")) return;

    var style = document.createElement("style");
    style.textContent = `
      #decox-consent-panel {
        position: fixed; z-index: 2147483647;
        left: 16px; bottom: 16px; width: min(720px, calc(100% - 32px));
        box-sizing: border-box; padding: 20px;
        background: #080808; color: #f5f5f5;
        border: 1px solid #ffb300; border-radius: 16px;
        box-shadow: 0 12px 40px rgba(0,0,0,.4);
        font: 14px/1.55 system-ui, sans-serif;
      }
      #decox-consent-panel[hidden],
      #decox-consent-settings[hidden] { display: none; }
      #decox-consent-panel h2 {
        font-size: 18px; margin: 0 0 8px;
      }
      #decox-consent-panel p { margin: 0 0 12px; }
      #decox-consent-panel a { color: #ffd36a; }
      #decox-consent-panel .decox-actions {
        display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;
      }
      #decox-consent-panel button,
      #decox-consent-settings {
        border: 1px solid #ffb300; border-radius: 9px;
        padding: 10px 13px; font: inherit; cursor: pointer;
      }
      #decox-consent-panel button {
        color: #fff; background: #171717;
      }
      #decox-consent-panel button[data-choice="all"] {
        background: #ffb300; color: #080808; font-weight: 700;
      }
      #decox-consent-settings {
        position: fixed; right: 12px; bottom: 12px;
        z-index: 2147483646; background: #080808;
        color: #fff; font: 12px system-ui, sans-serif;
      }
      #decox-consent-panel button:focus-visible,
      #decox-consent-settings:focus-visible {
        outline: 3px solid #fff; outline-offset: 3px;
      }
      @media(max-width:480px) {
        #decox-consent-panel .decox-actions { flex-direction: column; }
        #decox-consent-panel button { width: 100%; }
      }
    `;
    document.head.appendChild(style);

    var panel = document.createElement("section");
    panel.id = "decox-consent-panel";
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Preferencias de privacidad");
    panel.hidden = !!readChoice();

    var title = document.createElement("h2");
    title.textContent = "Privacidad en Chalamandra Magistral";

    var copy = document.createElement("p");
    copy.append(
      "Las tecnologías necesarias permiten el funcionamiento del sitio. ",
      "Puedes elegir si también permites analítica o publicidad. "
    );

    var link = document.createElement("a");
    link.href = "/privacidad.html";
    link.textContent = "Consulta el aviso de privacidad";
    copy.append(link, ".");

    var actions = document.createElement("div");
    actions.className = "decox-actions";

    [
      ["Solo necesarias", "necessary"],
      ["Solo analítica", "analytics"],
      ["Aceptar todo", "all"]
    ].forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = item[0];
      button.dataset.choice = item[1];
      button.addEventListener("click", function () {
        applyChoice(item[1], true);
      });
      actions.appendChild(button);
    });

    panel.append(title, copy, actions);

    var settings = document.createElement("button");
    settings.id = "decox-consent-settings";
    settings.type = "button";
    settings.textContent = "Preferencias de privacidad";
    settings.hidden = !readChoice();
    settings.setAttribute("aria-controls", panel.id);
    settings.addEventListener("click", function () {
      panel.hidden = false;
      settings.hidden = true;
    });

    document.body.append(panel, settings);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildInterface, {
      once: true
    });
  } else {
    buildInterface();
  }
})();
