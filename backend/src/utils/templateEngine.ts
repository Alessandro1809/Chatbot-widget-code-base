export interface TemplateVariables {
  [key: string]: string | number | boolean | string[];
}

export class TemplateEngine {
  private static readonly VARIABLE_REGEX = /\{\{(\w+)\}\}/g;
  private static readonly CONDITIONAL_REGEX = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  private static readonly LOOP_REGEX = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

  static render(template: string, variables: TemplateVariables): string {
    let result = template;

    // 1. Procesar condicionales {{#if variable}}content{{/if}}
    result = this.processConditionals(result, variables);

    // 2. Procesar loops {{#each array}}content{{/each}}
    result = this.processLoops(result, variables);

    // 3. Reemplazar variables simples {{variable}}
    result = this.processVariables(result, variables);

    return result.trim();
  }

  private static processConditionals(template: string, variables: TemplateVariables): string {
    return template.replace(this.CONDITIONAL_REGEX, (match, varName, content) => {
      const value = variables[varName];
      const shouldShow = Boolean(value) && (Array.isArray(value) ? value.length > 0 : true);
      return shouldShow ? content : '';
    });
  }

  private static processLoops(template: string, variables: TemplateVariables): string {
    return template.replace(this.LOOP_REGEX, (match, varName, content) => {
      const array = variables[varName];
      if (!Array.isArray(array)) return '';
      
      return array.map(item => 
        content.replace(/\{\{this\}\}/g, String(item))
      ).join('');
    });
  }

  private static processVariables(template: string, variables: TemplateVariables): string {
    return template.replace(this.VARIABLE_REGEX, (match, varName) => {
      const value = variables[varName];
      return value !== undefined ? String(value) : match;
    });
  }

  static validate(template: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Verificar que los condicionales estén balanceados
    const ifMatches = (template.match(/\{\{#if/g) || []).length;
    const endifMatches = (template.match(/\{\{\/if\}\}/g) || []).length;
    if (ifMatches !== endifMatches) {
      errors.push(`Condicionales desbalanceados: ${ifMatches} #if vs ${endifMatches} /if`);
    }

    // Verificar que los loops estén balanceados
    const eachMatches = (template.match(/\{\{#each/g) || []).length;
    const endeachMatches = (template.match(/\{\{\/each\}\}/g) || []).length;
    if (eachMatches !== endeachMatches) {
      errors.push(`Loops desbalanceados: ${eachMatches} #each vs ${endeachMatches} /each`);
    }

    return { isValid: errors.length === 0, errors };
  }
}