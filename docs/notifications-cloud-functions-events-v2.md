# Cloud Functions - Cambios Necesarios (Eventos Nuevos Front)

Este documento cubre **todos** los ajustes backend para soportar los eventos nuevos que ahora emite el frontend.

## 1) Resumen
El frontend ya emite estos eventos:

1. `finance.petty_cash_low_threshold`
2. `finance.reconciliation_net_difference`
3. `finance.expense_outlier`
4. `projects.expense_movement_registered`
5. `maintenance.appointment_24h`
6. `staff.shift_missing_checkout`
7. `staff.document_expiring`
8. `projects.task_overdue`
9. `projects.dependency_blocked`
10. `projects.schedule_deviation`
11. `projects.cost_deviation`
12. `staff.employee_status_alert` (ya existente, mantener)

## 2) Cambios obligatorios en Functions

## 2.1 Validación de payload (Zod/Joi/manual)
Si tu function valida `eventType`, debes agregar todos los tipos anteriores al allow-list.  
Si valida `module`, debes incluir `projects`.

Campos mínimos requeridos al recibir evento:

- `eventType`
- `module`
- `priority`
- `title`
- `body`
- `dedupeKey`
- `clientId`
- `condominiumId`
- `entityId`
- `entityType`
- `channels` (por ahora `["in_app"]`)

Campos opcionales:

- `audience`
- `metadata`
- `createdBy`
- `createdByName`

## 2.2 Dispatcher / worker
No cambiar arquitectura base; solo extender catálogo y reglas:

- Resolver audiencia (`admins`, `admins_and_assistants`, `specific_users`).
- Crear `notificationQueue`.
- Escribir `users/{uid}/notifications`.
- Marcar evento `emitted`.

## 2.3 Dedupe por tipo de evento (obligatorio)
Debes usar `dedupeKey + clientId + condominiumId` como idempotencia lógica.

Ventana sugerida por evento:

- `finance.petty_cash_low_threshold`: 6 horas
- `finance.reconciliation_net_difference`: 24 horas
- `finance.expense_outlier`: 12 horas
- `projects.expense_movement_registered`: 5 minutos
- `maintenance.appointment_24h`: 12 horas
- `staff.shift_missing_checkout`: 12 horas
- `staff.document_expiring`: 24 horas
- `projects.task_overdue`: 12 horas
- `projects.dependency_blocked`: 12 horas
- `projects.schedule_deviation`: 24 horas
- `projects.cost_deviation`: 24 horas
- `staff.employee_status_alert`: 24 horas

Si ya existe queue para la misma llave en su ventana:

- no volver a escribir notificaciones
- marcar evento como `emitted` con flag `deduped: true`

## 2.4 Priorización (mantener consistencia)
Mapeo recomendado:

- `critical`: `projects.cost_deviation` (si >25%), opcionalmente escalar otros
- `high`: desviaciones >10%, outlier de egreso, net difference relevante, sin checkout, estatus suspendido/inactivo
- `medium`: cita 24h, documento por vencer (>7 días), movimiento de gasto de proyecto
- `low`: solo si agregas eventos informativos futuros

## 2.5 Persistencia de metadatos
Guardar `metadata` completo en `users/{uid}/notifications` para trazabilidad.
No filtrar estos campos:

- `projectId`, `taskId`, `expenseId`, `appointmentId`, `employeeId`, `documentId`
- `deviationRatio`, `thresholdAmount`, `currentBalance`, `unmatchedDifference`
- `date`, `time`, `dueDate`, `expirationDate`

## 2.6 Reintentos y dead-letter
Mantener lógica existente:

- `attempts`, `nextRetryAt`, `lockUntil`
- backoff exponencial
- mover a `notificationDeadLetters` al superar `NOTIFICATION_MAX_RETRIES`

## 2.7 Logs y métricas (ampliar dashboard)
Agregar agregación por `eventType`:

- `processedEventsByType`
- `dedupedEventsByType`
- `failedEventsByType`
- `notificationsWrittenByType`
- `avgLatencyByType`

Esto es clave para ajustar ruido y costo.

## 3) Cambios en modelo de datos backend

## 3.1 `notificationEvents`
Permitir estados:

- `pending_dispatch`
- `processing`
- `emitted`
- `failed`

Campos recomendados:

- `attempts`
- `lockUntil`
- `nextRetryAt`
- `processedAt`
- `lastError`
- `workerId`
- `deduped` (bool)

## 3.2 `notificationQueue`
Agregar:

- `deduped` (bool)
- `eventType`
- `module`
- `priority`
- `recipientsCount`

## 3.3 `users/{uid}/notifications`
Asegurar estos campos:

- `module`
- `eventType`
- `priority`
- `sourceEventId`
- `sourceQueueId`
- `metadata`

## 4) Cambios en filtros de panel super-admin (si aplica)
Si tienes panel de métricas/uso de notificaciones:

- agregar filtros por `eventType` y `module`
- agregar ranking de eventos más frecuentes
- agregar ratio dedupe por evento

## 5) Pruebas backend obligatorias

## 5.1 Pruebas de contrato
Validar que cada `eventType` nuevo:

- no sea rechazado por schema
- se procese correctamente

## 5.2 Pruebas de dedupe
Enviar 2 eventos iguales (misma `dedupeKey`) dentro de ventana:

- solo 1 entrega efectiva en `users/{uid}/notifications`

## 5.3 Pruebas de concurrencia
Insertar 100+ eventos mezclando tipos nuevos:

- sin duplicados
- sin pérdida
- sin bloqueo por tenant

## 5.4 Pruebas de error
Forzar fallo de escritura Firestore:

- retry con backoff
- dead-letter al límite

## 6) Variables de entorno recomendadas

- `NOTIFICATION_MAX_RETRIES=5`
- `NOTIFICATION_LOCK_SECONDS=60`
- `NOTIFICATION_BATCH_SIZE=400`
- `NOTIFICATION_BASE_RETRY_MS=30000`
- `NOTIFICATION_MAX_RETRY_MS=900000`
- `NOTIFICATION_DEDUPE_WINDOW_DEFAULT_MINUTES=10`

Y si manejas ventana por evento:

- `NOTIFICATION_DEDUPE_WINDOWS_JSON` con mapa `eventType -> minutes`

## 7) Compatibilidad con frontend actual
El frontend ya envía los nuevos eventos; backend solo debe:

1. aceptar nuevos `eventType/module`,
2. deduplicar correctamente,
3. despachar in-app,
4. mantener trazabilidad.

No requiere cambios adicionales en API HTTP si trabajas por trigger Firestore.

## 8) Checklist final de despliegue

1. Actualizar código de functions con nuevos `eventType` y `module`.
2. Deploy functions.
3. Verificar `VITE_NOTIFICATION_DISPATCH_MODE=server` en front.
4. Confirmar creación de docs en:
   - `notificationEvents`
   - `notificationQueue`
   - `users/{uid}/notifications`
5. Validar dedupe por tipo en logs.
6. Monitorear 24h métricas por `eventType`.
