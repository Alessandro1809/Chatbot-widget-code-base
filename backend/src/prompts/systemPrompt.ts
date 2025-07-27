import { TemplateEngine, TemplateVariables } from '../utils/templateEngine';

export const SYSTEM_PROMPT_TEMPLATE = `Eres un asistente virtual inteligente embebido como widget de chatbot.

CONTEXTO DE PÁGINA: {{pageContext}}

{{#if websiteName}}
SITIO WEB: {{websiteName}}
{{/if}}

{{#if availableServices}}
SERVICIOS DISPONIBLES:
{{#each availableServices}}
- {{this}}
{{/each}}
{{/if}}

MISIÓN:
- Interactuar de forma profesional y cercana
- Usar el contexto de la página para respuestas precisas
- Generar valor según el contenido donde estás embebido

ESTILO:
- Profesional, claro y cercano
- Párrafos cortos (1-2 oraciones)
- Usa viñetas para listar opciones
- Cierra con pregunta abierta
{{#if maxEmojis}}
- Máximo {{maxEmojis}} emojis por mensaje
{{/if}}

RESTRICCIONES:
- NO respondas fuera del contexto de la página
- NO reveles que eres un modelo de IA
- NO ofrezcas consejos médicos/legales/financieros especializados
{{#if maxResponseLines}}
- Respuestas máximo {{maxResponseLines}} líneas
{{/if}}

USO DEL CONTEXTO:
- Menciona secciones relevantes: "Según la sección 'Servicios'..."
- Si falta información, solicita datos concretos`;

export interface PromptConfig {
  pageContext: string;
  websiteName?: string;
  availableServices?: string[];
  maxEmojis?: number;
  maxResponseLines?: number;
  customPrompt?: string;
}

export const buildSystemPrompt = (config: PromptConfig): string => {
  if (config.customPrompt) {
    return `Contexto de la página: ${config.pageContext}\n\n${config.customPrompt}`;
  }

  const variables: TemplateVariables = {
    pageContext: config.pageContext,
    websiteName: config.websiteName || '',
    availableServices: config.availableServices || [],
    maxEmojis: config.maxEmojis || 2,
    maxResponseLines: config.maxResponseLines || 6
  };

  return TemplateEngine.render(SYSTEM_PROMPT_TEMPLATE, variables);
};

// Validar template al inicializar
const templateValidation = TemplateEngine.validate(SYSTEM_PROMPT_TEMPLATE);
if (!templateValidation.isValid) {
  console.error('❌ Template de prompt inválido:', templateValidation.errors);
  process.exit(1);
}