export class Anonymizer {
  static anonymizeText(text: string): string {
    // Remove emails
    text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
    
    // Remove CPF/CNPJ
    text = text.replace(/(\d{3}\.\d{3}\.\d{3}-\d{2})|(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/g, '[DOCUMENTO]');
    
    // Remove telefones
    text = text.replace(/(\(\d{2}\)\s?\d{4,5}-\d{4})|(\d{11})/g, '[TELEFONE]');
    
    // Remove nomes próprios (simplificado)
    const commonNames = [/joão/gi, /maria/gi, /josé/gi, /ana/gi, /pedro/gi];
    commonNames.forEach(name => {
      text = text.replace(name, '[NOME]');
    });
    
    return text;
  }

  static anonymizeHtml(html: string): string {
    return this.anonymizeText(html);
  }
}