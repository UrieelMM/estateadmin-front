# Implementación del Tour de la Aplicación con Driver.js

## Resumen
Se ha implementado un tour interactivo para la aplicación EstateAdmin utilizando la librería `driver.js`. El tour guía a los nuevos usuarios a través de las principales funcionalidades del sistema.

## Archivos Creados

### 1. Hook personalizado: `src/hooks/useAppTour.ts`
- Gestiona la lógica del tour
- Se ejecuta automáticamente la primera vez que un usuario accede al dashboard
- Guarda en localStorage si el usuario ya completó el tour
- Exporta funciones `startTour` y `resetTour` para control manual

### 2. Estilos personalizados: `src/styles/tour.css`
- Estilos personalizados para el tour
- Soporte para modo oscuro
- Colores consistentes con el diseño de la aplicación (indigo)

### 3. Componente de botón: `src/presentation/components/shared/TourButton.tsx`
- Botón flotante en la esquina inferior derecha
- Permite reiniciar el tour manualmente
- Icono de interrogación para fácil identificación

## Modificaciones Realizadas

### 1. `LayoutDashboard.tsx`
- Se agregaron IDs dinámicos a los elementos de navegación
- IDs generados: `nav-usuarios`, `nav-finanzas`, `nav-mantenimiento`, etc.
- Los IDs se aplican tanto en la versión desktop como móvil del menú

### 2. `DashboardHome.tsx`
- Se integró el hook `useAppTour`
- Se agregó el componente `TourButton` para reiniciar el tour
- Se agregó el ID `novedades-guias` a la sección de Novedades y Guías

## Pasos del Tour

1. **Bienvenida**: Mensaje de bienvenida centrado en la pantalla
2. **Usuarios**: Destaca la sección de gestión de usuarios y residentes
3. **Finanzas**: Muestra las herramientas financieras disponibles
4. **Mantenimiento**: Explica la gestión de reportes de mantenimiento
5. **Configuración**: Indica dónde configurar cuentas bancarias, facturas y usuarios administrativos
6. **Novedades y Guías**: Invita a revisar constantemente las actualizaciones

## Características

- ✅ Inicio automático para nuevos usuarios
- ✅ Botón flotante para reiniciar el tour
- ✅ Progreso visual (muestra paso X de Y)
- ✅ Navegación con botones Anterior/Siguiente/Finalizar en español
- ✅ Posibilidad de cerrar en cualquier momento
- ✅ **Persistencia en Firebase** (campos `appTourCompleted` y `appTourCompletedAt` en `clients/{clientId}`)
- ✅ Estilos personalizados con degradado indigo
- ✅ Responsive (funciona en desktop y móvil)
- ✅ Elementos destacados sin difuminado

## Cómo Usar

### Para usuarios finales:
- El tour se inicia automáticamente la primera vez que acceden al dashboard
- Pueden cerrar el tour en cualquier momento
- Pueden reiniciarlo haciendo clic en el botón flotante con el ícono de interrogación

### Para desarrolladores:
```typescript
// Usar el hook en cualquier componente
const { startTour, resetTour } = useAppTour();

// Iniciar el tour manualmente
startTour();

// Reiniciar el tour (borra el localStorage y lo inicia)
resetTour();
```

## Reiniciar el Tour Manualmente

Para probar el tour después de haberlo completado:
1. Hacer clic en el **botón flotante** con el ícono de interrogación (esquina inferior derecha)
2. El tour se reiniciará automáticamente

**Nota**: El estado del tour ahora se guarda en Firebase directamente en el documento del cliente `clients/{clientId}` (campos `appTourCompleted` y `appTourCompletedAt`), por lo que es persistente entre dispositivos y sesiones.

## Dependencias Instaladas

```json
{
  "driver.js": "^1.x.x"
}
```

## Próximas Mejoras Sugeridas

- [ ] Agregar más pasos para otras secciones importantes
- [ ] Crear tours específicos por módulo
- [ ] Agregar animaciones personalizadas
- [ ] Traducción a otros idiomas
- [ ] Analytics para rastrear qué usuarios completan el tour
