export const extractWebsiteName = (context: string): string | undefined => {
  const match = context.match(/(?:título|title):\s*([^\n]+)/i);
  return match ? match[1].trim() : undefined;
};

export const extractServices = (context: string): string[] => {
  const serviceKeywords = ['servicios', 'services', 'productos', 'products'];
  const lines = context.toLowerCase().split('\n');
  
  return lines
    .filter(line => serviceKeywords.some(keyword => line.includes(keyword)))
    .slice(0, 5); // máximo 5 servicios
};