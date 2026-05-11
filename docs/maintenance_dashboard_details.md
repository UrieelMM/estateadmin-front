# Detalles de Funcionamiento: Dashboard de Mantenimiento

El archivo `MaintenanceDashboard.tsx` es el componente central para la visualización y gestión general de las métricas del módulo de mantenimiento. A continuación, se detalla el funcionamiento completo de esta sección, abarcando tickets, reportes, costos, contratos, citas y generación de informes.

## 1. Gestión de Datos y Estados (Stores)
El componente obtiene su información comunicándose con múltiples "Stores" (manejadores de estado global) para unificar la información:
- **Reportes (`useMaintenanceReportStore`)**: Obtiene la lista de reportes de mantenimiento generados.
- **Tickets (`useTicketsStore`)**: Administra las incidencias o solicitudes reportadas por los usuarios.
- **Citas (`useMaintenanceAppointmentStore`)**: Controla las fechas y visitas agendadas.
- **Contratos (`useMaintenanceContractStore`)**: Gestiona los acuerdos o pólizas de mantenimiento activos.
- **Costos (`useMaintenanceCostStore`)**: Maneja los gastos, resúmenes por categoría y el desglose de costos mensuales.

## 2. Indicadores Clave de Rendimiento (KPIs)
El Dashboard realiza cálculos en tiempo real basados en los datos obtenidos para mostrar las siguientes métricas clave (Tarjetas Superiores):

### Mantenimiento y Operatividad
- **Reportes de Mantenimiento**: Muestra el total de reportes históricos y la cantidad específica generada en el último mes.
- **Tickets Activos**: Conteo de tickets que no están "cerrados", y muestra el desglose de cuántos se encuentran actualmente "en proceso".
- **Citas Agendadas**: Total de citas registradas y el número de citas en estado "pendiente" o "en proceso".
- **Contratos Activos**: Cantidad de contratos vigentes y una alerta de los contratos que están por vencer en el próximo mes.

### Control de Gastos y Costos
- **Gastos Totales**: Suma del monto total gastado durante el año en curso, así como la cantidad de registros generados.
- **Gastos Pendientes**: Monto total acumulado de aquellos gastos cuyo estado es "pendiente" de pago y su cantidad.
- **Promedio Mensual**: El gasto promedio calculado basándose únicamente en los meses que han registrado actividad de egresos.
- **Top Categoría de Gasto**: Identifica y muestra la categoría en la que se ha gastado más dinero, junto con su monto.

## 3. Estadísticas Avanzadas y Métricas de Rendimiento
En la parte inferior de la vista, se calculan métricas más profundas sobre la eficiencia de la operación:
- **Eficiencia de Resolución (%)**: Porcentaje de tickets que han pasado a estado "cerrado" frente al total.
- **Tiempo Promedio de Resolución**: Horas promedio que toma cerrar un ticket, calculado desde su fecha de creación hasta su fecha de cierre (solo considerando tickets resueltos).
- **Tiempo de Primera Respuesta**: Horas promedio que tarda el equipo en realizar una primera acción en un ticket nuevo (ej. agregar un comentario, cambiar el estado, asignar a un usuario o editarlo).
- **Eficiencia en Gastos (%)**: Mide qué porcentaje de los gastos registrados ya han sido "pagados" en relación al total de deudas ingresadas.

## 4. Visualización Gráfica (Charts)
Se emplean gráficos interactivos (`react-chartjs-2`) para analizar tendencias y distribuciones:
- **Reportes por Área (Gráfico Circular)**: Agrupa y grafica las 6 áreas o ubicaciones que más reportes de mantenimiento han generado.
- **Estado de Tickets (Gráfico Circular)**: Divide la cantidad de tickets por su estado actual (Abierto, En Proceso, Cerrado), utilizando una paleta de colores consistente a nivel de interfaz (Amarillo, Azul, Verde respectivamente).
- **Tendencia de Tickets (Gráfico de Líneas)**: Muestra la evolución diaria de la creación de tickets durante los últimos 7 días.
- **Actividad Mensual (Gráfico de Barras)**: Compara mes a mes durante el año actual el volumen de Tickets creados, Reportes generados y Citas agendadas, permitiendo ver picos de trabajo temporal.

