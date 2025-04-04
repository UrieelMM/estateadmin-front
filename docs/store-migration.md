# Guía de migración de stores de Zustand

Para solucionar el problema de persistencia de datos entre sesiones de usuarios diferentes, hemos implementado un sistema de reset global para todos los stores de Zustand.

## Cambios realizados

1. Se ha creado un archivo `src/store/createStore.ts` que proporciona:

   - Una función `create` personalizada que registra todos los stores para poder resetearlos
   - Una función `resetAllStores` que restablece todos los stores a su estado inicial

2. Se ha modificado `AuthStore.ts` para:
   - Usar nuestro `create` personalizado
   - Llamar a `resetAllStores()` durante el cierre de sesión

## Corrección de errores

Hemos reimplementado completamente la solución debido a problemas con el acceso al estado del store. El nuevo enfoque:

1. Modifica cómo se inicializa el store para capturar el estado inicial directamente en la creación
2. Es más robusto y compatible con la estructura interna de Zustand
3. Evita los problemas de "getState is not a function" que ocurrían anteriormente

## Cómo migrar el resto de stores

Todos los stores deben actualizarse para usar nuestra función `create` personalizada en lugar de la función estándar de Zustand.

Para cada archivo de store (por ejemplo, `usePaymentStore.ts`), realizar estos cambios:

1. Cambiar la importación:

   ```typescript
   // Antes
   import { create } from "zustand";

   // Después
   import { create } from "./createStore";
   ```

2. Para stores en subdirectorios (como en `superAdmin/`), ajustar la ruta de importación:

   ```typescript
   // Ejemplo para un store en superAdmin/
   import { create } from "../createStore";
   ```

3. **IMPORTANTE**: Asegúrate de que la sintaxis del create esté correcta. Nuestra implementación utiliza un patrón ligeramente diferente:
   ```typescript
   // Sintaxis correcta
   const useMyStore = create<MyStoreType>()((set, get) => ({
     // ... propiedades y métodos del store
   }));
   ```

## Verificación

Para verificar que la migración funciona correctamente:

1. Migrar primero un solo store además del AuthStore
2. Probar el cierre de sesión y verificar que no hay errores
3. Iniciar sesión con otra cuenta y verificar que no persisten datos de la sesión anterior
4. Si funciona, continuar con la migración de los demás stores

## Lista de stores a migrar

- [ ] useRegisterUserStore.ts
- [ ] useNotificationsStore.ts
- [ ] useClientInvoicesStore.ts
- [ ] paymentSummaryStore.ts
- [ ] usePaymentStore.ts
- [ ] Stores en superAdmin/
- [ ] expenseSummaryStore.ts
- [ ] useSearchProviders.ts
- [ ] useConfigStore.ts
- [ ] useUnidentifiedPaymentsStore.ts
- [ ] UserDataStore.ts
- [ ] useChargeStore.ts
- [ ] receiptsStore.ts
- [ ] useCondominiumStore.ts
- [ ] expenseStore.ts
- [ ] providerStore.ts
- [ ] paymentHistoryStore.ts
- [ ] useReservationStore.ts
- [ ] usePasswordResetStore.ts
- [ ] morosityStore.ts
- [ ] useMaintenanceStore.ts
- [ ] useParcelStore.ts
- [ ] usePublicationStore.ts
- [ ] useAccountsStore.ts
- [ ] useAdminUsersStore.ts
