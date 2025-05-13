/**
 * Contenido de muestra para guías de ejemplo
 */

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

// Información de muestra para las 3 guías adicionales
export const SAMPLE_GUIDES = [
  {
    title: "Gestión Financiera en tu Condominio",
    slug: "gestion-financiera-condominio",
    subtitle: "Optimiza el manejo de recursos y mantén la transparencia",
    excerpt:
      "Descubre cómo aprovechar todas las herramientas financieras para una administración eficiente y transparente de los recursos del condominio.",
    imageUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=385&h=385&auto=format&fit=crop",
    content: FINANCIAL_MANAGEMENT_CONTENT,
    author: "María González",
    categories: ["Finanzas", "Administración", "Contabilidad"],
    tags: ["presupuesto", "ingresos", "gastos", "reportes", "transparencia"],
  },
  {
    title: "Comunicación Efectiva con Residentes",
    slug: "comunicacion-efectiva-residentes",
    subtitle: "Estrategias para mantener informada a toda la comunidad",
    excerpt:
      "Implementa canales efectivos de comunicación para mantener a todos los residentes informados y fomentar la participación comunitaria.",
    imageUrl:
      "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?q=80&w=385&h=385&auto=format&fit=crop",
    content: COMMUNICATION_CONTENT,
    author: "Carlos Ramírez",
    categories: ["Comunicación", "Comunidad", "Gestión"],
    tags: [
      "anuncios",
      "notificaciones",
      "encuestas",
      "reuniones",
      "participación",
    ],
  },
  {
    title: "Sistema de Reserva de Áreas Comunes",
    slug: "reserva-areas-comunes",
    subtitle: "Maximiza el uso ordenado de instalaciones compartidas",
    excerpt:
      "Organiza de manera eficiente el uso de áreas comunes mediante un sistema de reservas que evita conflictos y mejora la experiencia de los residentes.",
    imageUrl:
      "https://images.unsplash.com/photo-1591123120675-6f7f1aae0e5b?q=80&w=385&h=385&auto=format&fit=crop",
    content: RESERVATION_SYSTEM_CONTENT,
    author: "Laura Méndez",
    categories: ["Amenidades", "Reservaciones", "Organización"],
    tags: [
      "áreas comunes",
      "reservas",
      "eventos",
      "calendario",
      "instalaciones",
    ],
  },
];
