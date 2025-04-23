import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import logo from "../../../assets/logo.png";

const DataDeletion = () => {
  return (
    <div className="bg-white min-h-screen">
      <Helmet>
        <title>Guía para Eliminación de Datos - EstateAdmin</title>
        <meta
          name="description"
          content="Guía para solicitar la eliminación de datos personales en EstateAdmin"
        />
      </Helmet>

      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img className="h-10 w-auto" src={logo} alt="EstateAdmin Logo" />
            <span className="ml-3 text-xl font-bold text-indigo-600">
              EstateAdmin
            </span>
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Guía para la Eliminación de Datos
            </h1>
            <div className="prose prose-indigo max-w-none">
              <p className="text-gray-600">
                Última actualización: 1 de Noviembre de 2023
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-4">
                1. Su derecho a la eliminación de datos
              </h2>
              <p>
                En EstateAdmin, respetamos su derecho a controlar sus datos
                personales. Esta guía explica cómo puede solicitar la
                eliminación de sus datos personales de nuestra plataforma
                conforme a las leyes de protección de datos aplicables, incluida
                la Ley Federal de Protección de Datos Personales en Posesión de
                los Particulares de México.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-4">
                2. Qué datos podemos eliminar
              </h2>
              <p>
                A solicitud, podemos eliminar la mayoría de los datos personales
                que recopilamos sobre usted, incluidos:
              </p>
              <ul className="list-disc ml-6 mt-2 mb-4">
                <li>Información de perfil y cuenta</li>
                <li>Datos de contacto</li>
                <li>Registros de comunicaciones</li>
                <li>Preferencias de usuario</li>
                <li>Historial de uso de la plataforma</li>
              </ul>
              <p>
                <strong>Nota importante:</strong> Algunos datos pueden no ser
                eliminados completamente por las siguientes razones:
              </p>
              <ul className="list-disc ml-6 mt-2 mb-4">
                <li>
                  <strong>Obligaciones legales:</strong> Podemos estar obligados
                  a conservar cierta información para cumplir con requisitos
                  legales o regulatorios (ej. registros financieros o fiscales).
                </li>
                <li>
                  <strong>Administración del condominio:</strong> Si usted es
                  propietario de una unidad, cierta información básica puede
                  necesitar ser conservada para la administración adecuada del
                  condominio.
                </li>
                <li>
                  <strong>Intereses legítimos:</strong> Podemos conservar datos
                  limitados para protegernos contra reclamaciones legales.
                </li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-4">
                3. Proceso de solicitud de eliminación
              </h2>
              <p>
                Para solicitar la eliminación de sus datos, tiene varias
                opciones:
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">
                A. Desde su cuenta
              </h3>
              <p>
                Si tiene una cuenta activa, puede iniciar el proceso de
                eliminación siguiendo estos pasos:
              </p>
              <ol className="list-decimal ml-6 mt-2 mb-4">
                <li>Inicie sesión en su cuenta de EstateAdmin</li>
                <li>Vaya a "Configuración" → "Privacidad y Datos"</li>
                <li>Seleccione "Solicitar eliminación de cuenta y datos"</li>
                <li>Siga las instrucciones para confirmar su solicitud</li>
              </ol>

              <h3 className="text-lg font-medium mt-4 mb-2">
                B. Por correo electrónico
              </h3>
              <p>
                Envíe un correo electrónico a{" "}
                <strong>privacidad@estate-admin.com</strong> con el asunto
                "Solicitud de eliminación de datos". En su correo, incluya:
              </p>
              <ul className="list-disc ml-6 mt-2 mb-4">
                <li>Su nombre completo</li>
                <li>La dirección de correo electrónico asociada a su cuenta</li>
                <li>
                  Información de identificación (número de unidad o propiedad,
                  condominio, etc.)
                </li>
                <li>
                  Una declaración clara solicitando la eliminación de sus datos
                  personales
                </li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">C. Por escrito</h3>
              <p>
                Puede enviar una solicitud por escrito a nuestra dirección
                física:
              </p>
              <p className="ml-6 mt-2 mb-4">
                EstateAdmin - Departamento de Privacidad
                <br />
                43815 Guerreo Tizayuca Hidalgo
                <br />
                México
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-4">
                4. Verificación de identidad
              </h2>
              <p>
                Para proteger la privacidad y seguridad de su información,
                necesitamos verificar su identidad antes de procesar su
                solicitud de eliminación. Podemos solicitar documentación
                adicional, como:
              </p>
              <ul className="list-disc ml-6 mt-2 mb-4">
                <li>Copia de una identificación oficial con fotografía</li>
                <li>
                  Comprobante de residencia o propiedad en el condominio (si
                  corresponde)
                </li>
                <li>
                  Verificación por correo electrónico (a través de un enlace de
                  confirmación)
                </li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-4">
                5. Plazos de respuesta
              </h2>
              <p>
                Una vez que recibamos su solicitud y verifiquemos su identidad:
              </p>
              <ul className="list-disc ml-6 mt-2 mb-4">
                <li>
                  Confirmaremos la recepción de su solicitud dentro de los 3
                  días hábiles
                </li>
                <li>Procesaremos su solicitud dentro de los 20 días hábiles</li>
                <li>
                  Le enviaremos una confirmación cuando la eliminación se haya
                  completado
                </li>
              </ul>
              <p>
                Si no podemos cumplir con su solicitud dentro de este plazo, le
                informaremos el motivo del retraso y le proporcionaremos una
                nueva fecha estimada.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-4">
                6. Después de la eliminación
              </h2>
              <p>Una vez que hayamos procesado su solicitud de eliminación:</p>
              <ul className="list-disc ml-6 mt-2 mb-4">
                <li>
                  Su cuenta será desactivada y no podrá acceder a los servicios
                  de EstateAdmin
                </li>
                <li>
                  Sus datos personales serán eliminados o anonimizados, excepto
                  aquellos que debamos conservar por razones legales
                </li>
                <li>
                  Solicitaremos a nuestros proveedores de servicios que también
                  eliminen sus datos, cuando corresponda
                </li>
              </ul>
              <p>
                <strong>Nota:</strong> La eliminación es permanente y no se
                puede deshacer. Si desea utilizar nuestros servicios nuevamente
                en el futuro, deberá crear una nueva cuenta.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-4">
                7. Contáctenos
              </h2>
              <p>
                Si tiene preguntas sobre el proceso de eliminación de datos o
                necesita ayuda adicional, póngase en contacto con nuestro
                Oficial de Protección de Datos:
              </p>
              <ul className="list-none ml-6 mt-2 mb-4">
                <li>
                  <strong>Email:</strong> privacidad@estate-admin.com
                </li>
                <li>
                  <strong>Teléfono:</strong> +52 771 195 3837
                </li>
                <li>
                  <strong>Dirección:</strong> 43815 Guerreo Tizayuca Hidalgo,
                  México
                </li>
              </ul>

              <div className="border-t border-gray-200 pt-6 mt-8">
                <p>
                  Para obtener más información sobre cómo manejamos sus datos
                  personales, consulte nuestra{" "}
                  <Link
                    to="/privacy"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    Política de Privacidad
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} EstateAdmin. Todos los derechos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DataDeletion;
