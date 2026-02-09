/**
 * Contenido de muestra para guías de ejemplo
 */
// Contenido estático para la guía de Mantenimiento
export const MAINTENANCE_GUIDE_CONTENT = `
<article class="prose prose-indigo lg:prose-lg max-w-none">
  <h2>Control de Mantenimiento: guía paso a paso</h2>
  <p>Este módulo centraliza todo el ciclo de mantenimiento: reportes, tickets, visitas, contratos y costos. El objetivo es mantener trazabilidad completa desde la detección del problema hasta el cierre y su reflejo financiero.</p>

  <h3>Antes de empezar</h3>
  <ul>
    <li>Selecciona el condominio correcto en el panel principal.</li>
    <li>Si trabajarás con proveedores recurrentes, registra sus datos para facilitar el control de costos.</li>
    <li>Define un criterio de áreas (Lobby, Jardín, Estacionamiento, etc.) para mantener consistencia en reportes y estadísticas.</li>
  </ul>

  <h3>Flujo recomendado (de punta a punta)</h3>
  <ol>
    <li>Registra un reporte o un ticket para documentar el problema.</li>
    <li>Agenda una visita si requiere inspección o intervención técnica.</li>
    <li>Ejecuta el servicio y registra el costo asociado.</li>
    <li>Actualiza el estado del ticket y cierra el caso.</li>
    <li>Genera reportes PDF para informar avances y gastos.</li>
  </ol>

  <h3>Panel de Control</h3>
  <p>El panel te muestra indicadores clave y gráficas para tomar decisiones rápidas:</p>
  <ul>
    <li>KPIs de reportes, tickets activos, citas, contratos y costos.</li>
    <li>Gráficas por área, estado de tickets y tendencia semanal.</li>
    <li>Generación de reporte PDF por rango de fechas.</li>
  </ul>
  <div class="note p-4 bg-blue-50 rounded-lg my-4">
    <p class="mb-0"><strong>Tip:</strong> Usa rangos de fechas reales (por ejemplo, último mes) para que el PDF sea útil en juntas o reportes al comité.</p>
  </div>

  <h3>Reportes de mantenimiento</h3>
  <ol>
    <li>Entra a <strong>Reportes</strong> y selecciona <strong>Registrar Reporte</strong>.</li>
    <li>Completa <strong>Fecha, Área, Encargado</strong> y el <strong>Detalle</strong>.</li>
    <li>Adjunta evidencia (PDF o imagen) si aplica.</li>
    <li>Filtra por año, mes o área para análisis rápido.</li>
    <li>Usa editar o eliminar para mantener la información limpia.</li>
  </ol>

  <h3>Tickets</h3>
  <p>Los tickets te permiten dar seguimiento granular a problemas y solicitudes.</p>
  <ul>
    <li>Estados principales: <strong>Abierto</strong>, <strong>En Progreso</strong> y <strong>Cerrado</strong>.</li>
    <li>Asigna prioridad, responsable y adjunta evidencia.</li>
    <li>El historial registra cambios de estado, archivos y comentarios.</li>
    <li>Puedes fusionar tickets cuando se trate del mismo incidente.</li>
  </ul>
  <div class="note p-4 bg-blue-50 rounded-lg my-4">
    <p class="mb-0"><strong>Tip:</strong> Antes de cerrar un ticket, asegúrate de registrar el costo si hubo gastos asociados.</p>
  </div>

  <h3>Agenda de Visitas</h3>
  <ul>
    <li>Programa citas desde el calendario o la lista.</li>
    <li>Convierte tickets en visitas con un par de clics.</li>
    <li>Estados disponibles: Programada, En progreso, Completada o Cancelada.</li>
    <li>Relaciona la visita con un contrato o ticket para trazabilidad.</li>
  </ul>

  <h3>Contratos</h3>
  <ul>
    <li>Registra proveedor, tipo de servicio, periodo y valor.</li>
    <li>Adjunta el archivo del contrato (PDF/Word/Imagen).</li>
    <li>Recibe alertas de vencimiento para renovaciones oportunas.</li>
    <li>Desde la tabla puedes <strong>registrar un gasto</strong> directamente con el valor del contrato (editable).</li>
  </ul>

  <h3>Costos</h3>
  <p>Este módulo controla los gastos reales de mantenimiento y los vincula con egresos.</p>
  <ul>
    <li>Registra categoría, monto, fecha, proveedor y estado de pago.</li>
    <li>Relaciona el gasto a ticket, visita o contrato.</li>
    <li>Adjunta la factura o comprobante.</li>
    <li>El gasto se registra automáticamente como egreso financiero.</li>
    <li>Usa filtros por fecha y categoría para análisis rápido.</li>
  </ul>

  <h3>App de Mantenimiento (si está habilitada)</h3>
  <ul>
    <li>Visualiza reportes enviados por el personal en campo.</li>
    <li>Filtra por día, semana o mes.</li>
    <li>Consulta evidencia multimedia (fotos o videos).</li>
  </ul>

  <h3>Buenas prácticas</h3>
  <ul>
    <li>Usa siempre las mismas áreas para evitar estadísticas inconsistentes.</li>
    <li>Relaciona cada gasto con un ticket o contrato cuando sea posible.</li>
    <li>Documenta evidencia antes y después para mayor transparencia.</li>
    <li>Cierra tickets a tiempo para mantener KPIs reales.</li>
  </ul>

  <h3>Problemas comunes</h3>
  <ul>
    <li><strong>No veo un ticket para convertirlo a visita:</strong> solo aparecen tickets Abiertos o En Progreso sin visita.</li>
    <li><strong>No encuentro un costo en egresos:</strong> revisa filtros de fecha o categoría en el módulo financiero.</li>
  </ul>
</article>
`;

