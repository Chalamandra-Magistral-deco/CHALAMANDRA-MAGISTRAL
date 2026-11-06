# Plan de integración comercial: Chalamandra + MAGIS + CatedralX

**Estado:** diseño técnico preliminar; no desplegado ni autorizado para producción.  
**Fecha de inspección:** 2026-11-03.

## 1. Objetivo

Convertir `chalamandramagistral.com` en la entrada comercial del ecosistema. Los productos mantienen sus experiencias y reglas comerciales; CatedralX es el motor central de análisis, decisión y gobernanza; Agents ejecuta capacidades autorizadas; la API es la frontera privada entre servicios.

No crear un motor por producto. No exponer la API de Agents al navegador. No duplicar el monedero/créditos de MAGIS en CatedralX.

## 2. Fuentes inspeccionadas

- Web: `CHALAMANDRA-MAGISTRAL`, commit publicado `81a9e6a48658c83ad1db6490e6ac5560d18314b5`; copia aislada en worktree.
- MAGIS: commit del último deployment Vercel inspeccionado `4593071f781b607bf615d29e18bb77d0288e3f55`; no coincide con `origin/main` (`a2a9be5`). El SHA se recuperó directamente y se abrió en un worktree aislado.
- Agents: `6ecf310098c1a22de56ff2a9c2ebbc2d1a284f41`; regresión final del worktree de integración: 244 passed. Candidato API y Worker healthy; `execution_enabled:false`.
- Web: pruebas `tests/site-contract.test.mjs`: 6 passed.

## 3. Arquitectura objetivo

`Cliente → chalamandramagistral.com → producto (MAGIS) → adaptador server-side → API privada Agents → CatedralX/worker → candidato → verificador independiente → resultado aceptado → producto`

Para compras: `Checkout → webhook Stripe firmado → ledger de ventas/créditos → entitlement del producto`. La compra da derecho de uso; no equivale a aceptar el resultado de una ejecución.

## 4. Contrato existente de Agents

### Crear solicitud

`POST /v1/request`

Requisitos observados en el código:
- JWT Bearer firmado por el secreto de servicio de la API, con scope `jobs:write`.
- Header `Idempotency-Key` obligatorio, de 8 a 128 caracteres.
- JSON con `objective` (string no vacío, máximo 8.000 caracteres), `payload` (objeto), `permissions` (objeto; `allowed_tools` debe contener herramientas registradas) y `success_criteria` (lista no vacía de strings).
- Responde `202` con `run_id`, `task_id`, `status`, `trace_id` e indicador de repetición idempotente.

### Consultar ejecución

`GET /internal/v1/orchestration/runs/{run_id}` con scope `orchestration:read` devuelve estado agregado del run (`executing`, `awaiting_acceptance`, `accepted`, `completed` o `completed_with_errors`, según tareas).

`GET /v1/results/{candidate_id}` con scope `results:read` solo entrega el candidato cuando existe aceptación independiente. Sin aceptación responde `202 pending_verification`; aceptación negativa no entrega el resultado.

### Restricción de red y credenciales

La API enlaza a loopback. El README prohíbe acceso HTTP remoto directo y recomienda túnel autenticado o proxy TLS. Los JWT y secretos pertenecen únicamente al backend/adaptador; nunca a HTML, JS cliente ni variables públicas `VITE_*`.

## 5. Adaptador propuesto para MAGIS

Crear una ruta server-side de MAGIS para una capacidad piloto, no una integración genérica abierta:

1. Autenticar al usuario con el mecanismo actual de MAGIS.
2. Validar un `operation_id` estable y calcular el débito de créditos mediante la RPC comercial existente, con idempotencia por operación.
3. Validar el contrato del producto: `objective`, payload permitido, criterios y lista explícita de herramientas autorizadas. No aceptar `allowed_tools` arbitrarios del navegador.
4. Encolar en Agents mediante `POST /v1/request` usando credencial de servicio y `Idempotency-Key` derivada de una identidad estable de operación (sin PII).
5. Persistir la relación `user_id + operation_id + run_id + task_id + trace_id + credit_transaction_id` en almacenamiento server-side durable.
6. Devolver al cliente únicamente `operation_id` y estado; no devolver tokens, secretos ni datos internos de ejecución.
7. Consultar el run desde backend y entregar el resultado solo después de aceptación independiente (`GET /v1/results/{candidate_id}`).
8. Tratar `blocked`, `failed`, `pending_verification` y timeout como estados explícitos; no declarar éxito ni entregar candidatos sin aceptar.
9. Definir y probar compensación/reembolso de créditos para cada resultado terminal fallido, sin duplicar reembolsos ni dejar operaciones en estado ambiguo.

El primer caso de uso debe ser una sola capacidad MAGIS bien definida, con payload acotado y criterios de aceptación verificables. La interfaz actual no se reescribe.

## 6. Estado comercial MAGIS y huecos

