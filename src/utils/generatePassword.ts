/**
 * Genera una contraseña aleatoria segura de 8 caracteres
 * Incluye letras mayúsculas, minúsculas, números y caracteres especiales
 */
export const generatePassword = (): string => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%&*";
  
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = "";
  
  // Asegurar que tenga al menos un carácter de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Completar los 4 caracteres restantes
  for (let i = 4; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mezclar los caracteres
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};
