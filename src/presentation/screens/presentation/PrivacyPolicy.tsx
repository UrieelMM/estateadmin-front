import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import logo from "../../../assets/logo.png";

const PrivacyPolicy = () => {
  return (
    <div className="bg-white min-h-screen">
      <Helmet>
        <title>Política de Privacidad - EstateAdmin</title>
        <meta
          name="description"
          content="Política de privacidad de EstateAdmin, plataforma de gestión de condominios"
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
              Política de Privacidad
            </h1>
            <div className="prose prose-indigo max-w-none">
              <p className="text-gray-600">
                Última actualización: 1 de Noviembre de 2023
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-4">
                1. Introducción
              </h2>
              <p>
                En EstateAdmin, nos comprometemos a proteger la privacidad y
                seguridad de la información personal de nuestros usuarios. Esta
                política de privacidad describe cómo recopilamos, utilizamos,
                compartimos y protegemos la información personal de los usuarios
                de nuestra plataforma de gestión de condominios.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-4">
                2. Información que recopilamos
              </h2>
              <p>Recopilamos los siguientes tipos de información:</p>
              <ul className="list-disc ml-6 mt-2 mb-4">
                <li>
                  <strong>Información de registro:</strong> Cuando crea una
                  cuenta, recopilamos su nombre, dirección de correo
                  electrónico, número de teléfono, dirección física y datos de
                  la propiedad.
                </li>
                <li>
                  <strong>Información financiera:</strong> Para procesar pagos,
                  podemos recopilar información de facturación, como detalles de
                  métodos de pago y registros de transacciones.
                </li>
                <li>
                  <strong>Comunicaciones:</strong> Registramos las
                  comunicaciones que tienen lugar a través de nuestra
                  plataforma, como solicitudes de mantenimiento, comunicados y
                  mensajes entre residentes y administradores.
                </li>
                <li>
                  <strong>Información de uso:</strong> Recopilamos datos sobre
                  cómo interactúa con nuestra plataforma, como páginas
                  visitadas, funciones utilizadas y tiempo de uso.
                </li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-4">
                3. Cómo utilizamos su información
              </h2>
              <p>Utilizamos su información personal para:</p>
              <ul className="list-disc ml-6 mt-2 mb-4">
                <li>
                  Proporcionar y mejorar nuestros servicios de gestión de
                  condominios
                </li>
                <li>Procesar pagos de cuotas, reservas y otros servicios</li>
                <li>
                  Facilitar la comunicación entre administradores y residentes
                </li>
                <li>
                  Enviar notificaciones importantes sobre su propiedad o la
                  administración del condominio
                </li>
                <li>
                  Enviar actualizaciones sobre nuestros servicios o políticas
                </li>
                <li>
                  Prevenir actividades fraudulentas o ilegales en nuestra
                  plataforma
                </li>
                <li>Cumplir con obligaciones legales y reglamentarias</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-4">
                4. Compartición de datos
              </h2>
              <p>
                Podemos compartir su información personal con las siguientes
                partes:
              </p>
              <ul className="list-disc ml-6 mt-2 mb-4">
                <li>
                  <strong>Administradores del condominio:</strong> Para
                  gestionar eficientemente el condominio, la información
                  relacionada con su propiedad y pagos.
                </li>
                <li>
                  <strong>Proveedores de servicios:</strong> Colaboramos con
                  terceros que nos ayudan a operar nuestra plataforma y
                  proporcionar servicios (procesadores de pago, servicios en la
                  nube, etc.).
                </li>
                <li>
                  <strong>Autoridades legales:</strong> Cuando sea requerido por
                  ley o en respuesta a solicitudes legales válidas.
                </li>
              </ul>
              <p>
                No vendemos ni alquilamos su información personal a terceros con
                fines de marketing.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-4">
                5. Seguridad de datos
              </h2>
              <p>
                Implementamos medidas técnicas y organizativas apropiadas para
                proteger su información personal contra el acceso no autorizado,
                la divulgación o la destrucción. Estas medidas incluyen
                encriptación de datos, acceso limitado a la información por
                parte de nuestro personal y revisiones regulares de nuestras
                prácticas de seguridad de la información.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-4">
                6. Sus derechos
              </h2>
              <p>
                Según las leyes de protección de datos aplicables, puede tener
                los siguientes derechos:
              </p>
              <ul className="list-disc ml-6 mt-2 mb-4">
                <li>Acceder a su información personal</li>
                <li>Corregir datos inexactos</li>
                <li>Eliminar su información personal</li>
                <li>Objetar o limitar el procesamiento de sus datos</li>
                <li>Portar su información a otro servicio</li>
                <li>Retirar el consentimiento en cualquier momento</li>
              </ul>
              <p>
                Para ejercer estos derechos, póngase en contacto con nosotros a
                través de los datos proporcionados en la sección "Contáctenos".
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-4">
                7. Conservación de datos
              </h2>
              <p>
                Conservamos su información personal mientras mantenga una cuenta
                activa en nuestra plataforma o según sea necesario para
                proporcionar nuestros servicios. También podemos conservar
                información para cumplir con obligaciones legales, resolver
                disputas y hacer cumplir nuestros acuerdos. Cuando ya no
                necesitemos su información personal, la eliminaremos o
                anonimizaremos de forma segura.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-4">
                8. Cambios a esta política
              </h2>
              <p>
                Podemos actualizar esta política de privacidad periódicamente
                para reflejar cambios en nuestras prácticas de información o
                requisitos legales. Le notificaremos cualquier cambio
                significativo a través de nuestra plataforma o por correo
                electrónico.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-4">
                9. Contáctenos
              </h2>
              <p>
                Si tiene preguntas o inquietudes sobre esta política de
                privacidad o nuestras prácticas de datos, comuníquese con
                nuestro Oficial de Protección de Datos:
              </p>
              <ul className="list-none ml-6 mt-2 mb-4">
                <li>
                  <strong>Email:</strong> privacidad@estate-admin.com
                </li>
                <li>
                  <strong>Dirección:</strong> 43815 Guerreo Tizayuca Hidalgo,
                  México
                </li>
              </ul>

              <div className="border-t border-gray-200 pt-6 mt-8">
                <p>
                  Para más información sobre cómo eliminar sus datos personales,
                  consulte nuestra{" "}
                  <Link
                    to="/data-deletion"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    Guía para la Eliminación de Datos
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

export default PrivacyPolicy;
