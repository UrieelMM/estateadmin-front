export interface MarketingBlock {
  id: string;
  icon: string;
  title: string;
  content: string;
}

export interface MarketingData {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaUrl: string;
  blocks: MarketingBlock[];
}

export const getMarketingTemplate = (data: MarketingData) => {
  const blocks = data.blocks || [];
  const blocksHtml = blocks
    .map(
      (block) => `
          <!-- Feature Card -->
          <div class="card">
            <div class="card-icon">${block.icon}</div>
            <h3 class="card-title">${block.title}</h3>
            <p class="card-text">${block.content}</p>
          </div>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f3f4f6; padding-bottom: 40px; }
    .main-table { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
    .hero { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 50px 30px; text-align: center; position: relative; overflow: hidden; }
    /* Decorative circles */
    .circle { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.1); }
    .circle-1 { width: 150px; height: 150px; top: -50px; left: -50px; }
    .circle-2 { width: 100px; height: 100px; bottom: -20px; right: -20px; }
    
    .hero-title { color: #ffffff; font-size: 32px; font-weight: 800; margin: 0 0 10px; position: relative; z-index: 10; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .hero-subtitle { color: #e0e7ff; font-size: 18px; margin: 0; position: relative; z-index: 10; font-weight: 500; }
    
    .content { padding: 40px 30px; }
    .intro-text { font-size: 16px; line-height: 1.6; color: #4b5563; text-align: center; margin-bottom: 30px; }
    
    .card { background-color: #f9fafb; border-radius: 12px; padding: 25px; margin-bottom: 20px; border: 1px solid #e5e7eb; transition: transform 0.2s; }
    .card-icon { background-color: #e0e7ff; color: #4f46e5; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 15px; }
    .card-title { font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 8px; }
    .card-text { font-size: 14px; color: #6b7280; margin: 0; line-height: 1.5; }
    
    .cta-section { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #f3f4f6; }
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
          <h1 class="hero-title">${data.title}</h1>
          <p class="hero-subtitle">${data.subtitle}</p>
        </td>
      </tr>
      
      <!-- Content -->
      <tr>
        <td class="content">
          <p class="intro-text">
            En <strong>EstateAdmin</strong>, la innovación nunca se detiene. Hemos escuchado tus comentarios y trabajado duro para traerte herramientas que revolucionarán tu gestión diaria.
          </p>
          
          ${blocksHtml}

          <div class="cta-section">
            <a href="${data.ctaUrl}" class="btn">${data.ctaText}</a>
            <p style="margin-top: 15px; font-size: 13px; color: #9ca3af;">* Disponible en tu panel de control a partir de hoy.</p>
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
};
