/**
 * Contenido de muestra para guías de ejemplo
 */
// Contenido estático para la guía de Mantenimiento
export const MAINTENANCE_GUIDE_CONTENT = `
<article class="prose prose-indigo lg:prose-lg max-w-none">
  <h2>Módulo de Mantenimiento: Guía Completa</h2>
  
  <p>El módulo de mantenimiento permite a los administradores gestionar de manera eficiente todas las actividades de mantenimiento preventivo y correctivo dentro del condominio, asegurando el buen estado de las instalaciones comunes y mejorando la calidad de vida de los residentes.</p>
  
  <h3>Objetivos del Módulo</h3>
  
  <ul>
    <li>Planificar y programar actividades de mantenimiento de manera sistemática</li>
    <li>Realizar seguimiento de solicitudes de reparación de los residentes</li>
    <li>Gestionar proveedores de servicios de mantenimiento</li>
    <li>Mantener un registro histórico de todas las intervenciones</li>
    <li>Optimizar los recursos económicos destinados al mantenimiento</li>
  </ul>
  
  <h3>Funciones Principales</h3>
  
  <h4>1. Programación de Mantenimientos</h4>
  <p>La interfaz de programación permite establecer calendarios de mantenimiento preventivo para diferentes áreas e instalaciones del condominio:</p>
  
  <pre><code>
  // Ejemplo de estructura de un mantenimiento programado
  {
    id: "mant-001",
    area: "Piscina",
    title: "Limpieza y tratamiento químico",
    frequency: "weekly",
    assignedTo: "Servicio de Mantenimiento ABC",
    estimatedCost: 2500,
    description: "Limpieza completa y balance químico del agua"
  }
  </code></pre>
  
  <h4>2. Gestión de Solicitudes</h4>
  <p>Los residentes pueden enviar solicitudes de reparación o mantenimiento a través de la aplicación, adjuntando descripciones y fotografías del problema. Los administradores pueden:</p>
  
  <ul>
    <li>Clasificar las solicitudes por prioridad (alta, media, baja)</li>
    <li>Asignar responsables internos o externos</li>
    <li>Establecer fechas límite de resolución</li>
    <li>Notificar a los residentes sobre el avance</li>
  </ul>
  
  <h4>3. Seguimiento de Proveedores</h4>
  <p>El sistema permite mantener una base de datos de proveedores de servicios con evaluaciones de desempeño, facilitando la selección para futuros mantenimientos.</p>
  
  <h3>Pasos para Utilizar el Módulo</h3>
  
  <ol>
    <li>
      <strong>Acceso al módulo:</strong> Desde el panel de navegación principal, seleccione "Mantenimiento".
      <img src="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=1080&h=720&auto=format&fit=crop" alt="Panel de Mantenimiento" class="rounded-lg shadow-md my-4" />
    </li>
    <li>
      <strong>Crear un nuevo mantenimiento programado:</strong> Haga clic en "Nuevo Mantenimiento" y complete el formulario con la información requerida.
    </li>
    <li>
      <strong>Visualizar calendario:</strong> Utilice la vista de calendario para tener una perspectiva clara de todos los mantenimientos programados.
    </li>
    <li>
      <strong>Generar reportes:</strong> Acceda a la sección de reportes para obtener estadísticas sobre los mantenimientos realizados, costos acumulados y tiempo de respuesta.
    </li>
  </ol>
  
  <h3>Mejores Prácticas</h3>
  
  <ul>
    <li>Programe los mantenimientos preventivos con suficiente antelación</li>
    <li>Establezca prioridades claras para las solicitudes urgentes</li>
    <li>Mantenga comunicación constante con los residentes sobre el estado de sus solicitudes</li>
    <li>Documente adecuadamente todas las intervenciones, incluyendo fotografías de antes y después</li>
    <li>Realice evaluaciones periódicas de los proveedores de servicios</li>
  </ul>
  
  <h3>Conclusión</h3>
  
  <p>Una gestión eficiente del mantenimiento no solo preserva el valor de la propiedad, sino que también mejora significativamente la satisfacción de los residentes. Este módulo proporciona todas las herramientas necesarias para lograrlo de manera organizada y transparente.</p>
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
          <h2>Sistema de Gestión de Inventario</h2>
          
          <p>El módulo de inventario permite gestionar eficientemente todos los recursos físicos del condominio, desde materiales de mantenimiento hasta herramientas y equipos, asegurando un control adecuado y transparencia en su uso.</p>
          
          <h3>Características Principales</h3>
          
          <ul>
            <li>Registro detallado de todos los activos e insumos</li>
            <li>Control de stock con alertas de niveles bajos</li>
            <li>Seguimiento del uso y asignación de herramientas</li>
            <li>Historial completo de movimientos</li>
            <li>Reportes de inventario y valoración de activos</li>
          </ul>
          
          <h3>Beneficios</h3>
          
          <ol>
            <li>Prevención de pérdidas y extravíos</li>
            <li>Optimización de recursos y compras</li>
            <li>Mayor eficiencia en tareas de mantenimiento</li>
            <li>Transparencia en la administración</li>
            <li>Reducción de costos operativos</li>
          </ol>
          
          <blockquote>
            <p>"Un sistema de inventario bien administrado no solo protege los activos del condominio, sino que también optimiza los recursos disponibles y mejora la eficiencia del personal."</p>
          </blockquote>
          
          <p>Estamos trabajando para ofrecerte contenido más detallado sobre esta característica. ¡Vuelve pronto para más información!</p>
        </article>
`;

