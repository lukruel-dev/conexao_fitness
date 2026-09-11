/**
 * Validador rigoroso de segurança e anti-desintermediação para Finex (Chat & Biografia).
 * Bloqueia a inserção e troca de números de telefone, WhatsApp, contatos externos, emails,
 * redes sociais, chaves Pix e tentativas de negociação fora da plataforma.
 */

export interface SecurityValidationResult {
  isValid: boolean;
  errorMessage?: string;
  detectedReason?: string;
}

// Alias para manter compatibilidade com importações anteriores
export type BioValidationResult = SecurityValidationResult;

/**
 * Valida o conteúdo de mensagens do chat ou biografias para evitar evasão de contato.
 */
export function validateSecurityContent(
  text: string,
  context: 'bio' | 'chat' = 'chat',
): SecurityValidationResult {
  if (!text || typeof text !== 'string') {
    return { isValid: true };
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { isValid: true };
  }

  // 1. Limite máximo de caracteres
  const maxLength = context === 'bio' ? 1000 : 2000;
  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      errorMessage: `O texto não pode ultrapassar ${maxLength} caracteres.`,
      detectedReason: 'EXCEED_MAX_LENGTH',
    };
  }

  // Normalização de texto (minúsculas, remoção de diacríticos/acentos para checagem léxica)
  const normalized = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  // 2. Links externos e de mensageiros (WhatsApp, Telegram, encurtadores, Instagram, etc.)
  const suspiciousLinksRegex =
    /(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com|t\.me|telegram\.me|bit\.ly|linktr\.ee|cutt\.ly|tinyurl\.com|is\.gd|instagram\.com|facebook\.com|tiktok\.com|linkedin\.com|https?:\/\/|www\.)/i;
  if (suspiciousLinksRegex.test(trimmed)) {
    return {
      isValid: false,
      errorMessage:
        'Por segurança da plataforma Finex, não é permitido o compartilhamento de links externos, WhatsApp ou redes sociais.',
      detectedReason: 'EXTERNAL_LINK_DETECTED',
    };
  }

  // 3. E-mails (convencionais ou camuflados como usuario [at] gmail ponto com)
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const obfuscatedEmailRegex =
    /[a-zA-Z0-9._%+-]+\s*(?:@|\[at\]|\(at\)|arroba)\s*[a-zA-Z0-9.-]+\s*(?:\.|\[dot\]|\(dot\)|ponto)\s*(?:com|br|net|org|io|gmail|hotmail|outlook|yahoo)/i;
  if (emailRegex.test(trimmed) || obfuscatedEmailRegex.test(trimmed)) {
    return {
      isValid: false,
      errorMessage:
        'Por segurança da plataforma Finex, não é permitido o compartilhamento de endereços de e-mail.',
      detectedReason: 'EMAIL_DETECTED',
    };
  }

  // 4. Frases explícitas de negociação/conversa por fora da plataforma
  const offPlatformPhrasesRegex =
    /(?:fechar|pagar|falar|chamar|atender|acertar|negociar|fazer|conversar|mandar|trocar)\s+(?:por\s+fora|no\s+privado|no\s+particular|fora\s+do\s+app|fora\s+da\s+plataforma|direto\s+comigo|pelo\s+zap|no\s+zap|no\s+whats|no\s+telegram)/i;
  if (offPlatformPhrasesRegex.test(normalized)) {
    return {
      isValid: false,
      errorMessage:
        'Por proteção e segurança de alunos e profissionais, contratações e pagamentos devem ser realizados com garantia pelo App Finex.',
      detectedReason: 'OFF_PLATFORM_EVASION_DETECTED',
    };
  }

  // 5. Palavras-chave de mensageiros ou redes sociais diretas (Whats, Zap, Telegram, Instagram, etc.)
  const messagingKeywordsRegex =
    /\b(?:whatsapp|watshapp|whats|wpp|wapp|zapzap|zap|telegram|instagram|insta|arroba|direct|chama\s+no\s+zap|passa\s+o\s+zap)\b/i;
  if (messagingKeywordsRegex.test(normalized)) {
    return {
      isValid: false,
      errorMessage:
        'Não é permitido solicitar ou compartilhar WhatsApp, redes sociais ou contatos externos. Toda a comunicação ocorre com segurança pelo App Finex.',
      detectedReason: 'MESSAGING_KEYWORD_DETECTED',
    };
  }

  // 6. Intenção de compartilhamento de contato/telefone/Pix
  const contactIntentRegex =
    /\b(?:meu|minha|passa|manda|envia|seu|sua|qual|pede)\s+(?:telefone|celular|fone|tel|cel|numero|num|chave\s+pix|pix)\b/i;
  if (contactIntentRegex.test(normalized)) {
    return {
      isValid: false,
      errorMessage:
        'Não é permitido compartilhar números de telefone, chaves Pix ou dados de contato pessoal.',
      detectedReason: 'CONTACT_INTENT_DETECTED',
    };
  }

  // 7. Preparação para análise numérica:
  // Preserva datas comuns (ex: 15/09/2026, 2026-09-10) e horários (ex: 18:30) para evitar falsos positivos
  const textWithoutDatesAndTimes = trimmed
    .replace(/\b(?:0?[1-9]|[12]\d|3[01])[/\-\.](?:0?[1-9]|1[0-2])[/\-\.](?:19|20)?\d{2}\b/g, '')
    .replace(/\b(?:19|20)\d{2}[/\-\.](?:0?[1-9]|1[0-2])[/\-\.](?:0?[1-9]|[12]\d|3[01])\b/g, '')
    .replace(/\b(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?\b/g, '');

  // Funde dígitos contíguos ou separados apenas por espaços e pontuações (ex: "5 5 9 8 4 0 5 4 4 7 3", "(55) 98405-4473", "55984054473")
  const fusedDigitsString = textWithoutDatesAndTimes.replace(
    /(?<=\d)[\s\.\-_\\\/(),]+(?=\d)/g,
    '',
  );

  // Se houver 8 ou mais dígitos agrupados:
  if (/\d{8,}/.test(fusedDigitsString)) {
    return {
      isValid: false,
      errorMessage:
        'Detectamos uma sequência com formato de número telefônico ou dado bancário. Por segurança, contatos externos são bloqueados.',
      detectedReason: 'PHONE_DIGITS_SEQUENCE_DETECTED',
    };
  }

  // 8. Formatos convencionais de telefone com DDD (ex: (51) 98765-4321, 55 51 98765-4321, +55 51 984054473)
  const standardPhoneRegex =
    /(?:\+?55\s*)?(?:\(?0?[1-9]{2}\)?\s*)?(?:9\s*)?[2-9]\d{3}[-\s\.]?\d{4}/;
  if (standardPhoneRegex.test(textWithoutDatesAndTimes)) {
    return {
      isValid: false,
      errorMessage:
        'Detectamos um número de telefone na mensagem. Por segurança, o compartilhamento de telefones não é permitido.',
      detectedReason: 'STANDARD_PHONE_DETECTED',
    };
  }

  // 9. Números escritos por extenso em sequência (ex: cinco cinco nove oito quatro zero cinco...)
  const spelledNumbersRegex =
    /(?:(?:zero|um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|meia|sete|oito|nove)[\s,-]*){6,}/i;
  if (spelledNumbersRegex.test(normalized)) {
    return {
      isValid: false,
      errorMessage:
        'Não é permitido o envio de números de contato escritos por extenso.',
      detectedReason: 'SPELLED_NUMBERS_DETECTED',
    };
  }

  return { isValid: true };
}

/**
 * Validador específico para Biografias
 */
export function validateBioContent(bio: string): SecurityValidationResult {
  return validateSecurityContent(bio, 'bio');
}

/**
 * Validador específico para Mensagens de Chat
 */
export function validateChatMessage(message: string): SecurityValidationResult {
  return validateSecurityContent(message, 'chat');
}