export const FINANCIAL_MANAGEMENT_CONTENT = `
<article class="prose prose-indigo lg:prose-lg max-w-none">
  <h2>Gestión Financiera en tu Condominio</h2>
  
  <p>La gestión financiera adecuada es fundamental para el funcionamiento exitoso de cualquier condominio. Este módulo ofrece herramientas completas para mantener un control preciso de ingresos, gastos y presupuestos, asegurando transparencia y eficiencia en la administración.</p>
  
  <h3>Funcionalidades Principales</h3>
  
  <h4>1. Control de Ingresos</h4>
  
  <p>El sistema permite registrar y dar seguimiento a todos los ingresos del condominio:</p>
  
  <ul>
    <li>Cuotas ordinarias de mantenimiento</li>
    <li>Cuotas extraordinarias para proyectos específicos</li>
    <li>Ingresos por rentas de áreas comunes</li>
    <li>Intereses y penalizaciones</li>
  </ul>
  
  <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1080&h=720&auto=format&fit=crop" alt="Control de ingresos" class="rounded-lg shadow-md my-4" />
  
  <h4>2. Gestión de Gastos</h4>
  
  <p>Lleva un registro detallado de todos los gastos:</p>
  
  <ul>
    <li>Categorización por tipo de gasto (mantenimiento, servicios, reparaciones)</li>
    <li>Asignación a áreas específicas del condominio</li>
    <li>Adjunto de facturas y comprobantes digitales</li>
    <li>Seguimiento del estado de cada pago</li>
  </ul>
  
  <pre><code>
  // Ejemplo de estructura de un gasto
  {
    id: "exp-001",
    category: "Mantenimiento",
    subcategory: "Jardinería",
    amount: 1500,
    date: "2023-05-15",
    vendor: "Servicios de Jardinería Verde",
    description: "Mantenimiento mensual de áreas verdes",
    status: "Pagado",
    paymentMethod: "Transferencia bancaria",
    attachments: ["factura_001.pdf"]
  }
  </code></pre>
  
  <h4>3. Presupuestos y Planificación</h4>
  
  <p>Crea y gestiona presupuestos anuales o para proyectos específicos:</p>
  
  <ul>
    <li>Definición de presupuestos por categoría</li>
    <li>Comparativa entre presupuesto planeado vs. ejecutado</li>
    <li>Alertas de desviaciones presupuestarias</li>
    <li>Proyecciones financieras</li>
  </ul>
  
  <h3>Reportes Financieros</h3>
  
  <p>El módulo ofrece diversos informes financieros para mantener informados a todos los interesados:</p>
  
  <ol>
    <li>Balance general de ingresos y gastos</li>
    <li>Estado de cuenta por unidad o propietario</li>
    <li>Reporte de morosidad</li>
    <li>Histórico de gastos por categoría</li>
    <li>Presupuesto vs. gasto real</li>
  </ol>
  
  <blockquote>
    <p>"La transparencia financiera es clave para generar confianza entre los residentes. Con reportes claros y accesibles, todos pueden entender cómo se utilizan los recursos del condominio."</p>
  </blockquote>
  
  <h3>Beneficios</h3>
  
  <ul>
    <li>Mayor transparencia en el manejo de recursos</li>
    <li>Reducción de errores administrativos</li>
    <li>Mejor planificación financiera</li>
    <li>Facilidad para identificar áreas de ahorro</li>
    <li>Documentación completa para auditorías</li>
  </ul>
  
  <h3>Conclusión</h3>
  
  <p>Una gestión financiera eficiente no solo mejora la administración del condominio, sino que también aumenta la confianza de los residentes al saber que sus aportaciones están siendo bien administradas y utilizadas. Este módulo proporciona todas las herramientas necesarias para lograr este objetivo.</p>
</article>
`;

