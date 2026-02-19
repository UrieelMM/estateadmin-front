# Implementación - Notificación de Factura Pendiente (Super Admin Billing)

Este documento resume la implementación para notificar al usuario objetivo cuando se genera una factura en `/super-admin/billing`, incluyendo diferenciador visual en la campana.

## 1) Objetivo

Cuando se crea una factura:

1. Emitir evento de notificación al tenant correcto (`clientId`, `condominiumId`).
2. Enviarlo al usuario objetivo (`userUID`) si está disponible.
3. Si no hay `userUID`, enviar a audiencia de admins/assistants del condominio.
4. Mostrar la notificación con estilo visual destacado para que no pase desapercibida.

---

## 2) Cambios Frontend Implementados

## 2.1 Emisión de evento desde Billing (super admin)

Archivo:

- `src/store/superAdmin/BillingStore.ts`

Cambios:

1. Se importó `emitDomainNotificationEvent`.
2. Al finalizar `createInvoice` (después de `addDoc`), se emite evento:
   - `eventType`: `finance.invoice_pending_payment`
   - `module`: `finance`
   - `priority`: `critical`
   - `context`: `{ clientId, condominiumId }` (clave para ruta correcta desde super admin)
   - `audience`:
     - `specific_users` con `userUID` cuando existe
     - fallback a `admins_and_assistants`
   - `entityId`: id de la factura
   - `entityType`: `invoice_generated`
   - `metadata`: invoiceNumber, amount, dueDate, companyName, etc.

---

## 2.2 Soporte cross-tenant en emisor de notificaciones

Archivo:

- `src/services/notificationCenterService.ts`

Cambios:

1. Se agregó soporte para `input.context`.
2. Resolución de tenant:
   - `clientId = input.context?.clientId || claimClientId`
   - `condominiumId = input.context?.condominiumId || localStorageCondominiumId`
3. Esto permite que super admin emita eventos al tenant objetivo aunque no esté “navegando” como ese condominio.

---

## 2.3 Tipos de notificación

Archivo:

- `src/types/notifications.ts`

Cambios:

1. Se agregó `eventType`:
   - `finance.invoice_pending_payment`
2. Se agregó `context` opcional al contrato `DomainNotificationEventInput`:
   - `{ clientId: string; condominiumId: string }`

---

## 2.4 Catálogo de eventos

Archivo:

- `src/config/notificationEventsCatalog.ts`

Cambios:

1. Se registró:
   - `finance.invoice_pending_payment`
   - módulo: Finanzas
   - prioridad por defecto: `high` en catálogo (el emisor actual la manda `critical`)
   - audiencia por defecto: `admins_and_assistants`

---

## 2.5 Diferenciador visual en NotificationsBell

Archivo:

- `src/presentation/components/shared/notifications/NotificationsBell.tsx`

Cambios:

1. Badge específico en campana:
   - cuando hay no leídas de factura pendiente muestra `FAC`.
2. Render destacado para `finance.invoice_pending_payment`:
   - borde lateral ámbar
   - fondo ámbar suave
   - ícono de documento
   - etiqueta textual `Facturación pendiente`
3. Mantiene prioridad y módulo visibles.

---

## 3) Cambios Requeridos en Cloud Functions

Si tu backend valida `eventType`/`module`, debes actualizar:

1. Allow-list de `eventType`:
   - agregar `finance.invoice_pending_payment`
2. Si hay validación de módulo:
   - `finance` ya debe existir (confirmar).
3. Mantener soporte de `audience.scope = specific_users` y `userIds`.
4. Mantener lectura de `context` del evento (ya llega resuelto en documento).

Si tienes dedupe por ventana:

- Recomendado para este evento:
  - ventana 10-30 minutos por `dedupeKey`.

---

## 4) Reglas de Firestore

No requiere colección nueva.  
Se usan las ya implementadas:

1. `notificationEvents`
2. `notificationQueue`
3. `users/{uid}/notifications`

Solo confirmar que en producción estén desplegadas las reglas que permiten este flujo.

---

## 5) Flujo Operativo Final

1. Super admin crea factura en Billing.
2. Se guarda documento en `invoicesGenerated`.
3. Se emite evento `finance.invoice_pending_payment`.
4. Dispatcher backend procesa y crea notificación in-app al usuario objetivo.
5. Usuario ve campana con badge `FAC` y tarjeta resaltada de facturación pendiente.

---

## 6) Pruebas QA Recomendadas

## Caso A: con userUID

1. Crear factura con `userUID` válido.
2. Verificar notificación solo en ese usuario.
3. Verificar estilo destacado en campana.

## Caso B: sin userUID

1. Crear factura sin `userUID`.
2. Verificar envío a admins/assistants del condominio.

## Caso C: tenant correcto

1. Crear factura de client/condominio distinto al actual del navegador.
2. Verificar que aparece en la ruta de Firestore del tenant objetivo.

## Caso D: dedupe

1. Repetir creación lógica con mismo `dedupeKey` (si aplica en backend).
2. Verificar que no se duplique entrega dentro de ventana.

---

## 7) Checklist de Despliegue

1. Deploy frontend con estos cambios.
2. Confirmar env front:
   - `VITE_NOTIFICATION_DISPATCH_MODE=server`
3. Deploy de Cloud Functions con allow-list actualizado.
4. Ejecutar QA A/B/C/D.
5. Monitorear logs de dispatcher por 24h.
