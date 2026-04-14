# Landing Page – App de Mantenimiento

## Descripción
Página de presentación pública de la **App de Mantenimiento** de EstateAdmin. Explica en detalle las funcionalidades de la app móvil (React Native / Expo) para el personal de campo.

## Ruta
```
/app-mantenimiento
```

## Archivo principal
```
src/presentation/screens/presentation/MaintenanceAppLanding.tsx
```

## Puntos de acceso
La página es accesible desde tres lugares:

| Ubicación | Tipo | Detalle |
|---|---|---|
| Navbar del HOME (`Hero.tsx`) | Enlace de navegación | "App Mantenimiento" en el array `navigation` |
| Footer (`Footer.tsx`) | Enlace en la lista de páginas | "App Mantenimiento" |
| Sección HOME (entre `MaintenanceTickets` y `DataControl`) | Banner promo | Card gradient con CTA "Conocer la app" |

## Secciones de la página

### 1. Header
- Logo con link al home
- Botón "Volver al inicio"
- Links de sección: Características · ¿Cómo funciona? · Para administradores · Para el personal · Contacto
- Toggle dark/light mode
- CTA "Solicitar demo" → `/contacto`

### 2. Hero
- Badge "App Móvil · iOS & Android"
- H1 con gradiente indigo→purple→pink
- Descripción de propósito
- CTA primario "Solicitar acceso" + secundario "Ver funcionalidades"
- Trust indicators (sincronización, acceso controlado, pensada para campo)
- **Phone mockup** CSS: pantalla simulada con header indigo, stats de tickets, tarjetas de tickets y barra de navegación inferior

### 3. Stats bar
4 métricas clave: 100% trazabilidad · < 2 min crear ticket · iOS & Android · Tiempo real

### 4. Dos perspectivas
Dos cards lado a lado:
- **Administrador** (indigo): Dashboard web — asignar tickets, métricas, inventario, seguimiento
- **Personal de campo** (emerald): App móvil — ver tickets, cambiar estado, inventario, crear reportes

### 5. Features (6 tarjetas)
| Feature | Color | Badge |
|---|---|---|
| Gestión de Tickets | indigo | Core |
| Control de Inventario | emerald | Inventario |
| Reportes desde Campo | blue | Reportes |
| Mantenimiento Programado | purple | Planificación |
| Rendimiento Personal | yellow | Analítica |
| Multi-Condominio | rose | Flexibilidad |

Cada tarjeta incluye: ícono, título, subtítulo, descripción y lista de 4 highlights con check.

### 6. ¿Cómo funciona? (6 pasos)
Flujo completo de un ticket: Crear → Asignar → Recibir → Ejecutar → Cerrar → Analizar

### 7. Beneficios
Lista de 4 beneficios con íconos + grid de 4 cards visuales (Tickets, Inventario, Reportes, Programados).

### 8. FAQ
5 preguntas frecuentes con `<details>` expandibles:
1. ¿Cómo accede el personal al App?
2. ¿El personal puede ver todos los tickets?
3. ¿Se puede usar en múltiples condominios?
4. ¿Los datos se sincronizan automáticamente?
5. ¿Es necesario un costo adicional?

### 9. CTA Final
Banner gradient con botones "Solicitar acceso" y "Ver todo EstateAdmin".

### 10. Footer (compartido)
`Footer.tsx` estándar del sitio.

## SEO
- SEO experiments key: `"maintenance-app"` en `src/presentation/seo/seoExperiments.ts`
- Variante A/B igual que el resto del sitio
- Schemas: `BreadcrumbList`, `MobileApplication`, `FAQPage`
- OG tags, Twitter cards, canonical URL

## Dark mode
Completamente soportado mediante `useLocalDarkMode()` con clases `dark:` de Tailwind.

## Responsive
- Mobile-first con breakpoints sm/lg
- Phone mockup visible solo en `lg:` (desktop)
- Grid de features: 1 col → 2 col (md) → 3 col (xl)
- Banner hero: stack vertical en mobile, side-by-side en desktop

## Dependencias
- `react-helmet-async` (SEO)
- `@headlessui/react` (Dialog menú móvil)
- `@heroicons/react/24/solid` y `/24/outline`
- `react-router-dom` (Link, navegación)
- `useLocalDarkMode` hook interno