export const INCOMES_AND_EXPENSES_CONTENT = `
<article class="prose prose-indigo lg:prose-lg max-w-none">
          <h2>Control de Ingresos y Egresos</h2>
          
          <p>El módulo de Ingresos y Egresos proporciona un sistema completo para el registro, seguimiento y análisis de todos los movimientos financieros del condominio, asegurando una gestión transparente y eficiente de los recursos económicos.</p>
          
          <h3>Funcionalidades Principales</h3>
          
          <h4>1. Registro de Ingresos</h4>
          
          <p>Permite registrar y categorizar todos los ingresos del condominio:</p>
          
          <ul>
            <li>Cuotas de mantenimiento regulares</li>
            <li>Cuotas extraordinarias para proyectos específicos</li>
            <li>Ingresos por renta de espacios comunes</li>
            <li>Donaciones y otros ingresos</li>
          </ul>
          
          <img src="https://images.unsplash.com/photo-1554224155-1696413565d3?q=80&w=1080&h=720&auto=format&fit=crop" alt="Análisis financiero" class="rounded-lg shadow-md my-4" />
          
          <h4>2. Control de Egresos</h4>
          
          <p>Gestión detallada de todos los gastos, con capacidades para:</p>
          
          <ul>
            <li>Clasificación por categorías (servicios, mantenimiento, administrativos)</li>
            <li>Asignación a proyectos o áreas específicas</li>
            <li>Validación y aprobación de gastos por niveles</li>
            <li>Adjuntar facturas y comprobantes digitales</li>
          </ul>
          
          <h4>3. Informes Financieros</h4>
          
          <p>Generación de reportes detallados para análisis y toma de decisiones:</p>
          
          <ul>
            <li>Balance general de ingresos y egresos</li>
            <li>Reportes por categoría y período</li>
            <li>Comparativos entre períodos</li>
            <li>Proyecciones de flujo de caja</li>
          </ul>
          
          <pre><code>
// Ejemplo de estructura de un reporte financiero
{
  periodo: "Enero 2023",
  ingresos: {
    cuotasRegulares: 150000,
    cuotasExtraordinarias: 25000,
    rentaEspacios: 5000,
    otros: 2500,
    total: 182500
  },
  egresos: {
    serviciosBasicos: 28000,
    mantenimiento: 45000,
    seguridadVigilancia: 35000,
    administrativos: 20000,
    otros: 5000,
    total: 133000
  },
  saldo: 49500,
  saldoAcumulado: 186500
}
          </code></pre>
          
          <h3>Beneficios del Sistema</h3>
          
          <ol>
            <li>Mayor transparencia en el manejo de los recursos</li>
            <li>Reducción de errores en el registro contable</li>
            <li>Detección temprana de desviaciones presupuestarias</li>
            <li>Facilidad para auditorías internas y externas</li>
            <li>Mejor planificación financiera a largo plazo</li>
          </ol>
          
          <blockquote>
            <p>"La salud financiera de un condominio depende directamente de la precisión y transparencia con que se gestionan sus ingresos y egresos. Este sistema proporciona las herramientas necesarias para mantener un control riguroso sobre cada peso que entra y sale."</p>
          </blockquote>
          
          <h3>Integración con Otros Módulos</h3>
          
          <p>El módulo de Ingresos y Egresos se integra perfectamente con otros componentes del sistema:</p>
          
          <ul>
            <li><strong>Módulo de Cobranza:</strong> Seguimiento automático de pagos recibidos</li>
            <li><strong>Módulo de Presupuestos:</strong> Comparativa entre lo planificado y lo ejecutado</li>
            <li><strong>Módulo de Proyectos:</strong> Asignación de gastos a proyectos específicos</li>
            <li><strong>Módulo de Reportes:</strong> Generación de informes para propietarios</li>
          </ul>
          
          <h3>Conclusión</h3>
          
          <p>Una gestión financiera transparente y eficiente es fundamental para mantener la confianza de los propietarios y asegurar la estabilidad económica del condominio. Este módulo proporciona todas las herramientas necesarias para lograrlo, simplificando la complejidad inherente al manejo de las finanzas comunitarias.</p>
        </article>
`;