El commit desplegado contiene `lib/sales-engine.js`, `api/stripe-webhook.js` y la migración `20261020223000_unified_commercial_sales_engine.sql`.

- El webhook valida firma Stripe, filtra sesiones pagadas y enruta compras de créditos frente a Payment Links.
- Las compras de créditos usan `grant_purchase_credits` y registran recibos comerciales.
- Payment Links generan `sales_receipts` y `sales_fulfillment_outbox` con estados `manual_required` o `review_required`.
- La propia documentación declara pendiente el consumidor de outbox y el fulfillment automático para productos no basados en créditos.
- No se encontró puente de código desde MAGIS hacia `/v1/request` ni una ruta `/v1/jobs`/run de Agents en el commit inspeccionado.

Por tanto, el primer piloto recomendado es una operación autenticada de MAGIS que consuma créditos y utilice el motor; no prometer todavía entrega automática de Kit Magistral, Sesión Descubrimiento o Mapa Tricéntrico.

## 7. Bloqueos antes de habilitar el piloto

1. `CHALAMANDRA_API_ENABLE_MODEL_CALLS` está desactivado; el Worker bloquea tareas generales que requieren modelos. No cambiarlo en producción como parte de esta integración.
2. Diseñar un entorno de pruebas aislado con API/Worker candidato y credenciales de prueba; validar la invocación end-to-end sin proveedores facturables o con presupuestos explícitos.
3. Resolver el transporte privado desde el backend MAGIS/Vercel hasta la API loopback: túnel/proxy autenticado, identidad de servicio, scopes mínimos, límites y auditoría. No asumir que el Worker `chalamandra-leads` es ese gateway: su código fuente no se encontró en los repositorios locales inspeccionados.
4. Conciliar el commit MAGIS desplegado (`4593071`) con `main` (`a2a9be5`) antes de modificar el producto o afirmar que ambos reflejan el mismo código. No hacer merge/reset automáticamente.
5. Ejecutar las pruebas MAGIS con su dependencia Vitest disponible. En el worktree aislado no hay `node_modules`; la prueba unitaria no pudo ejecutarse por `ERR_MODULE_NOT_FOUND: vitest`. No instalar paquetes como parte de esta inspección.
6. Confirmar que las migraciones comerciales aplicadas en el Supabase del entorno de prueba corresponden al commit desplegado. No aplicar migraciones remotas ahora.

## 8. Secuencia de implementación

- P0: cerrar la diferencia de revisión MAGIS y auditar el transporte privado/API gateway.
- P1: seleccionar una capacidad piloto MAGIS y escribir el contrato JSON exacto.
- P2: implementar adaptador server-side y persistencia de correlación/idempotencia en rama aislada.
- P3: pruebas de fallo, reintento, duplicado, timeout, saldo insuficiente, rechazo de aceptación y reembolso.
- P4: validar en staging con cuentas, pagos y modelos de prueba.
- P5: revisión independiente y autorización explícita antes de cualquier activación o despliegue productivo.

## 9. Límites invariantes

- `execution_enabled:false` se conserva.
- No exponer secretos al navegador.
- No otorgar entitlement por retorno del checkout; solo por webhook de pago confirmado y validado.
- No entregar resultados sin aceptación independiente.
- No permitir que el agente apruebe su propio resultado.
- No desplegar, migrar, activar ejecución, tocar DNS ni modificar producción sin autorización explícita.


## 10. Estado de implementación aislada — 2026-11-03

Este addendum actualiza el diseño preliminar anterior y refleja el código realmente preparado en los tres worktrees detached.

### Contrato MAGIS dedicado

La integración ya no utiliza el endpoint general de creación de tareas. Agents incorpora rutas limitadas a producto:

- POST /internal/v1/products/magis/requests — JWT con sub magis-service y scope magis:execute; operación UUID, prompt/context acotados, objetivo fijo, cero herramientas y clave idempotente por operación.
- GET /internal/v1/products/magis/jobs/{task_id} — lectura de estado de una tarea marcada como producto magis.
- GET /internal/v1/products/magis/results/{candidate_id} — entrega solo cuando la aceptación independiente es positiva.

La identidad de servicio usa CHALAMANDRA_MAGIS_JWT_SECRET en Agents y el mismo secreto dedicado, provisionado por separado, como CATEDRALX_MAGIS_JWT_SECRET en el backend MAGIS. No se ha provisionado ninguno.

### Gates independientes

CHALAMANDRA_MAGIS_EXECUTION_ENABLED controla solo tareas de MAGIS en API y Worker. El gate general CHALAMANDRA_API_ENABLE_MODEL_CALLS permanece apagado. Una prueba confirma que habilitar el gate de MAGIS no habilita /v1/tasks general. Ambos gates permanecen desactivados en el entorno real.

### Adaptador MAGIS preparado