export const COMMUNICATION_CONTENT = `
<article class="prose prose-indigo lg:prose-lg max-w-none">
  <h2>Comunicación Efectiva con Residentes</h2>
  
  <p>La comunicación efectiva entre administradores y residentes es fundamental para el buen funcionamiento de cualquier comunidad. Este módulo ofrece diversas herramientas para mantener informados a todos los miembros del condominio y facilitar la interacción entre ellos.</p>
  
  <h3>Canales de Comunicación</h3>
  
  <h4>1. Anuncios y Notificaciones</h4>
  
  <p>Mantén a todos informados sobre eventos importantes:</p>
  
  <ul>
    <li>Publicación de anuncios en el tablero digital</li>
    <li>Notificaciones push en la aplicación móvil</li>
    <li>Envío de correos electrónicos y SMS para comunicados urgentes</li>
    <li>Programación de notificaciones recurrentes</li>
  </ul>
  
  <img src="https://images.unsplash.com/photo-1577563908411-5077b6dc7624?q=80&w=1080&h=720&auto=format&fit=crop" alt="Tablero de anuncios digital" class="rounded-lg shadow-md my-4" />
  
  <h4>2. Mensajería Interna</h4>
  
  <p>Sistema de mensajería directa dentro de la plataforma:</p>
  
  <ul>
    <li>Comunicación privada entre residentes y administración</li>
    <li>Creación de grupos por temas o áreas del condominio</li>
    <li>Adjunto de archivos e imágenes</li>
    <li>Historial completo de conversaciones</li>
  </ul>
  
  <h4>3. Encuestas y Votaciones</h4>
  
  <p>Involucra a la comunidad en la toma de decisiones:</p>
  
  <ul>
    <li>Creación de encuestas personalizadas</li>
    <li>Sistema de votación para decisiones importantes</li>
    <li>Estadísticas de participación</li>
    <li>Resultados transparentes y verificables</li>
  </ul>
  
  <div class="note p-4 bg-blue-50 rounded-lg my-4">
    <p class="mb-0"><strong>Nota:</strong> Las encuestas pueden configurarse para requerir verificación de identidad, garantizando que solo los propietarios autorizados puedan participar.</p>
  </div>
  
  <h3>Calendario Comunitario</h3>
  
  <p>Un calendario compartido para eventos y actividades:</p>
  
  <ul>
    <li>Eventos sociales y recreativos</li>
    <li>Mantenimientos programados</li>
    <li>Reuniones de comités o del consejo</li>
    <li>Fechas importantes (pagos, asambleas)</li>
  </ul>
  
  <pre><code>
  // Ejemplo de estructura de un evento
  {
    id: "evt-001",
    title: "Asamblea General Anual",
    startDate: "2023-06-15T18:00:00",
    endDate: "2023-06-15T20:00:00",
    location: "Salón de Usos Múltiples",
    description: "Presentación de resultados anuales y elección de nueva directiva",
    organizer: "Consejo de Administración",
    mandatory: true,
    attachments: ["agenda.pdf", "reporte_anual.pdf"]
  }
  </code></pre>
  
  <h3>Biblioteca de Documentos</h3>
  
  <p>Repositorio central para todos los documentos importantes:</p>
  
  <ol>
    <li>Reglamentos y estatutos</li>
    <li>Manuales de usuario para instalaciones</li>
    <li>Actas de asambleas</li>
    <li>Informes financieros</li>
    <li>Directorio de contactos importantes</li>
  </ol>
  
  <h3>Consejos para una Comunicación Efectiva</h3>
  
  <ul>
    <li>Establece un cronograma regular de comunicaciones</li>
    <li>Sé claro y conciso en todos los mensajes</li>
    <li>Utiliza el canal adecuado según la urgencia e importancia</li>
    <li>Responde oportunamente a todas las consultas</li>
    <li>Solicita retroalimentación sobre la efectividad de la comunicación</li>
  </ul>
  
  <blockquote>
    <p>"La comunicación no es solo lo que dices, sino también cómo, cuándo y dónde lo dices. Una estrategia de comunicación bien planificada previene conflictos y fortalece el sentido de comunidad."</p>
  </blockquote>
  
  <h3>Conclusión</h3>
  
  <p>Una comunicación efectiva construye comunidades más unidas y colaborativas. Este módulo proporciona todas las herramientas necesarias para mantener informados a los residentes, fomentar la participación y crear un ambiente de transparencia y confianza.</p>
</article>
`;

