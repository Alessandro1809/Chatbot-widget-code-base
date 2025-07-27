export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  OPENAI_API_ERROR = 'OPENAI_API_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export interface ApiError {
  type: ErrorType;
  message: string;
  statusCode: number;
  details?: any;
  retryable: boolean;
}

export const categorizeOpenAIError = (error: any): ApiError => {
  // Error de OpenAI
  if (error.error) {
    const openaiError = error.error;
    
    switch (openaiError.type) {
      case 'invalid_request_error':
        if (openaiError.code === 'context_length_exceeded') {
          return {
            type: ErrorType.VALIDATION_ERROR,
            message: 'La conversación es demasiado larga',
            statusCode: 400,
            details: openaiError.message,
            retryable: false
          };
        }
        return {
          type: ErrorType.VALIDATION_ERROR,
          message: 'Solicitud inválida a OpenAI',
          statusCode: 400,
          details: openaiError.message,
          retryable: false
        };
        
      case 'authentication_error':
        return {
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'Error de autenticación con OpenAI',
          statusCode: 500,
          details: 'API key inválida o expirada',
          retryable: false
        };
        
      case 'rate_limit_error':
        return {
          type: ErrorType.RATE_LIMIT_ERROR,
          message: 'Límite de velocidad excedido',
          statusCode: 429,
          details: openaiError.message,
          retryable: true
        };
        
      case 'insufficient_quota':
        return {
          type: ErrorType.QUOTA_EXCEEDED,
          message: 'Cuota de OpenAI agotada',
          statusCode: 503,
          details: openaiError.message,
          retryable: false
        };
        
      default:
        return {
          type: ErrorType.OPENAI_API_ERROR,
          message: 'Error de la API de OpenAI',
          statusCode: 502,
          details: openaiError.message,
          retryable: true
        };
    }
  }
  
  // Errores de red/conexión
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: 'Error de conexión con OpenAI',
      statusCode: 503,
      details: error.message,
      retryable: true
    };
  }
  
  // Error genérico
  return {
    type: ErrorType.INTERNAL_ERROR,
    message: 'Error interno del servidor',
    statusCode: 500,
    details: error.message,
    retryable: false
  };
};

export const logError = (error: ApiError, context?: any): void => {
  const logData = {
    timestamp: new Date().toISOString(),
    type: error.type,
    message: error.message,
    statusCode: error.statusCode,
    retryable: error.retryable,
    details: error.details,
    context
  };
  
  // En producción, enviarías esto a un servicio de logging
  if (error.statusCode >= 500) {
    console.error('🚨 CRITICAL ERROR:', JSON.stringify(logData, null, 2));
  } else {
    console.warn('⚠️  CLIENT ERROR:', JSON.stringify(logData, null, 2));
  }
};

export const createErrorResponse = (error: ApiError) => {
  // No exponer detalles internos en producción
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    error: error.message,
    type: error.type,
    retryable: error.retryable,
    ...(isProduction ? {} : { details: error.details })
  };
};