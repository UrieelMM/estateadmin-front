import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useNewsAndGuidesStore } from "../../../../store/useNewsAndGuidesStore";
import moment from "moment";
import "moment/locale/es";
import { Helmet } from "react-helmet-async";
import "./GuidePage.css";
import NotFoundPage from "../../../screens/NotFoundPage/NotFoundPage";
import Sidebar from "./Sidebar";
import {
  FINANCIAL_MANAGEMENT_CONTENT,
  COMMUNICATION_CONTENT,
  RESERVATION_SYSTEM_CONTENT,
} from "../shared/sampleContents";

// Contenido estático para la guía de Mantenimiento
const MAINTENANCE_GUIDE_CONTENT = `
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

// Componente para la página detallada de una guía
const GuidePage: React.FC = () => {
  // Obtener el slug de la URL
  const { slug } = useParams<{ slug: string }>();

  // Obtener datos de la guía
  const {
    currentGuide,
    relatedGuides,
    loading,
    error,
    getGuideBySlug,
    getRelatedGuides,
  } = useNewsAndGuidesStore();

  useEffect(() => {
    if (slug) {
      // Cargar la guía específica
      const loadGuide = async () => {
        const guide = await getGuideBySlug(slug);
        if (guide) {
          // Cargar guías relacionadas
          await getRelatedGuides(guide.id, guide.categories?.[0]);
        }
      };

      loadGuide();
    }

    // Configurar moment en español
    moment.locale("es");
  }, [slug, getGuideBySlug, getRelatedGuides]);

  // Mostrar indicador de carga
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="animate-pulse text-indigo-600">Cargando guía...</div>
      </div>
    );
  }

  // Si hay error o no se encuentra la guía, mostrar NotFoundPage
  if (error || !currentGuide) {
    return <NotFoundPage />;
  }

  // Formatear la fecha
  const formattedDate = currentGuide.createdAt
    ? moment(currentGuide.createdAt.toDate()).format("LL")
    : "";

  // Seleccionar el contenido estático adecuado según el slug
  const getStaticContent = () => {
    // Comprobar por slug o parte de la URL
    const guideSlug = currentGuide.slug || "";
    const guideUrl = currentGuide.url || "";

    // Guía de Mantenimiento
    if (
      guideSlug === "modulo-de-mantenimiento" ||
      slug === "modulo-de-mantenimiento" ||
      guideUrl.includes("modulo-de-mantenimiento")
    ) {
      return MAINTENANCE_GUIDE_CONTENT;
    }

    // Guía de Gestión Financiera
    if (
      guideSlug === "gestion-financiera-condominio" ||
      slug === "gestion-financiera-condominio" ||
      guideUrl.includes("gestion-financiera-condominio")
    ) {
      return FINANCIAL_MANAGEMENT_CONTENT;
    }

    // Guía de Comunicación
    if (
      guideSlug === "comunicacion-efectiva-residentes" ||
      slug === "comunicacion-efectiva-residentes" ||
      guideUrl.includes("comunicacion-efectiva-residentes")
    ) {
      return COMMUNICATION_CONTENT;
    }

    // Guía de Reservas
    if (
      guideSlug === "reserva-areas-comunes" ||
      slug === "reserva-areas-comunes" ||
      guideUrl.includes("reserva-areas-comunes")
    ) {
      return RESERVATION_SYSTEM_CONTENT;
    }

    // Guía de Inventario (stub)
    if (
      guideSlug === "inventario" ||
      slug === "inventario" ||
      guideUrl.includes("/guias/inventario")
    ) {
      return `
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
    }

    // Guía de Ingresos y Egresos
    if (
      guideSlug === "ingresos-y-egresos" ||
      slug === "ingresos-y-egresos" ||
      guideUrl.includes("ingresos-y-egresos")
    ) {
      return `
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
    }

    // Guía de Proyectos
    if (
      guideSlug === "proyectos" ||
      slug === "proyectos" ||
      guideUrl.includes("/guias/proyectos")
    ) {
      return `
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
    }

    // Si no hay un contenido estático específico, usar el contenido dinámico o mensaje por defecto
    return (
      currentGuide.content ||
      "<p>No hay contenido disponible para esta guía.</p>"
    );
  };

  // Obtener el contenido adecuado
  const guideContent = getStaticContent();

  return (
    <>
      {/* SEO */}
      <Helmet>
        <title>{currentGuide.title} | Guías y Tutoriales</title>
        <meta
          name="description"
          content={currentGuide.excerpt || currentGuide.subtitle}
        />
        {/* Open Graph */}
        <meta property="og:title" content={currentGuide.title} />
        <meta
          property="og:description"
          content={currentGuide.excerpt || currentGuide.subtitle}
        />
        <meta property="og:image" content={currentGuide.imageUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={currentGuide.title} />
        <meta
          name="twitter:description"
          content={currentGuide.excerpt || currentGuide.subtitle}
        />
        <meta name="twitter:image" content={currentGuide.imageUrl} />
        {/* Metadatos adicionales para SEO */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={window.location.href} />
        {currentGuide.tags && currentGuide.tags.length > 0 && (
          <meta name="keywords" content={currentGuide.tags.join(", ")} />
        )}
        {/* Schema.org structured data para Article */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: currentGuide.title,
            description: currentGuide.excerpt || currentGuide.subtitle,
            image: currentGuide.imageUrl,
            author: {
              "@type": "Person",
              name: currentGuide.author,
            },
            publisher: {
              "@type": "Organization",
              name: "Estate Admin",
              logo: {
                "@type": "ImageObject",
                url: `${window.location.origin}/logo.png`,
              },
            },
            datePublished: currentGuide.createdAt
              ? currentGuide.createdAt.toDate().toISOString()
              : new Date().toISOString(),
            dateModified: currentGuide.createdAt
              ? currentGuide.createdAt.toDate().toISOString()
              : new Date().toISOString(),
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": window.location.href,
            },
            articleSection:
              currentGuide.categories && currentGuide.categories.length > 0
                ? currentGuide.categories[0]
                : "Guía",
            keywords: currentGuide.tags ? currentGuide.tags.join(",") : "",
          })}
        </script>
      </Helmet>

      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2">
              <li>
                <Link to="/" className="text-gray-500 hover:text-indigo-600">
                  Inicio
                </Link>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-gray-400">/</span>
                <Link
                  to="/guias"
                  className="text-gray-500 hover:text-indigo-600"
                >
                  Guías
                </Link>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-gray-400">/</span>
                <span className="text-gray-700">{currentGuide.title}</span>
              </li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contenido principal */}
            <main className="lg:col-span-2">
              <article className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Imagen principal */}
                <div className="relative">
                  <img
                    src={currentGuide.imageUrl}
                    alt={currentGuide.title}
                    className="w-full h-64 md:h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>

                <div className="p-6 md:p-8">
                  {/* Categorías */}
                  {currentGuide.categories &&
                    currentGuide.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {currentGuide.categories.map((category) => (
                          <Link
                            key={category}
                            to={`/guias?category=${encodeURIComponent(
                              category
                            )}`}
                            className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm hover:bg-indigo-200"
                          >
                            {category}
                          </Link>
                        ))}
                      </div>
                    )}

                  {/* Título y metadata */}
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    {currentGuide.title}
                  </h1>

                  <div className="flex items-center text-gray-500 text-sm mb-6">
                    <span>{formattedDate}</span>
                    <span className="mx-2">•</span>
                    <span>Por {currentGuide.author}</span>
                  </div>

                  {/* Extracto */}
                  {currentGuide.excerpt && (
                    <div className="text-lg text-gray-700 mb-8 font-medium border-l-4 border-indigo-500 pl-4 italic">
                      {currentGuide.excerpt}
                    </div>
                  )}

                  {/* Contenido */}
                  <div
                    className="guide-content"
                    dangerouslySetInnerHTML={{ __html: guideContent }}
                  />

                  {/* Tags */}
                  {currentGuide.tags && currentGuide.tags.length > 0 && (
                    <div className="mt-8 pt-6 border-t">
                      <h3 className="text-sm font-medium text-gray-500 mb-3">
                        Etiquetas:
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {currentGuide.tags.map((tag) => (
                          <Link
                            key={tag}
                            to={`/guias?tag=${encodeURIComponent(tag)}`}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            </main>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Sidebar
                relatedGuides={relatedGuides}
                categories={currentGuide.categories}
                tags={currentGuide.tags}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GuidePage;
