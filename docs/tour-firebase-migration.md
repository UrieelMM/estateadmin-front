# Migración del Tour a Firebase

## Resumen de Cambios

Se migró el sistema de persistencia del tour de `localStorage` a **Firebase Firestore** para tener un estado compartido entre dispositivos y sesiones.

## Cambios Realizados

### 1. Nuevo Step: Configuración

Se agregó un paso adicional al tour que destaca la sección de **Configuración**:

- **Ubicación**: Entre "Mantenimiento" y "Novedades y Guías"
- **Elemento**: `#nav-configuracion`
- **Descripción**: Explica que en esta sección se pueden:
  - Configurar cuentas bancarias
  - Revisar facturas por pagar
  - Agregar nuevos usuarios administrativos
  - Personalizar el sistema

### 2. Migración a Firebase

#### Ruta en Firestore
```
clients/{clientId}
```

#### Campos Agregados al Documento del Cliente
```typescript
{
  // ... otros campos del cliente (RFC, businessName, etc.)
  appTourCompleted: boolean,
  appTourCompletedAt?: string,  // ISO timestamp cuando se completó
  appTourResetAt?: string       // ISO timestamp cuando se reinició
}
```

#### Cambios en el Hook (`useAppTour.ts`)

**Antes (localStorage):**
```typescript
localStorage.setItem('appTourCompleted', 'true');
localStorage.removeItem('appTourCompleted');
const tourCompleted = localStorage.getItem('appTourCompleted');
```

**Después (Firebase):**
```typescript
// Obtener clientId del usuario autenticado
const tokenResult = await getIdTokenResult(currentUser);
const clientId = tokenResult.claims.clientId;

// Guardar estado (usando merge para no sobrescribir otros campos)
await setDoc(doc(db, "clients", clientId), {
  appTourCompleted: true,
  appTourCompletedAt: new Date().toISOString()
}, { merge: true });

// Verificar estado
const clientDoc = await getDoc(doc(db, "clients", clientId));
const completed = clientDoc.data()?.appTourCompleted === true;
```

### 3. Funciones Implementadas

#### `getClientId()`
- Obtiene el `clientId` del usuario autenticado desde los claims de Firebase Auth
- Se ejecuta al montar el componente

#### `checkTourCompleted()`
- Verifica en Firebase si el usuario ya completó el tour
- Retorna `boolean`

#### `markTourCompleted()`
- Marca el tour como completado en Firebase
- Guarda timestamp de completado

#### `resetTour()`
- Reinicia el tour marcándolo como no completado
- Guarda timestamp de reinicio
- Inicia el tour automáticamente

## Ventajas de Firebase vs localStorage

| Característica | localStorage | Firebase |
|---------------|--------------|----------|
| **Persistencia entre dispositivos** | ❌ No | ✅ Sí |
| **Sincronización en tiempo real** | ❌ No | ✅ Sí |
| **Datos centralizados** | ❌ No | ✅ Sí |
| **Análisis de uso** | ❌ Difícil | ✅ Fácil |
| **Backup automático** | ❌ No | ✅ Sí |
| **Requiere conexión** | ❌ No | ✅ Sí |

## Orden de los Pasos del Tour

1. **Bienvenida** - Mensaje inicial centrado
2. **Usuarios** - Gestión de condóminos y residentes
3. **Finanzas** - Herramientas financieras
4. **Mantenimiento** - Reportes y solicitudes
5. **Configuración** - ⭐ NUEVO: Cuentas, facturas, usuarios admin
6. **Novedades y Guías** - Actualizaciones del sistema

## IDs Agregados

- `#nav-configuracion` - Enlace de configuración (desktop y móvil)

## Textos en Español

- ✅ "Siguiente" (antes: "Next")
- ✅ "Anterior" (antes: "Previous")
- ✅ "Finalizar" (antes: "Done")
- ✅ "X de Y" (progreso)

## Testing

Para probar el tour:

1. **Primera vez**: El tour se inicia automáticamente
2. **Reiniciar**: Click en el botón flotante (esquina inferior derecha)
3. **Verificar en Firebase**: 
   - Ir a Firestore Console
   - Navegar a `clients/{clientId}`
   - Ver los campos `appTourCompleted`, `appTourCompletedAt` y `appTourResetAt`

## Consideraciones

- El tour solo se inicia si el usuario tiene un `clientId` válido
- Si no hay conexión a Firebase, el tour no se mostrará automáticamente
- Los errores de Firebase se capturan en console.error
- El estado se sincroniza entre todos los dispositivos del usuario
