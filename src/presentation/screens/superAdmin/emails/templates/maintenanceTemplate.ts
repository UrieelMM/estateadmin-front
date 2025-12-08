export interface MaintenanceData {
  date: string;
  timeRange: string;
  duration: string;
  status: string;
}

export const getMaintenanceTemplate = (data: MaintenanceData) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aviso de Mantenimiento</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f3f4f6; padding-bottom: 40px; }
    .main-table { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
    
    /* Homogenized Header */
    .hero { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 50px 30px; text-align: center; position: relative; overflow: hidden; }
    .circle { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.1); }
    .circle-1 { width: 150px; height: 150px; top: -50px; left: -50px; }
    .circle-2 { width: 100px; height: 100px; bottom: -20px; right: -20px; }
    .hero-title { color: #ffffff; font-size: 32px; font-weight: 800; margin: 0 0 10px; position: relative; z-index: 10; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .hero-subtitle { color: #e0e7ff; font-size: 18px; margin: 0; position: relative; z-index: 10; font-weight: 500; }
    
    .content { padding: 40px 30px; }
    .message { font-size: 16px; color: #4b5563; text-align: center; line-height: 1.6; margin-bottom: 30px; }
    
    .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 600; color: #64748b; }
    .info-value { font-weight: 600; color: #334155; text-align: right; }
    
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; background-color: #fef3c7; color: #d97706; }
    
    .btn { background: linear-gradient(to right, #4f46e5, #4338ca); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4); }
    
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
          <h1 class="hero-title">Mantenimiento 🛠️</h1>
          <p class="hero-subtitle">Actualización programada del sistema</p>
        </td>
      </tr>
      
      <!-- Content -->
      <tr>
        <td class="content">
          <p class="message">
            Para garantizar el mejor rendimiento y seguridad de nuestra plataforma, realizaremos una actualización programada de nuestros sistemas.
          </p>
          
          <div class="info-box">
            <div class="info-row">
              <span class="info-label">Estado</span>
              <span class="info-value"><span class="status-badge">${data.status}</span></span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha</span>
              <span class="info-value">${data.date}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Horario</span>
              <span class="info-value">${data.timeRange}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Duración</span>
              <span class="info-value">${data.duration}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Impacto</span>
              <span class="info-value">Servicio no disponible</span>
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="#" class="btn">Ver estado del sistema</a>
          </div>
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
