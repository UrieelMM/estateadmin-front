# Reversa De Pagos: Implementación Provisional Y Plan De Producción

## Contexto
Se implementó una herramienta **provisional de debug** en Ingresos para:
- inspeccionar pagos identificados/no identificados,
- exportar el detalle a JSON,
- y ejecutar una reversa manual controlada en casos de corrección operativa.

Después de validaciones, se retiró el botón/UI de debug para no exponer esta operación a usuarios finales mientras se prepara el flujo productivo para administradores.

## Qué Se Implementó (Provisional)
La implementación provisional estuvo en:
- `src/presentation/screens/dashboard/financialIncome/Income/Income.tsx`

### 1) Carga de debug de pagos
Se consultaba:
- `collectionGroup("payments")` filtrado por `clientId` y `condominiumId`.
- `clients/{clientId}/condominiums/{condominiumId}/unidentifiedPayments`.

Se construía un JSON con:
- metadatos (`generatedAt`, `clientId`, `condominiumId`),
- totales,
- lista de pagos identificados,
- lista de pagos no identificados.

### 2) Reversa manual de pago identificado (reglas aplicadas)
La reversa provisional aplicaba estos controles:
- validación de contexto de tenant (`clientId` y `condominiumId` actuales),
- validación de ruta/ID de pago objetivo,
- validación de existencia de `payment`, `charge`, `user`,
- bloqueo si el cargo tenía más de un pago (`siblingsSnap.size !== 1`),
- bloqueo si el ajuste de saldo a favor quedaba negativo.

### 3) Mutaciones ejecutadas en reversa (batch)
En una sola operación `writeBatch` se hacía:
- `users/{userId}`: ajuste de `totalCreditBalance`.
- `charges/{chargeId}`: `paid: false` y restauración de `amount`.
- eliminación de `payments/{paymentId}`.
- creación de auditoría en `auditLogs` con `eventType: "finance.payment_manual_revert_debug"`.

### 4) Fórmulas usadas en la reversa provisional
- `nextCreditBalance = currentCreditBalance - payment.creditBalance + payment.creditUsed`
- `restoredChargeAmount = charge.referenceAmount ?? payment.paymentAmountReference ?? payment.amountPaid ?? 0`

## Qué Se Retiró Del Front
Se eliminó de `Income.tsx`:
- botón `Debug pagos`,
- modal de debug,
- exportación JSON,
- handler de reversa manual desde UI de debug,
- imports y estado asociados.

Esto deja el módulo sin superficie de reversa visible para usuarios.

## Limitaciones Conocidas Del Enfoque Provisional
- Solo contemplaba reversa automática cuando el cargo tenía **exactamente un pago**.
- No gestionaba flujos complejos de prorrateo/múltiples pagos por cargo.
- No eliminaba/compensaba automáticamente archivos de recibo en Storage.
- No contemplaba un endpoint transaccional backend con idempotencia.
- Dependía de lógica front para una operación sensible (no ideal para producción).

## Recomendación Para Producción (Admins)
Implementar la reversa por **backend** (Cloud Function o API) y dejar el front solo como orquestador/UI.

## Requisitos Técnicos Para La Integración Productiva
1. Endpoint seguro de reversa:
- entrada mínima: `clientId`, `condominiumId`, `paymentId` (y/o `paymentPath` validado server-side),
- autenticación Firebase + validación de claims,
- autorización por rol (`admin` y/o `admin-assistant` según política).

2. Transacción atómica backend:
- usar transacción/bulk controlado server-side,
- validar precondiciones y estado actual antes de mutar,
- idempotencia con `operationId` (para evitar doble reversa por reintentos).

3. Regla de negocio para casos complejos:
- soporte explícito para cargos con múltiples pagos (o bloqueo con motivo claro),
- manejo de `creditBalance`/`creditUsed` consistente,
- trazabilidad de origen y motivo de reversa.

4. Auditoría robusta:
- `eventType` productivo (ej. `finance.payment_reversed`),
- `performedBy`, `performedAt`, `reason`, `previousState`, `nextState`,
- correlación con ticket/incidente cuando aplique.

5. Consistencia de documentos:
- actualizar `charge`, `payment`, `user` y cualquier agregado derivado necesario,
- definir política para recibos (`receiptUrl`) y comprobantes asociados:
  - borrar archivo,
  - marcar como invalidado,
  - o versionar estado documental.

6. UX de administración:
- modal de confirmación con resumen de impacto,
- motivo obligatorio de reversa,
- feedback de resultado y número de operación,
- tabla de historial de reversas (filtros por fecha, usuario, pago, motivo).

7. Pruebas mínimas antes de liberar:
- casos felices (pago único),
- bloqueos esperados (multi-pago, tenant inválido, saldo negativo),
- reintento idempotente,
- validación de auditoría y consistencia final.

## Checklist De Go-Live
- [ ] Endpoint backend desplegado y protegido.
- [ ] Reglas de Firestore ajustadas para impedir reversas directas desde cliente.
- [ ] UI admin conectada al endpoint productivo.
- [ ] Auditoría visible en panel de configuración/auditoría.
- [ ] Pruebas E2E de reversa completadas en ambiente preproductivo.
- [ ] Runbook operativo documentado (qué hacer ante reversa fallida/parcial).
