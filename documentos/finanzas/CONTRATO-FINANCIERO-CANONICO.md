# Contrato financiero canónico — Chalamandra Magistral DecoX

**Estado:** propuesta en rama de desarrollo; no aplicada a producción.  
**Propósito:** consolidar la evidencia monetaria del negocio sin duplicar sistemas operativos ni confundir dinero con créditos de producto.

## 1. Decisión arquitectónica

Chalamandra Magistral DecoX es una empresa y un ecosistema; sus productos pueden vivir en repositorios, despliegues y proyectos de datos distintos. Eso no los convierte en empresas diferentes ni justifica replicar cada dato en todas las plataformas.

El motor financiero será una capa de lectura, conciliación y control sobre eventos financieros identificables. No reemplazará los sistemas operativos de cada producto ni creará una nueva base de datos hasta elegir y validar explícitamente su destino.

### Límites por dominio

- **Finanzas empresariales:** cobros, reembolsos, comisiones, liquidaciones, gastos, cuentas por cobrar/pagar, flujo de caja, ingresos reconocidos y rentabilidad.
- **Inversiones:** aportaciones, compras/ventas, posiciones, valuación, rendimientos realizados/no realizados y riesgos. Sus posiciones y saldos no se mezclan con caja operativa.
- **Operación comercial de producto:** órdenes, acceso, planes y créditos. El estado comercial puede originar un evento financiero, pero no sustituye la evidencia del proveedor de pagos o del banco.
- **Analítica:** agrega por referencias canónicas; no crea copias mutables de los registros fuente.

## 2. Inventario fuente y su significado

| Fuente actual | Evidencia consultada | Responsabilidad conservada |
|---|---|---|
| Stripe LIVE, cuenta Chalamandra Magistral DecoX | Dos endpoints habilitados para `checkout.session.completed` y `checkout.session.async_payment_succeeded`; la consulta de cargos y PaymentIntents devolvió cero registros | Fuente de evidencia de checkout/cobro para esa cuenta, sujeto a conciliación con saldo y liquidaciones |
| Interactive DecoX | `api/verify-payment.ts` valida sesiones Discovery; `api/stripe-webhook.ts` reenvía un subconjunto del evento si hay destino configurado | Confirmación/acceso del producto; no es todavía un libro financiero duradero |
| System Decode / MAGIS | Checkout propio de Stripe; webhook verificado; función `grant_purchase_credits`; tablas `purchases`, `credit_accounts`, `credit_ledger` | Registro operativo de compra y créditos de MAGIS |
| Supabase `magis-commercial-production` | `purchases` sin filas; `credit_ledger` con 6 movimientos; `credit_accounts` con 2 cuentas; suma de saldos = 20 créditos | Datos de operación existentes. Los créditos no son MXN/USD |
| Supabase `tricentric-production` | Tablas de perfiles, evaluaciones, logros, prácticas y consumo de IA; RLS habilitado en las tablas consultadas | Datos propios de Tricentric, fuera del libro monetario salvo los cobros que se concilien |
| Firebase Data Connect | Servicio `decoxmagistral`, un esquema `main`, cero conectores | No es una fuente operativa confirmada para el motor |
| Cloud SQL `decoxmagistral-fdc` | PostgreSQL 18 detenido; backups automáticos deshabilitados; sin backups listados; no se pudieron enumerar bases con la instancia detenida | En cuarentena de cambios; preservar antes de arrancar, migrar o eliminar |
| Blueprint SRAP Barrio Edition | Contrato documental de pago y acceso premium; no acredita que el PSP descrito esté activo en producción | Requisito comercial a verificar antes de integrar cobros |

**Precaución de interpretación:** una consulta vacía en una cuenta/proveedor no demuestra que el negocio no haya recibido dinero en otro proveedor, cuenta, banco o periodo. Hay que establecer la cobertura antes de declarar ingresos totales del negocio.

## 3. Reglas obligatorias del libro financiero

1. Guardar importes en unidades menores enteras (por ejemplo centavos), junto con código ISO de moneda. No sumar monedas distintas sin una conversión identificada, fechada y trazable.
2. Distinguir importe cobrado, reembolso, comisión del proveedor, ingreso neto liquidado, saldo pendiente de liquidación e ingreso contable reconocido. No son conceptos intercambiables.
3. Un evento repetido debe poder procesarse otra vez sin duplicar un asiento ni una entrega. Identificadores externos y claves de idempotencia únicos son obligatorios.
4. Mantener las referencias a proveedor, cuenta, producto, checkout/sesión, pago, reembolso, disputa y liquidación. Nunca almacenar datos de tarjetas.
5. No registrar como ingreso una sesión creada, expirada, cancelada o sólo verificada por el navegador. Usar evidencia server-side del proveedor y luego conciliar con las liquidaciones.
6. Un reembolso o contracargo crea un nuevo evento relacionado y una reversión trazable; no se borra el cobro original.
7. Los créditos de MAGIS son unidades de uso del producto. Se registran en `credit_ledger`; no se convierten a dinero salvo que una regla de negocio explícita, contractual y auditada lo establezca.
8. Mantener auditoría de quién/cuándo/origen, con acceso restringido y sin secretos en registros.
9. Aislar por organización/tenant y por dominio: finanzas empresariales e inversiones comparten utilidades, no saldos, permisos ni tablas operativas de forma implícita.
10. Los datos importados llevan estado de conciliación, referencia de origen y marca temporal de extracción. Los reintentos no deben cambiar silenciosamente la evidencia histórica.

