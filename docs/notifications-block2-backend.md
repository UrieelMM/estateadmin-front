# Especificación Completa - Cloud Functions (Bloque 2 Notificaciones)

Documento operativo para implementar el motor concurrente de notificaciones en tu proyecto backend.

## 1. Objetivo
Implementar despacho robusto de notificaciones in-app con:

- Concurrencia segura multi-tenant (`clientId` + `condominiumId`).
- Idempotencia real.
- Reintentos con backoff.
- Dead-letter para fallos permanentes.
- Observabilidad y trazabilidad completa.

## 2. Estado actual del frontend
Ya está preparado para dos modos:

- `VITE_NOTIFICATION_DISPATCH_MODE=client`
  - El frontend emite evento y también despacha.
- `VITE_NOTIFICATION_DISPATCH_MODE=server`
  - El frontend solo crea evento en `notificationEvents`.
  - El backend despacha todo.

Para Bloque 2 debes usar:

- `VITE_NOTIFICATION_DISPATCH_MODE=server`

## 3. Colecciones y contratos (Firestore)

### 3.1 Entrada (frontend escribe)
Ruta:

- `clients/{clientId}/condominiums/{condominiumId}/notificationEvents/{eventId}`

Campos esperados:

```json
{
  "eventType": "maintenance.ticket_created",
  "module": "maintenance",
  "priority": "medium",
  "title": "Nuevo ticket de mantenimiento: ...",
  "body": "Se registró el ticket ...",
  "dedupeKey": "maintenance:ticket:abc123:created",
  "channels": ["in_app"],
  "audience": {
    "scope": "admins_and_assistants",
    "userIds": []
  },
  "entityId": "abc123",
  "entityType": "ticket_maintenance",
  "metadata": {},
  "createdAt": "serverTimestamp",
  "createdBy": "uid",
  "createdByName": "Nombre",
  "status": "pending_dispatch",
  "clientId": "client-id",
  "condominiumId": "condo-id"
}
```

Estados de `notificationEvents` recomendados:

- `pending_dispatch`
- `processing`
- `emitted`
- `failed`

Campos operativos recomendados:

- `attempts` (number)
- `lockUntil` (timestamp|null)
- `nextRetryAt` (timestamp|null)
- `processedAt` (timestamp|null)
- `lastError` (string|null)
- `workerId` (string|null)

### 3.2 Cola de despacho (backend escribe)
Ruta:

- `clients/{clientId}/condominiums/{condominiumId}/notificationQueue/{queueId}`

Campos:

```json
{
  "sourceEventId": "eventId",
  "eventType": "maintenance.ticket_created",
  "module": "maintenance",
  "priority": "medium",
  "channels": ["in_app"],
  "status": "dispatched",
  "dedupeKey": "maintenance:ticket:abc123:created",
  "recipientsCount": 2,
  "recipients": ["uid1", "uid2"],
  "createdAt": "serverTimestamp",
  "dispatchedAt": "serverTimestamp",
  "dispatchedBy": "notification-worker",
  "clientId": "client-id",
  "condominiumId": "condo-id"
}
```

### 3.3 Entrega final (in-app)
Ruta:

- `clients/{clientId}/condominiums/{condominiumId}/users/{userId}/notifications/{notificationId}`

Campos:

```json
{
  "title": "Nuevo ticket de mantenimiento: ...",
  "body": "Se registró el ticket ...",
  "module": "maintenance",
  "eventType": "maintenance.ticket_created",
  "priority": "medium",
  "read": false,
  "readAt": null,
  "entityId": "abc123",
  "entityType": "ticket_maintenance",
  "metadata": {},
  "sourceEventId": "eventId",
  "sourceQueueId": "queueId",
  "createdAt": "serverTimestamp",
  "createdBy": "notification-worker",
  "clientId": "client-id",
  "condominiumId": "condo-id"
}
```

### 3.4 Dead-letter
Ruta:

- `clients/{clientId}/condominiums/{condominiumId}/notificationDeadLetters/{deadId}`

Campos:

- `sourceEventId`
- `dedupeKey`
- `payloadSnapshot`
- `errorCode`
- `errorMessage`
- `attempts`
- `createdAt`

## 4. Functions a desplegar (obligatorias)

## 4.1 `onNotificationEventCreated`
Tipo:

- Firestore trigger `onCreate`

Ruta:

- `clients/{clientId}/condominiums/{condominiumId}/notificationEvents/{eventId}`

Responsabilidades:

- Validar que el evento venga con `status == pending_dispatch`.
- Ejecutar lock transaccional.
- Validar idempotencia.
- Resolver audiencia.
- Crear `notificationQueue`.
- Escribir notificaciones en subcolección de cada usuario.
- Marcar evento `emitted`.

### 4.1.1 Lock transaccional exacto
Dentro de transacción:

- Leer evento.
- Abort si `status != pending_dispatch`.
- Set:
  - `status = processing`
  - `lockUntil = now + NOTIFICATION_LOCK_SECONDS`
  - `workerId = <execution id>`
  - `attempts = (attempts || 0) + 1`

### 4.1.2 Idempotencia exacta
Antes de crear queue:

- Buscar en `notificationQueue` documentos con:
  - mismo `dedupeKey`
  - mismo `clientId`
  - mismo `condominiumId`
  - `createdAt >= now - DEDUPE_WINDOW_MINUTES`

Si existe:

- marcar evento `emitted` con `processedAt`
- no volver a escribir notificaciones

### 4.1.3 Resolución de audiencia
Si `audience.scope`:

- `admins`:
  - `users.role == admin`
- `admins_and_assistants`:
  - `users.role in [admin, admin-assistant]`