En el worktree del commit desplegado de MAGIS se añadieron:
- api/catedralx.js: autenticación, débito idempotente de 3 créditos (el mismo coste existente de thinking), correlación de operación y polling.
- lib/catedralx-client.js: JWT de 60 segundos, scopes mínimos, Idempotency-Key, traceparent y hostname HTTPS permitido solo bajo api.chalamandramagistral.com o api-*.chalamandramagistral.com.
- supabase/migrations/20261103000000_catedralx_operations.sql: ledger server-only de operaciones. No se ha aplicado.
- Un feature flag VITE_MAGIS_CATEDRALX_ENABLED, apagado por defecto, que conmuta únicamente generateThinking del Deployment Analyzer; no sustituye todas las llamadas de IA de MAGIS.
- Pruebas para repetición idempotente, saldo, bloqueo, reconciliación de timeout y aceptación independiente.

La web institucional no se ha rediseñado todavía; sigue siendo el portal/catálogo que presenta y vende el ecosistema. Este primer trabajo conecta una capacidad de un producto, no completa el checkout/fulfillment comercial global.

### Evidencia final

- Agents: 244 pruebas aprobadas; Ruff limpio; mypy limpio en api/server.py, api/task_bus.py y api/worker_loop.py.
- MAGIS: 42 pruebas aprobadas; build Vite exitoso.
- Web institucional: 6 pruebas de contrato aprobadas.
- No se enviaron solicitudes reales al Worker ni se probó una ejecución end-to-end con modelos.
- El commit de MAGIS usado es 4593071; el main local sigue en a2a9be5. No se hizo merge.
- No hubo commits, push, despliegues, cambios DNS, configuración de secretos ni migraciones.

### Bloqueos reales para activar staging

1. La ruta privada del Cloudflare Tunnel hacia la API Agents no está verificada. La resolución DNS por sí sola no prueba que el túnel ni Cloudflare Access estén configurados para esa ruta. No asumir que el Worker chalamandra-leads es el gateway.
2. Falta decidir/probar un endpoint privado protegido, y luego configurar la misma identidad MAGIS dedicada en ambos lados.
3. Aplicar la migración catedralx_operations únicamente en Supabase de staging.
4. Habilitar CHALAMANDRA_MAGIS_EXECUTION_ENABLED solo en API/Worker de staging y usar un modelo local o presupuesto explícito.
5. Ejecutar un flujo real en staging desde MAGIS hasta candidate, aceptación independiente y entrega.

Producción sigue sin cambios y los gates reales siguen apagados.

## 11. Infraestructura de transporte verificada — 2026-11-03

- cloudflared.service está activo y habilitado; el proceso se ejecuta con token-file (/etc/cloudflared/token), sin config.yml local. La configuración de hostnames/orígenes es gestionada remotamente desde Cloudflare.
- api.chalamandramagistral.com resuelve a Cloudflare y responde 200 en /healthz; la ruta del túnel llega a http://127.0.0.1:8766. El puerto del contenedor API está publicado solo en loopback del host.
- /healthz responde actualmente con execution_enabled:false. La API de producción usa CHALAMANDRA_API_ENABLE_MODEL_CALLS=false; el Worker también tiene el gate general apagado.
- api-staging.chalamandramagistral.com no resuelve. No se configuró todavía un Public Hostname separado para staging.
- El comando de inventario Cloudflare desde la VM devolvió unauthorized; el certificado local no concede administración del túnel. No se modificó el servicio ni se intentó reiniciarlo.
- El plan de Cloudflare aún no está conectado a las herramientas administrativas. Se generó un enlace de integración de un solo uso para el usuario; falta completar la conexión desde el navegador.
- La versión instalada de cloudflared informa que 2026.10.6 está por detrás de 2026.10.7; no se actualizó para evitar introducir un reinicio de transporte durante esta integración.

El camino real de staging necesita dos elementos distintos: una ruta de túnel administrada remotamente hacia la API candidata y una protección Cloudflare Access con Service Token. No se debe apuntar un hostname nuevo al contenedor de producción ni reutilizar la API pública actual como si ya fuera un origen de staging.

## 12. Configuración Vercel observada

La inspección de nombres de variables (sin descifrar secretos) confirma que MAGIS tiene variables comerciales y Supabase en Production, pero no un conjunto completo de conexión Supabase para Preview. Antes de hacer una prueba Preview con usuarios y créditos reales se necesita una URL/clave de proyecto Supabase de staging; no se reutilizarán credenciales o saldos de producción para ensayos.

## 13. Reconciliación de créditos

La ruta MAGIS mantiene el coste existente de thinking (3 créditos). Se añadió protección ante respuestas inciertas del RPC de débito y de la admisión de Agents: la operación queda reconciliation_required, la interfaz reintenta con el mismo UUID y los RPC/TaskBus idempotentes evitan doble débito o tarea duplicada. Estas rutas tienen pruebas simuladas; falta validar con una base Supabase de staging.