export const RESERVATION_SYSTEM_CONTENT = `
<article class="prose prose-indigo lg:prose-lg max-w-none">
  <h2>Sistema de Reserva de Áreas Comunes</h2>
  
  <p>Las áreas comunes son uno de los principales atractivos de vivir en un condominio. Este módulo permite gestionar eficientemente su reserva y uso, evitando conflictos y asegurando que todos los residentes puedan disfrutar de estas instalaciones de manera ordenada.</p>
  
  <h3>Características Principales</h3>
  
  <h4>1. Catálogo de Áreas Reservables</h4>
  
  <p>Administra todas las áreas que pueden ser reservadas:</p>
  
  <ul>
    <li>Salones de eventos y fiestas</li>
    <li>Instalaciones deportivas (canchas, gimnasio, alberca)</li>
    <li>Áreas de BBQ y picnic</li>
    <li>Salas de juntas y espacios de trabajo compartido</li>
  </ul>
  
  <img src="https://images.unsplash.com/photo-1591123120675-6f7f1aae0e5b?q=80&w=1080&h=720&auto=format&fit=crop" alt="Área de BBQ reservable" class="rounded-lg shadow-md my-4" />
  
  <h4>2. Sistema de Reservaciones</h4>
  
  <p>Proceso intuitivo para reservar espacios:</p>
  
  <ol>
    <li>Selección de área deseada</li>
    <li>Visualización de disponibilidad en calendario</li>
    <li>Selección de fecha y horario</li>
    <li>Indicación del tipo de evento y número de asistentes</li>
    <li>Aceptación de reglamento de uso</li>
    <li>Pago de tarifas cuando aplique</li>
  </ol>
  
  <pre><code>
  // Ejemplo de estructura de una reservación
  {
    id: "res-001",
    area: "Salón de Fiestas",
    userId: "u-78912",
    userName: "Ana Martínez",
    apartmentUnit: "Torre A, Apto 502",
    date: "2023-07-22",
    startTime: "16:00",
    endTime: "22:00",
    eventType: "Cumpleaños",
    attendees: 25,
    status: "Confirmada",
    paymentStatus: "Pagado",
    depositRequired: true,
    depositAmount: 1000,
    depositReturned: false
  }
  </code></pre>
  
  <div class="warning p-4 bg-red-50 rounded-lg my-4">
    <p class="mb-0"><strong>Importante:</strong> Las reservaciones están sujetas a los horarios y reglas establecidos en el reglamento interno. El incumplimiento puede resultar en sanciones.</p>
  </div>
  
  <h4>3. Políticas y Reglas</h4>
  
  <p>Configuración personalizada de políticas:</p>
  
  <ul>
    <li>Horarios disponibles para cada área</li>
    <li>Tiempos máximos de reserva</li>
    <li>Período de anticipación para reservas</li>
    <li>Costos y depósitos</li>
    <li>Reglas específicas por área</li>
    <li>Restricciones y cuotas por unidad</li>
  </ul>
  
  <h4>4. Gestión de Pagos y Depósitos</h4>
  
  <p>Control financiero de las reservaciones:</p>
  
  <ul>
    <li>Cobro de tarifas por uso</li>
    <li>Gestión de depósitos reembolsables</li>
    <li>Multas por cancelaciones tardías</li>
    <li>Cargos por limpieza o daños</li>
    <li>Integración con el módulo financiero</li>
  </ul>
  
  <h3>Beneficios del Sistema</h3>
  
  <ol>
    <li>Eliminación de conflictos por doble reservación</li>
    <li>Transparencia en la disponibilidad de áreas</li>
    <li>Reducción de carga administrativa</li>
    <li>Mejor control del uso de instalaciones</li>
    <li>Generación de ingresos adicionales para el condominio</li>
  </ol>
  
  <blockquote>
    <p>"Un buen sistema de reservas no solo organiza el uso de áreas comunes, sino que también fomenta la convivencia armónica al establecer reglas claras y equitativas para todos los residentes."</p>
  </blockquote>
  
  <h3>Recomendaciones para Administradores</h3>
  
  <ul>
    <li>Revisar y actualizar periódicamente las políticas de reserva</li>
    <li>Establecer procedimientos claros para la entrega y recepción de áreas</li>
    <li>Realizar inspecciones después de cada uso</li>
    <li>Recopilar retroalimentación de los usuarios para mejorar el servicio</li>
    <li>Comunicar efectivamente cualquier cambio en las políticas</li>
  </ul>
  
  <h3>Conclusión</h3>
  
  <p>El sistema de reservas de áreas comunes optimiza el aprovechamiento de estos espacios, mejorando la experiencia de los residentes y reduciendo la carga administrativa. Con reglas claras y procesos automatizados, todos pueden disfrutar de las instalaciones del condominio de manera ordenada y equitativa.</p>
</article>
`;

