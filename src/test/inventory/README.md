# Pruebas del Módulo de Inventario

Este directorio contiene pruebas unitarias y de integración para los componentes del módulo de inventario de Estate Admin.

## Componentes Probados

1. **FilterBar**: Componente que maneja los filtros para la lista de inventario.

   - Prueba la renderización correcta de todos los elementos
   - Prueba el manejo del reseteo de filtros
   - Prueba la visualización del contador de stock bajo

2. **InventoryList**: Componente principal para visualizar la lista de inventario.

   - Prueba la renderización correcta del componente

3. **InventoryCategories**: Componente para gestionar categorías de inventario.

   - Prueba la renderización correcta del componente

4. **InventoryMovements**: Componente para visualizar movimientos de inventario.

   - Prueba la renderización correcta del componente

5. **InventoryAlerts**: Componente para visualizar alertas de inventario.

   - Prueba la renderización correcta del componente

6. **InventoryItemDetail**: Componente para visualizar detalles de un artículo.
   - Prueba la renderización correcta del componente

## Tests Avanzados

### Tests del Store de Inventario (InventoryStore.test.ts)

- **Operaciones CRUD de Items**:
  - Carga de items (`fetchItems`)
  - Creación de nuevos items (`addItem`)
  - Actualización de items (`updateItem`)
  - Eliminación de items (`deleteItem`)
- **Filtrado de Items**:
  - Filtrado por término de búsqueda
  - Filtrado por tipo de item
  - Reset de filtros
- **Operaciones de Stock**:
  - Añadir stock (`addStock`)
  - Consumir stock (`consumeItem`)
- **Alertas de Stock**:
  - Identificación de items con stock bajo

### Tests de Integración para InventoryItemDetail (InventoryItemDetail.integration.test.tsx)

- Carga y visualización de detalles de item
- Agregar stock a un item
- Consumir stock de un item
- Cambiar el estado de un item
- Visualización de movimientos de inventario

### Tests de Integración para InventoryCategories (InventoryCategories.integration.test.tsx)

- Visualización de categorías
- Añadir nueva categoría
- Editar categoría existente
- Eliminar categoría
- Manejo de estados especiales (sin categorías, cargando)

## Enfoque de Testing

Para las pruebas, se ha seguido el siguiente enfoque:

1. **Tests Unitarios Básicos**: Verifican que los componentes se rendericen correctamente.
2. **Tests de Integración**: Prueban la interacción entre componentes y el store.
3. **Tests del Store**: Verifican la lógica de negocio y operaciones CRUD.
4. **Mocking**: Se han mockeado las dependencias externas como Firebase para aislar las pruebas.

## Cómo Ejecutar los Tests

Para ejecutar todas las pruebas:

```bash
npm run test
```

Para ejecutar un archivo de prueba específico:

```bash
npm run test src/test/inventory/FilterBar.test.tsx
```

Para ejecutar tests con watch mode (útil durante desarrollo):

```bash
npm run test:watch
```

Para generar un reporte de cobertura:

```bash
npm run test:coverage
```
