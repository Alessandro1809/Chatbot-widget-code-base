const CHARS_PER_TOKEN= 4;

export const TOKEN_LIMITS ={
    MAX_INPUT_TOKENS: 8000,
    MAX_OUTPUT_TOKENS: 8000,
    MAX_MESSAGE_LENGTH: 2500, //caracteres para el mensaje individual
    MAX_CONTEXT_LENGTH: 8000, //caracteres para el pageContext recibido
} as const;

export const estimatedTokens =( text:string):number => Math.ceil(text.length / CHARS_PER_TOKEN);

export const  truncateToTokenLimit =(
    text:string,
    maxTokens: number
):string =>{

    const maxChars = maxTokens * CHARS_PER_TOKEN;
    if (text.length <= maxChars) text;

    return text.substring(0, maxChars - 3) + '...';

}

export const validateTokenLimits = (
    messages:any[],
    pageContext:string,
    systemPrompt?:string
):{isValid:boolean; error?:string; estimatedTokens:number} =>{
    // estimar tokens del contexto y prompt del sistema
    const systemContent = systemPrompt 
    ? `Contexto de la página: ${pageContext}\n\n${systemPrompt}`
    : pageContext;

    const systemTokens =estimatedTokens(systemContent);

    //estimar los tokens de todos los mensajes
    const messageTokens = messages.reduce((total, msg)=>{
        return total + estimatedTokens(msg.content);
    },0);

    const totalTokens = systemTokens + messageTokens;

    if(totalTokens > TOKEN_LIMITS.MAX_INPUT_TOKENS){
        return {
            isValid:false,
            error:`Conversación demasiado larga. Tokens estimados: ${totalTokens}, máximo: ${TOKEN_LIMITS.MAX_INPUT_TOKENS}`,
            estimatedTokens:totalTokens
        }
    };

    return {
        isValid:true,
        estimatedTokens:totalTokens
    }

}