- `specific_users`:
  - `audience.userIds`

Filtros adicionales recomendados:

- `users.active == true` cuando exista el campo.
- Si no hay recipients:
  - fallback a `createdBy`.

### 4.1.4 Escritura por lotes
Usar chunks de `NOTIFICATION_BATCH_SIZE` (máx 400 recomendado).

- 1 batch por chunk.
- Cada doc incluye `sourceEventId` y `sourceQueueId`.

### 4.1.5 Cierre exitoso
Actualizar `notificationEvents/{eventId}`:

- `status = emitted`
- `lockUntil = null`
- `processedAt = now`
- `lastError = null`
- `queueId = <id>`

## 4.2 `retryStaleNotificationEvents`
Tipo:

- Scheduler cada 1 o 2 minutos.

Responsabilidades:

- Encontrar eventos `processing` cuyo `lockUntil < now`.
- Encontrar eventos `pending_dispatch` cuyo `nextRetryAt <= now`.
- Reprocesar llamando el mismo flujo interno de dispatch.

## 4.3 `processNotificationEvent` (helper interno)
Tipo:

- función compartida (no trigger).

Responsabilidades:

- Contener la lógica de dispatch para reuso entre trigger y scheduler.

## 5. Manejo de errores y reintentos

Reglas:

- `attempts` se incrementa por intento real.
- Backoff:
  - `delayMs = BASE_RETRY_MS * 2^(attempts-1)`
  - limitar a `MAX_RETRY_MS`.
- Si `attempts >= NOTIFICATION_MAX_RETRIES`:
  - crear doc en `notificationDeadLetters`
  - marcar evento `failed`
  - liberar lock

Campos de error en evento:

- `lastError`
- `lastErrorCode`
- `nextRetryAt`

## 6. Concurrencia y escalabilidad

Requisitos:

- Nunca procesar un mismo evento en paralelo.
- Lock por documento de evento.
- Chunks en writes para no superar límites de Firestore.
- En scheduler, procesar lotes por tenant (ej. 50 eventos por condominio).

Si crece volumen:

- Migrar dispatch por chunk a Cloud Tasks.
- Mantener idempotencia en worker final.

## 7. Seguridad y aislamiento tenant

Aunque Admin SDK bypass rules, debes validar:

- `event.clientId === path.clientId`
- `event.condominiumId === path.condominiumId`
- `event.createdBy` no vacío
- `event.channels` solo `in_app` (por ahora)

Si falla validación:

- marcar `failed` + dead-letter.

## 8. Índices recomendados

Crear índices compuestos para:

- `notificationEvents`: `status + nextRetryAt + lockUntil + createdAt`
- `notificationQueue`: `dedupeKey + createdAt`
- `users` (si aplicas filtros):
  - `role + active`

## 9. Variables de entorno backend

Obligatorias:

- `NOTIFICATION_MAX_RETRIES=5`
- `NOTIFICATION_LOCK_SECONDS=60`
- `NOTIFICATION_BATCH_SIZE=400`
- `NOTIFICATION_DEDUPE_WINDOW_MINUTES=10`
- `NOTIFICATION_BASE_RETRY_MS=30000`
- `NOTIFICATION_MAX_RETRY_MS=900000`

Opcionales:

- `NOTIFICATION_WORKER_ID_PREFIX=notif-worker`
- `NOTIFICATION_LOG_VERBOSE=true`

## 10. Flujo end-to-end

1. Front crea `notificationEvents` con `pending_dispatch`.
2. Trigger toma lock y pasa a `processing`.
3. Verifica dedupe.
4. Resuelve recipients.
5. Crea `notificationQueue`.
6. Crea docs en `users/{uid}/notifications`.
7. Marca evento `emitted`.
8. Si falla:
   - set `nextRetryAt`
   - scheduler reintenta.
9. Si excede reintentos:
   - mueve a dead-letter.

## 11. Observabilidad mínima obligatoria

Por ejecución loggear:

- `eventId`
- `clientId`
- `condominiumId`
- `dedupeKey`
- `attempts`
- `recipientsCount`
- `latencyMs`
- `result` (`emitted|deduped|retry|failed`)

Métricas agregadas (por hora/día):

- `processedEvents`
- `dedupedEvents`
- `notificationsWritten`
- `failedEvents`
- `avgDispatchLatencyMs`

## 12. Pruebas que debes correr

## 12.1 Casos felices

- Evento `maintenance.ticket_created` con 2 admins.
- Evento `inventory.out_of_stock` con recipients activos.
- Evento `specific_users` con lista explícita.

## 12.2 Idempotencia

- Duplicar el mismo evento (mismo `dedupeKey`) dentro de ventana.
- Validar que solo exista una entrega efectiva.

## 12.3 Concurrencia

- Insertar 100 eventos simultáneos de 5 condominios.
- Verificar no duplicados y tiempos razonables.

## 12.4 Fallas

- Forzar error en escritura de notificaciones.
- Verificar `attempts`, `nextRetryAt`, y eventual dead-letter.

## 13. Checklist de despliegue

1. Implementar functions en proyecto backend.
2. Crear índices Firestore.
3. Desplegar functions.
4. Cambiar frontend a:
   - `VITE_NOTIFICATION_DISPATCH_MODE=server`
5. Validar con evento manual de prueba.
6. Verificar que campana lea notificaciones nuevas.
7. Monitorear 24h logs y métricas.

## 14. Notas de compatibilidad

- El frontend ya usa:
  - `notificationEvents`
  - `notificationQueue`
  - `users/{uid}/notifications`
- Si backend agrega campos extra (`processing`, `failed`, `attempts`, etc.) no rompe UI actual.
