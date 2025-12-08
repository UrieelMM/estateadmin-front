export interface WelcomeData {
  clientName: string;
  dashboardUrl: string;
}

export const getWelcomeTemplate = (data: WelcomeData) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a EstateAdmin</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f3f4f6; padding-bottom: 40px; }
    .main-table { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; font-family: sans-serif; color: #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
    
    /* Homogenized Header */
    .hero { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 50px 30px; text-align: center; position: relative; overflow: hidden; }
    .circle { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.1); }
    .circle-1 { width: 150px; height: 150px; top: -50px; left: -50px; }
    .circle-2 { width: 100px; height: 100px; bottom: -20px; right: -20px; }
    .hero-title { color: #ffffff; font-size: 32px; font-weight: 800; margin: 0 0 10px; position: relative; z-index: 10; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .hero-subtitle { color: #e0e7ff; font-size: 18px; margin: 0; position: relative; z-index: 10; font-weight: 500; }

    .content { padding: 40px 30px; }
    .h1 { font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 20px; }
    .text { font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 20px; }
    
    .feature-list { list-style: none; padding: 0; margin: 25px 0; }
    .feature-item { padding: 12px 0; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; color: #374151; font-weight: 500; }
    .feature-item:last-child { border-bottom: none; }
    .check-icon { color: #4f46e5; margin-right: 10px; font-weight: bold; font-size: 18px; }
    
    .btn-container { text-align: center; margin: 35px 0; }
    .btn { background: linear-gradient(to right, #4f46e5, #4338ca); color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 50px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4); text-transform: uppercase; letter-spacing: 0.5px; }
    
    .footer { background-color: #1f2937; padding: 30px; text-align: center; color: #9ca3af; font-size: 12px; }
    .footer a { color: #d1d5db; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main-table" role="presentation">
      <!-- Hero Section -->
      <tr>
        <td class="hero">
          <div class="circle circle-1"></div>
          <div class="circle circle-2"></div>
          <h1 class="hero-title">¡Bienvenido! 🚀</h1>
          <p class="hero-subtitle">Tu nueva experiencia en administración comienza hoy</p>
        </td>
      </tr>
      
      <!-- Content -->
      <tr>
        <td class="content">
          <p class="text">Hola <strong>${data.clientName}</strong>,</p>
          <p class="text">Estamos muy emocionados de que te hayas unido a <strong>EstateAdmin</strong>. Has dado el primer paso hacia una administración de condominios más inteligente, eficiente y moderna.</p>
          
          <p class="text">Tu cuenta está lista. Aquí tienes algunas de las cosas increíbles que puedes hacer ahora mismo:</p>
          
          <ul class="feature-list">
            <li class="feature-item"><span class="check-icon">✓</span> Gestionar residentes y propietarios</li>
            <li class="feature-item"><span class="check-icon">✓</span> Automatizar cobros y facturación</li>
            <li class="feature-item"><span class="check-icon">✓</span> Controlar accesos y reservas</li>
          </ul>

          <div class="btn-container">
            <a href="${data.dashboardUrl}" class="btn">Acceder a mi Panel</a>
          </div>

          <p class="text">Si tienes alguna duda, nuestro equipo de soporte está disponible 24/7 para ayudarte a configurar tu comunidad.</p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td class="footer">
          <p style="margin-bottom: 10px;"><strong>EstateAdmin</strong> - Simplificando la vida en comunidad</p>
          <p>&copy; ${new Date().getFullYear()} Todos los derechos reservados.</p>
          <p><a href="#">Política de Privacidad</a> | <a href="#">Términos de Uso</a></p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`;
