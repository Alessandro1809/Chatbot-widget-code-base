import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { buildSystemPrompt } from './prompts/systemPrompt';
import { validateTokenLimits, TOKEN_LIMITS, truncateToTokenLimit } from './utils/tokenLimits';
import { validateChatRequest } from './utils/validation';
import { categorizeOpenAIError, logError, createErrorResponse } from './utils/errorHandling';
import { extractWebsiteName, extractServices } from './utils/helpers';
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


// Validate message format for OpenAI API
const validateMessages = (messages: any[]) => {
  if (!Array.isArray(messages)) return false;
  
  return messages.every(msg => {
    return (
      msg && 
      typeof msg === 'object' &&
      ['user', 'assistant', 'system'].includes(msg.role) &&
      typeof msg.content === 'string'
    );
  });
};

// En tu servidor Express
app.post('/api/chat', async (req, res) => {
  const validation = validateChatRequest(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({ 
      error: 'Datos de entrada inválidos',
      details: validation.error,
      type: 'VALIDATION_ERROR',
      retryable: false
    });
  }
  
  // Extraer datos adicionales del body si existen
  const { 
    messages, 
    pageContext, 
    systemPrompt,
    websiteName,      
    availableServices 
  } = req.body;
  
  const tokenValidation = validateTokenLimits(messages, pageContext, systemPrompt);
  if (!tokenValidation.isValid) {
    return res.status(400).json({ 
      error: tokenValidation.error,
      estimatedTokens: tokenValidation.estimatedTokens,
      type: 'VALIDATION_ERROR',
      retryable: false
    });
  }
  
  try {
    const truncatedPageContext = truncateToTokenLimit(
      pageContext, 
      TOKEN_LIMITS.MAX_CONTEXT_LENGTH / 4
    );
    
    // Usar el template engine con los datos adicionales
    const formattedMessages = [
      { 
        role: 'system', 
        content: buildSystemPrompt({
          pageContext: truncatedPageContext,
          customPrompt: systemPrompt,
          websiteName,
          availableServices
        })
      },
      ...messages
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: formattedMessages,
      max_tokens: TOKEN_LIMITS.MAX_OUTPUT_TOKENS,
    });

    res.json({ reply: completion.choices[0].message.content });
    
  } catch (error) {
    const apiError = categorizeOpenAIError(error);
    
    logError(apiError, {
      messagesCount: messages.length,
      pageContextLength: pageContext.length,
      hasSystemPrompt: !!systemPrompt,
      estimatedTokens: tokenValidation.estimatedTokens
    });
    
    res.status(apiError.statusCode).json(createErrorResponse(apiError));
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));