## 5. Panel de Generación de Reportes PDF
El componente incluye una funcionalidad expandible para la exportación de información:
- Contiene un selector de **Fechas (Inicio y Fin)**, por defecto abarcando los últimos 3 meses.
- Utiliza el subcomponente `MaintenancePDFReportGenerator` para procesar la información de ese período específico.
- El PDF resultante agrupa los tickets, reportes, citas y costos comprendidos en dicho lapso.

## 6. Funcionalidades y Subcomponentes Adicionales
- **`TicketToAppointment`**: Se integra este componente en la vista para permitir, presumiblemente, el flujo de convertir rápidamente un ticket de soporte en una cita de mantenimiento en el calendario.
- **Carga de Datos (Loading State)**: Durante la carga simultánea inicial de reportes, tickets, citas, contratos y costos, el Dashboard muestra una vista de espera (`LoadingApp`) para evitar renderizados parciales o errores.

## 7. Estructura y Seguimiento de Tickets (`useTicketsStore.ts`)
El módulo maneja una estructura de datos rica para garantizar la trazabilidad completa de cada incidencia. A continuación se detallan los campos que componen un ticket y cómo se registra su historial.

### Campos Principales de un Ticket
Cada ticket creado cuenta con la siguiente información:
- **Identificadores**: `id` interno y un `folio` visible para el usuario.
- **Información General**: `title` (título) y `description` (descripción detallada del problema).
- **Estado y Prioridad**: 
  - `status`: Puede ser `abierto`, `en_progreso` o `cerrado`.
  - `priority`: Clasificado como `baja`, `media` o `alta`.
- **Fechas**: Fechas automáticas de creación (`createdAt`), última actualización (`updatedAt`) y cierre (`closedAt`).
- **Asignaciones y Ubicación**:
  - `createdBy` / `createdByEmail`: Quién reportó la incidencia.
  - `assignedTo`: Empleado o usuario al que se le ha asignado la resolución.
  - `providerId`: Si requiere atención externa, ID del proveedor asignado.
  - `area` / `commonAreaId` / `commonAreaName`: Ubicación física dentro del condominio donde ocurre la incidencia.
- **Multimedia y Extras**: 
  - `attachments`: Archivos o documentos adjuntos.
  - `evidenceUrls`: Enlaces a fotos o evidencias fotográficas.
  - `tags`: Etiquetas personalizables para fácil filtrado.
  - `hasAppointment`: Bandera que indica si el ticket ya derivó en una visita/cita en el calendario.
  - `mergedFrom`: Arreglo de IDs de otros tickets que eran duplicados y fueron fusionados dentro de este.

### Historial y Trazabilidad (Timeline)
El sistema mantiene un registro inmutable de todos los eventos que ocurren durante el ciclo de vida del ticket a través del arreglo `history`. Cada acción guarda la **fecha**, el **usuario** que la realizó, un **comentario automático** y, si aplica, el valor anterior y el nuevo valor.

Las acciones que detonan una entrada en el historial son:
1. **`created`**: Cuándo y quién reportó el ticket originalmente.
2. **`status_changed`**: Cambios de estado (ej. de "Abierto" a "En Progreso"). Si pasa a "Cerrado", se marca el `closedAt`.
3. **`priority_changed`**: Ajustes de prioridad (ej. subir a "Alta").
4. **`assigned`**: Cuándo se asigna o reasigna el ticket a un encargado.
5. **`area_changed` / `tags_changed`**: Actualización de la ubicación o recategorización con etiquetas.
6. **`files_added` / `files_removed`**: Cada vez que se sube o elimina evidencia fotográfica o un documento adjunto.
7. **`comment_added`**: Cualquier comentario manual de seguimiento que un administrador, asignado o residente deje en el ticket.
8. **`merge`**: Si se detectan dos tickets para la misma falla, el sistema permite fusionarlos. El historial detallará qué ticket (con su ID) fue absorbido por este.
9. **`edited`**: Edición general de campos misceláneos.

Este nivel de detalle alimenta directamente el **Tiempo de Primera Respuesta** y el **Tiempo Promedio de Resolución** visualizado en el Dashboard.
