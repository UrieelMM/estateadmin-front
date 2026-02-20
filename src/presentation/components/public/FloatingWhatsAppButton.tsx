import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const WHATSAPP_NUMBER = "525531139560";
const WHATSAPP_TEXT =
  "Hola, me gustaría recibir información sobre EstateAdmin para administrar mi condominio.";

const FloatingWhatsAppButton = () => {
  const { pathname } = useLocation();
  const [ isAttentionOn, setIsAttentionOn ] = useState( false );

  const isVisible = useMemo( () => {
    const hiddenPrefixes = [
      "/dashboard",
      "/super-admin",
      "/attendance/",
      "/unidentified-payments/",
      "/nuevo-cliente/",
    ];
    const hiddenExact = [ "/login", "/reset-password", "/formulario-completado" ];

    if ( hiddenExact.includes( pathname ) ) return false;
    return !hiddenPrefixes.some( ( prefix ) => pathname.startsWith( prefix ) );
  }, [ pathname ] );

  useEffect( () => {
    if ( !isVisible ) return;
    if ( typeof window === "undefined" ) return;

    const mediaQuery = window.matchMedia( "(prefers-reduced-motion: reduce)" );
    if ( mediaQuery.matches ) return;

    let timeoutId: number | null = null;
    const triggerAttention = () => {
      setIsAttentionOn( true );
      timeoutId = window.setTimeout( () => setIsAttentionOn( false ), 1400 );
    };

    timeoutId = window.setTimeout( triggerAttention, 2000 );
    const intervalId = window.setInterval( triggerAttention, 18000 );

    return () => {
      if ( timeoutId ) window.clearTimeout( timeoutId );
      window.clearInterval( intervalId );
    };
  }, [ isVisible ] );

  if ( !isVisible ) return null;

  const href = `https://wa.me/${ WHATSAPP_NUMBER }?text=${ encodeURIComponent(
    WHATSAPP_TEXT
  ) }`;

  return (
    <a
      href={ href }
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      title="Contactar por WhatsApp"
      className={ `group fixed bottom-5 right-5 z-[70] inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366] ${ isAttentionOn ? "whatsapp-float-attention" : "hover:brightness-105"
        }` }
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 flex-shrink-0"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M20.52 3.48A11.83 11.83 0 0 0 12.06 0C5.55 0 .26 5.28.26 11.8c0 2.08.54 4.11 1.56 5.9L0 24l6.49-1.71a11.8 11.8 0 0 0 5.57 1.42h.01c6.51 0 11.8-5.28 11.8-11.8 0-3.16-1.23-6.13-3.35-8.43ZM12.07 21.7h-.01a9.88 9.88 0 0 1-5.03-1.38l-.36-.21-3.85 1.01 1.03-3.75-.23-.39a9.82 9.82 0 0 1-1.51-5.19c0-5.42 4.42-9.83 9.86-9.83 2.62 0 5.08 1.02 6.93 2.88a9.73 9.73 0 0 1 2.89 6.95c0 5.42-4.42 9.83-9.84 9.83Zm5.39-7.36c-.29-.15-1.72-.85-1.98-.95-.26-.1-.45-.15-.64.15-.19.29-.74.95-.9 1.14-.17.19-.33.22-.62.07-.29-.15-1.2-.44-2.28-1.41-.84-.75-1.41-1.69-1.57-1.98-.17-.29-.02-.45.13-.59.13-.13.29-.33.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.64-1.54-.88-2.11-.23-.56-.47-.49-.64-.5l-.55-.01c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.44 0 1.44 1.03 2.83 1.18 3.03.15.19 2.03 3.11 4.91 4.37.69.3 1.23.48 1.65.62.69.22 1.31.19 1.8.12.55-.08 1.72-.7 1.96-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.34Z" />
      </svg>
      <span className="hidden text-sm font-semibold sm:inline">WhatsApp</span>
    </a>
  );
};

export default FloatingWhatsAppButton;