## 4. Modelo lógico propuesto (todavía no es DDL)

### Registro de eventos financieros
Cada evento representa un hecho monetario del proveedor o una observación de conciliación, con campos mínimos:

- `event_id`: identificador interno estable.
- `tenant_id`, `domain`: ámbito autorizado y dominio (`business_finance` o `investments`).
- `source_system`, `source_account_id`, `external_event_id`: sistema, cuenta y evento de origen.
- `event_type`: `payment_succeeded`, `refund_succeeded`, `dispute_opened`, `fee_assessed`, `payout_received`, `expense_recorded`, entre otros explícitos.
- `occurred_at`, `observed_at`, `effective_at`: tiempos separados cuando correspondan.
- `amount_minor`, `currency`, `fee_minor`, `net_minor`: importes enteros y código ISO; sin mezclas de moneda.
- `product_id`, `order_id`, `provider_payment_id`, `checkout_session_id`, `payout_id`: referencias opcionales, no secretos.
- `status`, `reconciliation_status`, `source_reference`, `metadata_sanitized`: estado, trazabilidad y metadatos no sensibles.

Restricciones lógicas: unicidad por `source_system + source_account_id + external_event_id`; el identificador de pago/sesión debe enlazar hechos relacionados sin crear otra venta. El esquema físico y las reglas exactas se definirán tras seleccionar el destino de datos.

### Libro contable (fase posterior)
Los eventos confirmados producen asientos en doble partida, con al menos:

- cabecera de asiento con fecha contable, fuente y referencia idempotente;
- líneas con cuenta contable, débito/crédito en moneda declarada y dominio;
- suma de débitos igual a suma de créditos;
- reversos enlazados al asiento original;
- periodos y cierres auditables.

No inferir categorías contables, impuestos ni reconocimiento de ingresos sólo a partir de un webhook. Deben configurarse reglas revisables con el responsable contable.

## 5. Contrato de integración con productos

- El producto conserva su registro operativo (por ejemplo, la compra MAGIS) y expone/referencia identificadores de pago verificables.
- El motor financiero consume eventos del proveedor o lecturas conciliadas; no acepta como verdad única un POST genérico enviado por otro webhook sin autenticación, firma o credencial de servicio y validación de esquema.
- El adaptador de cada proveedor valida firma, moneda, importe, producto/cuenta esperada y estado pagado. Debe conservar una clave idempotente y estado de procesamiento.
- La entrega de acceso/créditos tiene su propia idempotencia operacional; la idempotencia financiera no debe depender del navegador.
- Los dos webhooks LIVE hallados no deben borrarse ni redirigirse hasta mapear qué productos sirven, comprobar sus secretos y revisar entregas. No asumir que son duplicados sólo porque comparten dos tipos de evento.

## 6. Firebase / Cloud SQL: regla de preservación

Data Connect existe pero no tiene conectores registrados. Cloud SQL está detenido y no se encontraron backups listados. No volver a arrancar la instancia sólo para inspeccionar, activar backups, exportar o eliminar sin un paso aprobado que estime costo, compruebe permisos y documente una estrategia de preservación. Primero recuperar de forma no destructiva el inventario de bases y confirmar si hay mecanismo de exportación/backup posible; después decidir conservar, archivar o retirar.

## 7. Fases de implementación y criterios de salida

### Fase 0 — evidencia base (completada parcialmente)
- [x] Inventariar repositorios, proveedor Stripe LIVE y proyectos Supabase accesibles.
- [x] Confirmar existencia de servicio Data Connect sin conectores.
- [x] Confirmar que Cloud SQL está detenido y no hay backups listados.
- [ ] Completar la cobertura de todas las cuentas/proveedores/bancos que puedan recibir dinero.
- [ ] Verificar entregas Stripe y destino de fulfillment sin exponer secretos.

### Fase 1 — contrato y pruebas (esta propuesta)
- [ ] Aprobar semántica de eventos, dinero, conciliación y aislamiento.
- [ ] Añadir pruebas de duplicación/reintento, pago fallido, pago exitoso, reembolso y moneda incorrecta.
- [ ] Diseñar migración aditiva y reversible; no aplicarla a producción en esta fase.

### Fase 2 — prototipo no productivo
- [ ] Elegir una base existente como destino de prueba después de verificar ownership, salud, backups y RLS.
- [ ] Procesar fixtures de prueba y datos sintéticos; no cargar secretos ni PII innecesaria.
- [ ] Comparar el libro con los registros fuente y documentar diferencias.

### Fase 3 — conciliación y tablero
- [ ] Ingresos brutos, reembolsos, comisiones y depósitos netos por moneda/proveedor/periodo.
- [ ] Gastos y margen por producto/canal; caja real separada del ingreso reconocido.
- [ ] Incidencias de conciliación con evidencia y estado de resolución.

### Fase 4 — despliegue controlado
- [ ] Backup restaurable validado, prueba en sandbox y plan de reversión.
- [ ] Activación de fuente/evento único por integración y confirmación de idempotencia.
- [ ] Reconciliación posterior al despliegue antes de declarar el motor como fuente operativa.

## 8. Fuera de alcance de este cambio documental

No crea proyectos o bases de datos; no modifica tablas ni RLS; no cambia precios, Payment Links, webhooks ni variables de entorno; no activa Cloud SQL ni Firebase; no implementa inversiones ni registra asientos reales. Es una propuesta revisable en una rama de desarrollo.