export const PROJECTS_MANAGEMENT_CONTENT = `
<article class="prose prose-indigo lg:prose-lg max-w-none">
          <h2>Gestión de Proyectos</h2>
          
          <p>El módulo de Gestión de Proyectos permite planificar, ejecutar y dar seguimiento a todas las iniciativas de mejora, renovación o nueva implementación dentro del condominio, desde pequeñas reparaciones hasta grandes obras de infraestructura.</p>
          
          <h3>Características Principales</h3>
          
          <h4>1. Planificación de Proyectos</h4>
          
          <p>Herramientas completas para la definición y planificación:</p>
          
          <ul>
            <li>Definición de objetivos, alcance y entregables</li>
            <li>Establecimiento de cronogramas y plazos</li>
            <li>Asignación de responsables por tarea</li>
            <li>Presupuestación detallada</li>
            <li>Identificación de riesgos potenciales</li>
          </ul>
          
          <img src="https://images.unsplash.com/photo-1507207611509-ec012433ff52?q=80&w=1080&h=720&auto=format&fit=crop" alt="Diagrama de Gantt de proyecto" class="rounded-lg shadow-md my-4" />
          
          <h4>2. Seguimiento de Ejecución</h4>
          
          <p>Monitoreo en tiempo real del avance de los proyectos:</p>
          
          <ul>
            <li>Actualización de estado de tareas</li>
            <li>Registro de horas y recursos utilizados</li>
            <li>Seguimiento del gasto vs. presupuesto</li>
            <li>Gestión de cambios y desviaciones</li>
            <li>Documentación de avances con fotografías</li>
          </ul>
          
          <div class="note p-4 bg-blue-50 rounded-lg my-4">
            <p class="mb-0"><strong>Nota:</strong> La documentación fotográfica del antes, durante y después es esencial para mantener informados a los propietarios sobre el avance de los proyectos.</p>
          </div>
          
          <h4>3. Gestión de Proveedores</h4>
          
          <p>Administración eficiente de los proveedores involucrados:</p>
          
          <ul>
            <li>Registro de cotizaciones comparativas</li>
            <li>Generación de órdenes de compra y contratos</li>
            <li>Seguimiento de entregas y plazos</li>
            <li>Evaluación de desempeño</li>
            <li>Historial de relaciones comerciales</li>
          </ul>
          
          <h4>4. Comunicación y Transparencia</h4>
          
          <p>Herramientas para mantener informados a todos los interesados:</p>
          
          <ol>
            <li>Tablero de proyectos visible para residentes</li>
            <li>Notificaciones automáticas de avances importantes</li>
            <li>Repositorio de documentación accesible</li>
            <li>Foros de discusión para retroalimentación</li>
            <li>Encuestas de satisfacción tras la finalización</li>
          </ol>
          
          <pre><code>
// Ejemplo de estructura de un proyecto
{
  id: "PROJ-2023-05",
  nombre: "Renovación de Áreas Verdes",
  fechaInicio: "2023-05-10",
  fechaFinPrevista: "2023-07-30",
  estado: "En ejecución",
  presupuestoAprobado: 125000,
  gastoActual: 82500,
  avanceFisico: 65, // porcentaje
  responsablePrincipal: "Comité de Paisajismo",
  proveedorPrincipal: "Jardines Modernos SA",
  fases: [
    {
      nombre: "Diseño paisajístico",
      estado: "Completado",
      avance: 100
    },
    {
      nombre: "Preparación del terreno",
      estado: "Completado",
      avance: 100
    },
    {
      nombre: "Instalación de sistema de riego",
      estado: "En progreso",
      avance: 80
    },
    {
      nombre: "Plantación",
      estado: "Iniciado",
      avance: 35
    },
    {
      nombre: "Instalación de iluminación",
      estado: "Pendiente",
      avance: 0
    }
  ]
}
          </code></pre>
          
          <h3>Beneficios</h3>
          
          <ul>
            <li>Mayor control sobre tiempos y costos de ejecución</li>
            <li>Reducción de imprevistos y mejor gestión de riesgos</li>
            <li>Transparencia en el uso de fondos comunes</li>
            <li>Documentación completa para referencia futura</li>
            <li>Participación informada de la comunidad</li>
          </ul>
          
          <blockquote>
            <p>"Un proyecto bien gestionado genera confianza en la administración y aumenta la satisfacción de los residentes, quienes pueden ver cómo sus contribuciones se transforman en mejoras tangibles para la comunidad."</p>
          </blockquote>
          
          <h3>Conclusión</h3>
          
          <p>La gestión profesional de proyectos es clave para optimizar recursos y asegurar resultados de calidad en todas las iniciativas del condominio. Este módulo proporciona un marco estructurado que guía cada proyecto desde su concepción hasta su conclusión exitosa, documentando cada paso para mantener la transparencia y permitir el aprendizaje continuo.</p>
        </article>
`;

// Información de muestra para las 3 guías adicionales