export const INVENTORY_MANAGEMENT_CONTENT = `
<article class="prose prose-indigo lg:prose-lg max-w-none">
  <h2>Inventario: guía práctica para administradores</h2>
  <p>Este módulo te ayuda a controlar materiales, herramientas y equipos del condominio. Permite saber qué hay, dónde está, cuánto queda y quién lo usa.</p>

  <h3>Antes de empezar</h3>
  <ul>
    <li>Crea al menos una categoría de inventario.</li>
    <li>Define ubicaciones estándar (Bodega, Cuarto de máquinas, Oficina, etc.).</li>
  </ul>

  <h3>Secciones principales</h3>
  <ul>
    <li><strong>Inventario:</strong> lista de ítems y operaciones de stock.</li>
    <li><strong>Categorías:</strong> clasificación por tipo de material o uso.</li>
    <li><strong>Movimientos:</strong> historial de entradas, salidas y cambios.</li>
    <li><strong>Alertas:</strong> ítems con stock bajo.</li>
  </ul>

  <h3>Registrar un ítem</h3>
  <ol>
    <li>Entra a <strong>Inventario</strong> y selecciona <strong>Añadir ítem</strong>.</li>
    <li>Completa nombre, tipo, categoría y estado.</li>
    <li>Indica stock inicial, stock mínimo y ubicación.</li>
    <li>Agrega precio, proveedor, notas o imágenes si aplica.</li>
  </ol>
  <div class="note p-4 bg-blue-50 rounded-lg my-4">
    <p class="mb-0"><strong>Tip:</strong> usa el stock mínimo para recibir alertas automáticas y evitar faltantes en mantenimiento.</p>
  </div>

  <h3>Operaciones de stock</h3>
  <ul>
    <li><strong>Agregar stock:</strong> registra entradas por compras o reposición.</li>
    <li><strong>Consumir stock:</strong> descuenta materiales usados en tareas.</li>
    <li><strong>Transferir:</strong> mueve un ítem a otra ubicación.</li>
    <li><strong>Cambiar estado:</strong> activo, inactivo, en mantenimiento o descontinuado.</li>
  </ul>
  <p>Cada operación genera un movimiento con fecha, usuario y notas.</p>

  <h3>Movimientos (historial)</h3>
  <p>En la sección de movimientos puedes revisar:</p>
  <ul>
    <li>Quién realizó cada acción.</li>
    <li>Cantidad anterior y nueva.</li>
    <li>Cambios de ubicación o estado.</li>
  </ul>

  <h3>Alertas de stock bajo</h3>
  <p>Los ítems con stock igual o menor al mínimo aparecen en <strong>Alertas</strong> para que el administrador reponga a tiempo.</p>

  <h3>Buenas prácticas</h3>
  <ul>
    <li>Usa categorías y ubicaciones consistentes.</li>
    <li>Registra consumos reales para mantener el inventario actualizado.</li>
    <li>Revisa alertas al menos una vez por semana.</li>
    <li>Adjunta imágenes a herramientas clave para identificación rápida.</li>
  </ul>
</article>
`;

