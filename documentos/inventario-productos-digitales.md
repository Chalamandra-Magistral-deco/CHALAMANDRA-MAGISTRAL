# Inventario de páginas y productos digitales

Este documento convierte las páginas administradas en Firebase en productos evaluables. **No pegar URLs de Firebase Console, claves, IDs privados ni credenciales.** Registrar únicamente URLs públicas y datos comerciales no sensibles.

## 1. Inventario maestro

Duplicar una fila por producto real.

| ID | Nombre comercial | URL pública | Estado | Problema que resuelve | Comprador | Función principal | Modelo de entrega | Precio | Coste variable | Soporte | Checkout/CTA | Ventas cobradas |
|---|---|---|---|---|---|---|---|---:|---:|---|---|---:|
| P-001 | Por completar | Por completar | borrador / demo / listo | Por completar | Por completar | Por completar | acceso / copia / licencia / personalización |  |  | Por completar | Por completar | 0 |

Estados permitidos:

- `borrador`: no ofrecer;
- `demo`: puede mostrarse, no cobrarse todavía;
- `listo`: supera la puerta de preparación;
- `vendiendo`: tiene CTA, entrega y medición activas;
- `pausado`: detenido por margen, soporte, seguridad o demanda.

## 2. Ficha de producto

Completar una ficha por cada fila.

### Identidad

- Nombre:
- URL pública:
- Ecosistema: Axiomas Operativos / QuantumMind / Labs / Metodologías / otro
- Propietaria de código, textos, imágenes y datos:
- Dependencias o licencias de terceros:

### Compra

- Problema literal del comprador:
- Resultado prometido:
- Qué recibe exactamente:
- Qué no incluye:
- Modalidad: acceso / copia desplegada / archivos / licencia / personalización
- Duración del acceso o licencia:
- Precio y moneda:
- Política de devolución:
- Canal de pago:
- Cómo se confirma el pago:

### Entrega y economía

- Paso a paso de entrega:
- Tiempo humano por venta:
- Coste variable por venta:
- Coste mensual atribuible:
- Soporte incluido:
- Límite de soporte:
- Margen esperado:
- Capacidad semanal:

### Evidencia y medición

- Demostración disponible:
- Resultado verificable:
- Evento de CTA:
- Evento/registro de compra:
- Fuente y UTM:
- Objeciones observadas:
- Recompras o upsells posibles:

## 3. Puerta de preparación

Una página sólo puede marcarse `lista` si todas las respuestas son “sí”:

- [ ] Abre desde una ventana de incógnito sin acceso a Firebase Console.
- [ ] Funciona en móvil y escritorio.
- [ ] No expone claves privadas, datos personales, paneles administrativos ni información de clientes.
- [ ] Chalamandra posee o puede comercializar código, contenido, tipografías, imágenes y dependencias.
- [ ] Se entiende el problema que resuelve en menos de diez segundos.
- [ ] Está definido qué compra el cliente y durante cuánto tiempo.
- [ ] Precio, moneda, impuestos y devolución están definidos.
- [ ] Existe un proceso de pago y confirmación.
- [ ] La entrega fue probada de extremo a extremo.
- [ ] El soporte tiene alcance y límite.
- [ ] Privacidad y términos corresponden al producto real.
- [ ] CTA, fuente, compra, coste y tiempo pueden medirse.

## 4. Selección del primer producto

Puntuar de 1 a 10. En fricción y riesgo, 10 es peor.

`prioridad = (intención + claridad + margen + entrega + evidencia + (11 − fricción) + (11 − riesgo)) / 7`

| Producto | Intención | Claridad | Margen | Facilidad de entrega | Evidencia | Fricción | Riesgo | Prioridad |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Por completar |  |  |  |  |  |  |  |  |

No seleccionar por estética o complejidad técnica. Seleccionar la página que resuelva el problema más urgente con la entrega más clara y el mejor margen por hora.

## 5. Modelos comerciales posibles

Elegir sólo los que coincidan con lo que el producto realmente permite:

| Modelo | Qué compra el cliente | Cuándo usarlo |
|---|---|---|
| Acceso | Derecho a usar una aplicación con control de acceso | Existe autenticación, gestión de acceso y soporte |
| Descarga/copia | Archivos o copia desplegable | La licencia y la instalación están documentadas |
| Licencia | Derecho de uso bajo condiciones definidas | Propiedad intelectual y límites están revisados |
| Personalización | Adaptación de una base existente | Alcance, revisiones, plazo y capacidad están acotados |
| Implementación | Producto configurado en el entorno del cliente | El proceso fue probado y tiene precio rentable |
| Paquete | Varias páginas complementarias | Cada componente aporta valor y ya existe |

## 6. Experimento de primera venta

1. Seleccionar un solo producto `listo`.
2. Escribir una oferta con problema, resultado, entregable, precio y CTA.
3. Mostrarla a 20 compradores pertinentes, no a una audiencia general.
4. Registrar respuesta, clic, contacto, objeción, pago, coste y tiempo.
5. Entregar a la primera persona compradora y medir fricción real.
6. Repetir tres ventas antes de ampliar catálogo.

El veredicto no es “gustó”. Es: **se cobró, se entregó, dejó margen y puede repetirse**.

## 7. Arquitectura de dominio

```text
chalamandramagistral.com                 → empresa, catálogo y ofertas
producto.chalamandramagistral.com        → página/producto alojado en Firebase
otra-herramienta.chalamandramagistral.com → otro producto sólo cuando esté listo
```

El dominio principal funciona actualmente sobre Vercel. No reemplazar sus registros para conectar una página de Firebase. Crear un subdominio deliberado por producto o familia de productos y añadir en Cloudflare únicamente los registros indicados por el asistente de Firebase Hosting. Verificar HTTPS y la página pública antes de enlazarla desde el catálogo.

Para cada subdominio registrar:

| Producto | Subdominio propuesto | Hosting real | Estado SSL | Enlace desde catálogo | Analítica | Responsable |
|---|---|---|---|---|---|---|
| Por completar | Por completar | Firebase Hosting / otro | pendiente | no | pendiente | Por completar |
