export const infoTemplate = () => {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EstateAdmin - Gestión Inteligente</title>
    <!--[if mso]>
    <noscript>
    <xml>
    <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
    </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Reset Styles */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        
        /* Custom Styles */
        .wrapper { width: 100%; table-layout: fixed; background-color: #f4f6f9; padding-bottom: 60px; }
        .main-container { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background-color: #0f172a; padding: 30px 40px; text-align: center; }
        .logo-text { color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
        .hero { padding: 40px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #ffffff; text-align: center; }
        .hero-title { font-size: 28px; font-weight: 700; margin: 0 0 15px 0; line-height: 1.3; }
        .hero-subtitle { font-size: 16px; font-weight: 300; opacity: 0.9; margin: 0; line-height: 1.6; }
        .content-block { padding: 40px; }
        .section-title { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 25px 0; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; display: inline-block; }
        .feature-item { padding: 0 0 25px 0; }
        .feature-title { font-size: 16px; font-weight: 700; color: #334155; margin: 0 0 8px 0; }
        .feature-text { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0; }
        .button-container { text-align: center; margin-top: 30px; }
        .cta-button { background-color: #3b82f6; color: #ffffff; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px; display: inline-block; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3); }
        .footer { background-color: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer-text { color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0 0 10px 0; }
        .footer-link { color: #64748b; text-decoration: none; font-size: 12px; margin: 0 10px; }
        
        /* Mobile Responsive */
        @media screen and (max-width: 600px) {
            .main-container { width: 100% !important; }
            .header, .hero, .content-block, .footer { padding: 25px 20px !important; }
            .hero-title { font-size: 24px !important; }
        }
    </style>
</head>
<body>
    <center class="wrapper">
        <table class="main-container" role="presentation" cellspacing="0" cellpadding="0">
            <!-- Header -->
            <tr>
                <td class="header">
                    <span class="logo-text">Estate<span style="color: #3b82f6;">Admin</span></span>
                </td>
            </tr>

            <!-- Hero Section -->
            <tr>
                <td class="hero">
                    <h1 class="hero-title">Gestión de Condominios de Alto Nivel</h1>
                    <p class="hero-subtitle">Optimiza, automatiza y eleva la administración de tu comunidad con la plataforma más avanzada del mercado.</p>
                </td>
            </tr>

            <!-- Main Content -->
            <tr>
                <td class="content-block">
                    <!-- Feature 1: Finance -->
                    <table width="100%" role="presentation" cellspacing="0" cellpadding="0">
                        <tr>
                            <td class="feature-item" valign="top">
                                <table width="100%" role="presentation" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td width="50" valign="top" style="padding-right: 15px;">
                                            <div style="background-color: #eff6ff; width: 40px; height: 40px; border-radius: 8px; text-align: center; line-height: 40px;">
                                                <span style="font-size: 20px;">📊</span>
                                            </div>
                                        </td>
                                        <td>
                                            <h3 class="feature-title">Finanzas Transparentes</h3>
                                            <p class="feature-text">Visualiza ingresos, egresos y balances en tiempo real. Genera reportes automatizados y mantén la contabilidad al día sin esfuerzo.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Feature 2: Operations -->
                        <tr>
                            <td class="feature-item" valign="top">
                                <table width="100%" role="presentation" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td width="50" valign="top" style="padding-right: 15px;">
                                            <div style="background-color: #f0fdf4; width: 40px; height: 40px; border-radius: 8px; text-align: center; line-height: 40px;">
                                                <span style="font-size: 20px;">🛠️</span>
                                            </div>
                                        </td>
                                        <td>
                                            <h3 class="feature-title">Gestión Operativa</h3>
                                            <p class="feature-text">Control total sobre mantenimiento e incidencias. Asigna tickets, monitorea proveedores y asegura que todo funcione perfectamente.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Feature 3: Community -->
                        <tr>
                            <td class="feature-item" style="padding-bottom: 0;" valign="top">
                                <table width="100%" role="presentation" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td width="50" valign="top" style="padding-right: 15px;">
                                            <div style="background-color: #f5f3ff; width: 40px; height: 40px; border-radius: 8px; text-align: center; line-height: 40px;">
                                                <span style="font-size: 20px;">👥</span>
                                            </div>
                                        </td>
                                        <td>
                                            <h3 class="feature-title">Comunidad Conectada</h3>
                                            <p class="feature-text">App exclusiva para residentes. Reservas de amenidades, votaciones en línea, pagos digitales y comunicados importantes al instante.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                    <!-- CTA -->
                    <div class="button-container">
                        <a href="{{system_url}}" class="cta-button">Acceder al Sistema</a>
                    </div>
                </td>
            </tr>

            <!-- Info Footer -->
            <tr>
                <td style="background-color: #f8fafc; padding: 0 40px 30px 40px;">
                    <table width="100%" role="presentation" cellspacing="0" cellpadding="0" style="background-color: #334155; border-radius: 8px; overflow: hidden;">
                        <tr>
                            <td style="padding: 25px; text-align: center;">
                                <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 5px 0; font-weight: 500;">¿Necesitas ayuda?</p>
                                <p style="color: #94a3b8; font-size: 13px; margin: 0;">Nuestro equipo de soporte experto está disponible 24/7 para asistirte.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <!-- Footer -->
            <tr>
                <td class="footer">
                    <p class="footer-text">
                        &copy; ${new Date().getFullYear()} EstateAdmin. Todos los derechos reservados.<br>
                        Innovando la gestión inmobiliaria.
                    </p>
                    <div style="margin-top: 15px;">
                        <a href="#" class="footer-link">Privacidad</a>
                        <span style="color: #cbd5e1;">|</span>
                        <a href="#" class="footer-link">Términos</a>
                        <span style="color: #cbd5e1;">|</span>
                        <a href="#" class="footer-link">Soporte</a>
                    </div>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>`;
};