export const INCOMES_AND_EXPENSES_CONTENT = `
<article class="prose prose-indigo lg:prose-lg max-w-none">
  <h2>Ingresos y Egresos: control financiero completo</h2>
  <p>Este módulo concentra todo el flujo financiero del condominio: ingresos, pagos, egresos, reportes y balance general. Está diseñado para asegurar trazabilidad, transparencia y control real de los fondos.</p>

  <h3>Antes de empezar</h3>
  <ul>
    <li>Configura cuentas financieras (bancos o cajas) para registrar pagos y gastos.</li>
    <li>Define conceptos y categorías de egresos para reportes claros.</li>
    <li>Si aplicarás cargos, crea primero los cargos correspondientes a los condominos.</li>
  </ul>

  <h3>Ingresos y pagos</h3>
  <p>Accede a <strong>Ingresos y Pagos</strong> para registrar y analizar cobros.</p>
  <ol>
    <li>Selecciona <strong>Registrar pago</strong>.</li>
    <li>Elige el condómino y los cargos a cubrir.</li>
    <li>Indica monto pagado, fecha, método de pago y cuenta financiera.</li>
    <li>Adjunta comprobante si aplica.</li>
  </ol>
  <ul>
    <li><strong>Resumen general:</strong> vista consolidada de ingresos.</li>
    <li><strong>Resumen por cuenta:</strong> compara el desempeño por cuenta bancaria o caja.</li>
    <li><strong>Historial por condómino:</strong> detalle de pagos individuales.</li>
    <li><strong>Morosidad:</strong> identifica unidades con pagos pendientes.</li>
    <li><strong>Pagos no identificados:</strong> administra depósitos sin referencia.</li>
  </ul>

  <h3>Egresos</h3>
  <p>En la sección <strong>Egresos</strong> puedes registrar y analizar gastos.</p>
  <ol>
    <li>Presiona <strong>Registrar Gasto</strong>.</li>
    <li>Selecciona el concepto, monto, fecha y cuenta.</li>
    <li>Adjunta comprobante o factura.</li>
    <li>Relaciona proveedor si aplica para reportes por proveedor.</li>
  </ol>
  <ul>
    <li><strong>Resumen general:</strong> vista por categorías y montos.</li>
    <li><strong>Historial:</strong> detalle completo de registros.</li>
    <li><strong>Egresos por proveedor:</strong> análisis por proveedor.</li>
  </ul>
  <div class="note p-4 bg-blue-50 rounded-lg my-4">
    <p class="mb-0"><strong>Nota:</strong> Los costos de mantenimiento registrados en su módulo se reflejan automáticamente como egresos.</p>
  </div>

  <h3>Balance general</h3>
  <p>En <strong>Balance</strong> puedes comparar ingresos y egresos en un solo lugar para evaluar la salud financiera del condominio.</p>

  <h3>Recibos y facturas</h3>
  <p>Descarga recibos y comprobantes cuando necesites respaldos para auditoría o comunicación con propietarios.</p>

  <h3>Buenas prácticas</h3>
  <ul>
    <li>Registra todos los movimientos con comprobante cuando sea posible.</li>
    <li>Revisa morosidad de forma mensual para mantener flujo de caja.</li>
    <li>Usa proveedores y categorías consistentes para reportes confiables.</li>
    <li>Conciliar ingresos vs egresos antes de cierres de mes.</li>
  </ul>
</article>
`;

