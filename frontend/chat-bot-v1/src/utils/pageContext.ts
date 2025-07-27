export interface PageContextData {
  title: string;
  headings: string[];
  metaDescription: string;
  services: string[];
  contactInfo: string[];
}

export const extractPageContext = (): PageContextData => {
  // Título de la página
  const title = document.title || 
    document.querySelector('h1')?.textContent || 
    'Página sin título';

  // Encabezados relevantes
  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    .map(el => el.textContent?.trim())
    .filter(Boolean)
    .slice(0, 10); // Límite razonable

  // Meta descripción
  const metaDescription = 
    document.querySelector('meta[name="description"]')?.getAttribute('content') || 
    document.querySelector('meta[property="og:description"]')?.getAttribute('content') || 
    '';

  // Detectar servicios/productos
  const serviceKeywords = ['servicio', 'producto', 'ofrecemos', 'especialidad'];
  const services = Array.from(document.querySelectorAll('li, p, div'))
    .map(el => el.textContent?.trim())
    .filter(text => text && serviceKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    ))
    .slice(0, 5);

  // Información de contacto
  const contactSelectors = ['[href^="mailto:"]', '[href^="tel:"]', '.contact', '.phone', '.email'];
  const contactInfo = contactSelectors
    .flatMap(selector => Array.from(document.querySelectorAll(selector)))
    .map(el => el.textContent?.trim() || el.getAttribute('href'))
    .filter(Boolean)
    .slice(0, 3);

  return {
    title,
    headings: headings as string[],
    metaDescription,
    services: services as string[],
    contactInfo: contactInfo as string[]
  };
};

export const formatPageContext = (data: PageContextData): string => {
  const parts = [
    `Título: ${data.title}`,
    data.metaDescription && `Descripción: ${data.metaDescription}`,
    data.headings.length > 0 && `Secciones: ${data.headings.join(' | ')}`,
    data.services.length > 0 && `Servicios: ${data.services.join(' | ')}`,
    data.contactInfo.length > 0 && `Contacto: ${data.contactInfo.join(' | ')}`
  ].filter(Boolean);

  return parts.join('\n');
};