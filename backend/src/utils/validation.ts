import { TOKEN_LIMITS } from "./tokenLimits";

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  pageContext: string;
  systemPrompt?: string;
  websiteName?: string;        
  availableServices?: string[];
}

export interface ValidationResult{
    isValid:boolean;
    error?:string;
}

export const validateMessage = (msg: any): ValidationResult =>{
    const errors: string[] =[];

    if(!msg || typeof msg !== 'object'){
        errors.push('El mensaje debe ser un objeto');
        return {isValid:false, ...errors};
    }
    //validamos el rol 
    if(!['user', 'assistant', 'system'].includes(msg.role)){
        errors.push(`Role inválido: ${msg.role}. Debe ser 'user', 'assistant' o 'system'`);
    }

    //validamos el contenido 
    if(typeof msg.cotent !== 'string'){
        errors.push('El contenido de tu mensaje debe ser string');
    }else if(msg.content.trim().length===0){
        errors.push('El contenido del mensaje no puede estar vacio');
    }else if(msg.content.length > TOKEN_LIMITS.MAX_MESSAGE_LENGTH){
        errors.push(`El mensaje es demasiado largo ${msg.content.length} caracteres, máximo: ${TOKEN_LIMITS.MAX_MESSAGE_LENGTH}`);
    }

    return {isValid: errors.length ===0, ...errors}
};

export const validateMessages = (messages: any): ValidationResult => {
  const errors: string[] = [];
  
  if (!Array.isArray(messages)) {
    errors.push('Messages debe ser un array');
    return { isValid: false, ...errors };
  }
  
  if (messages.length === 0) {
    errors.push('Messages no puede estar vacío');
    return { isValid: false, ...errors };
  }
  
  if (messages.length > 50) { // Límite razonable de mensajes
    errors.push(`Demasiados mensajes: ${messages.length}, máximo: 50`);
  }
  
  // Validar cada mensaje
  messages.forEach((msg, index) => {
    const msgValidation = validateMessage(msg);
    if (!msgValidation.isValid) {
      errors.push(`Mensaje ${index}: ${msgValidation.error}`);
    }
  });
  
  // Validar que el último mensaje sea del usuario
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.role !== 'user') {
    errors.push('El último mensaje debe ser del usuario');
  }
  
  return { isValid: errors.length === 0, ...errors };
};

export const validatePageContext = (pageContext:any): ValidationResult =>{
    const errors: string[] = [];
  
  if (typeof pageContext !== 'string') {
    errors.push('PageContext debe ser string');
  } else if (pageContext.trim().length === 0) {
    errors.push('PageContext no puede estar vacío');
  } else if (pageContext.length > TOKEN_LIMITS.MAX_CONTEXT_LENGTH) {
    errors.push(`PageContext demasiado largo: ${pageContext.length} caracteres, máximo: ${TOKEN_LIMITS.MAX_CONTEXT_LENGTH}`);
  }
  
  return { isValid: errors.length === 0, ...errors };
};

export const validateSystemPrompt = (systemPrompt: any): ValidationResult => {
  const errors: string[] = [];
  
  if (systemPrompt !== undefined) {
    if (typeof systemPrompt !== 'string') {
      errors.push('SystemPrompt debe ser string');
    } else if (systemPrompt.length > 1000) { // Límite razonable
      errors.push(`SystemPrompt demasiado largo: ${systemPrompt.length} caracteres, máximo: 1000`);
    }
  }
  
  return { isValid: errors.length === 0, ...errors };
};

export const validateChatRequest = (body: any): ValidationResult => {
  const errors: string[] = [];
  
  if (!body || typeof body !== 'object') {
    errors.push('Body debe ser un objeto');
    return { isValid: false, ...errors };
  }
  
  // Validar campos requeridos
  const messagesValidation = validateMessages(body.messages);
  const contextValidation = validatePageContext(body.pageContext);
  const promptValidation = validateSystemPrompt(body.systemPrompt);
  
   if (messagesValidation.error) errors.push(messagesValidation.error);
   if (contextValidation.error) errors.push(contextValidation.error);
   if (promptValidation.error) errors.push(promptValidation.error);
  
  // Validar campos opcionales nuevos
  if (body.websiteName !== undefined) {
    if (typeof body.websiteName !== 'string') {
      errors.push('websiteName debe ser string');
    } else if (body.websiteName.length > 100) {
      errors.push('websiteName demasiado largo');
    }
  }
  
  if (body.availableServices !== undefined) {
    if (!Array.isArray(body.availableServices)) {
      errors.push('availableServices debe ser array');
    } else if (body.availableServices.length > 10) {
      errors.push('Demasiados servicios (máximo 10)');
    } else {
      body.availableServices.forEach((service: any, index: number) => {
        if (typeof service !== 'string') {
          errors.push(`availableServices[${index}] debe ser string`);
        }
      });
    }
  }
  
  return { isValid: errors.length === 0, ...errors };
};