export const PROJECTS_MANAGEMENT_CONTENT = `
<article class="prose prose-indigo lg:prose-lg max-w-none">
  <h2>Gestión de Proyectos: guía completa</h2>
  <p>Este módulo permite planear, ejecutar y documentar proyectos del condominio, desde remodelaciones pequeñas hasta obras mayores. Incluye presupuesto, tareas, cotizaciones y reportes.</p>

  <h3>Crear un proyecto</h3>
  <ol>
    <li>Entra a <strong>Gestión de Proyectos</strong> y selecciona <strong>Nuevo proyecto</strong>.</li>
    <li>Completa nombre, descripción, fechas y presupuesto inicial.</li>
    <li>Guarda para activar el tablero del proyecto.</li>
  </ol>

  <h3>Dashboard del proyecto</h3>
  <ul>
    <li>Resumen de presupuesto inicial, presupuesto restante y porcentaje usado.</li>
    <li>Tiempo transcurrido y días restantes.</li>
    <li>Gráficas de presupuesto y distribución de gastos.</li>
  </ul>

  <h3>Registrar gastos del proyecto</h3>
  <ol>
    <li>Presiona <strong>Registrar Gasto</strong> dentro del proyecto.</li>
    <li>Captura monto, categoría y notas.</li>
    <li>El gasto se descuenta del presupuesto disponible.</li>
  </ol>

  <h3>Gestión de tareas (Kanban)</h3>
  <p>Organiza el trabajo con columnas de estado:</p>
  <ul>
    <li>Planifica tareas y asigna responsables.</li>
    <li>Mueve las tarjetas conforme avanza el proyecto.</li>
    <li>Usa el tablero para reuniones de seguimiento.</li>
  </ul>

  <h3>Cotizaciones</h3>
  <ul>
    <li>Registra hasta 5 cotizaciones por proyecto.</li>
    <li>Compara proveedores antes de autorizar el gasto.</li>
    <li>Guarda evidencia de la selección.</li>
  </ul>

  <h3>Exportación y reporte</h3>
  <p>Puedes exportar el proyecto para presentar avances y costos al comité o propietarios.</p>

  <h3>Cierre del proyecto</h3>
  <ul>
    <li>Marca el proyecto como finalizado cuando se completen tareas y gastos.</li>
    <li>Si el proyecto se cancela, actualiza su estado para mantener histórico claro.</li>
  </ul>

  <h3>Buenas prácticas</h3>
  <ul>
    <li>Actualiza el estado del proyecto con cada avance importante.</li>
    <li>Registra todos los gastos para mantener presupuesto real.</li>
    <li>Documenta cotizaciones y decisiones para transparencia.</li>
  </ul>
</article>
`;

// Información de muestra para las 3 guías adicionales
