# Entrega 1 — Consolidación comercial

**Estado:** rama de revisión; no fusionada ni desplegada a producción.
**Rama:** `feat/entrega-1-consolidacion-comercial-20261019`
**Objetivo:** hacer que la portada, los accesos corporativos y las páginas de metodología conduzcan con claridad hacia los servicios de Chalamandra Magistral DecoX.

## Mensaje corporativo de referencia

**Chalamandra Magistral DecoX** es el portal institucional y punto de entrada comercial del ecosistema. Su promesa pública se mantiene como:

> Metodologías, consultoría y herramientas para transformar problemas complejos en decisiones y sistemas de acción.

- **FDM© — Framework de Decodificación Magistral:** Escanear → Deconstruir → Decodificar → Localizar el nodo crítico → Reconfigurar → Integrar y validar.
- **SRAP© — Sincronización Ritmo-Acción Presente:** Observar → Decidir → Actuar → Ajustar. Es un ciclo adaptativo que alinea la decisión y la acción a medida que cambia el contexto.
- **Entrada comercial prioritaria:** Mapa SRAP.
- **Servicios complementarios:** consultoría de decodificación, talleres y arquitectura de sistemas y marca.

El Mapa SRAP queda como punto de entrada recomendado; la portada no presenta los seis accesos del ecosistema como si fueran todos servicios equivalentes. Las descripciones específicas de los productos se mantienen sin cambios hasta validar el inventario funcional de cada uno.

## Cambios de esta entrega

1. La navegación de escritorio incorpora Servicios y Metodologías y se reduce a destinos prioritarios.
2. El menú móvil usa el mismo orden comercial y conserva el acceso a servicios, metodología, ecosistema, arquitectura y contacto.
3. La portada usa una única expansión de SRAP; se elimina la definición alternativa que coexistía en la misma página.
4. El bloque de recursos cambia el encabezado «ritual interactivo» por «decisión aplicable» y conserva el relato como recurso, con lenguaje orientado a decisión.
5. La página de Metodologías incorpora navegación hacia Inicio, Servicios, Arquitectura y solicitud del Mapa SRAP.
6. La página de Arquitectura incorpora un acceso visible a Servicios.
7. Three.js se carga con `defer` para evitar bloquear el análisis inicial del HTML.
8. README corregido: Tailwind se compila localmente y Three.js se sirve desde `assets/three.min.js`; no son dependencias servidas por CDN.
9. Sitemap actualizado para las tres páginas modificadas.

## Límites de esta entrega

- No se modificaron credenciales, DNS, permisos, bases de datos, migraciones ni backend.
- No se aplicaron cambios al contenido de productos cuya función concreta aún requiere confirmación en el inventario maestro.
- No se cambió la política CSP en modo aplicación: antes de endurecerla hay que verificar los orígenes realmente necesarios para Analytics, consentimiento, fuentes, formularios y recursos.
- La revisión de código realizada desde GitHub es estática. **El build local, la verificación visual, la comprobación de enlaces en producción y las métricas Core Web Vitals aún están pendientes.**

## Criterios de aceptación antes de fusionar

- [ ] `pnpm run vercel-build` termina sin errores.
- [ ] `git diff --check` no reporta errores de espacios.
- [ ] La navegación funciona tanto en móvil como en escritorio, incluidos los anchos de tableta.
- [ ] Servicios, Metodologías, Arquitectura y Contacto enlazan a las páginas canónicas bajo `www.chalamandramagistral.com`.
- [ ] El formulario y el panel de consentimiento siguen funcionando.
- [ ] El build genera las páginas, recursos, `robots.txt`, `sitemap.xml`, `ads.txt` y `app-ads.txt` requeridos por el script de preparación.
- [ ] Se revisa el preview antes de autorizar la fusión o cualquier despliegue de producción.

## Siguiente fase sugerida

Una vez aceptada esta entrega: verificar el inventario y los enlaces de cada producto; comprobar formularios, eventos de conversión y consentimiento; medir rendimiento real; después ajustar la CSP con pruebas, no de forma especulativa.
