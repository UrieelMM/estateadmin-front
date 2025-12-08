export interface CustomData {
  htmlContent: string;
}

export const getCustomTemplate = (data: CustomData) => {
  return data.htmlContent || `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: sans-serif; text-align: center; padding: 50px; color: #333; }
  .container { max-width: 600px; margin: 0 auto; border: 1px dashed #ccc; padding: 20px; border-radius: 8px; }
</style>
</head>
<body>
  <div class="container">
    <h1>Tu HTML Personalizado</h1>
    <p>Pega tu código HTML en el editor para ver el resultado aquí.</p>
  </div>
</body>
</html>
  `;
};
