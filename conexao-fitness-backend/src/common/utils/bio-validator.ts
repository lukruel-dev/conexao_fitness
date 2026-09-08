/**
 * Validador rigoroso de segurança e anti-desintermediação para Biografias (Bio).
 * Bloqueia a inserção de números de telefone, WhatsApp, contatos externos e links.
 */

export interface BioValidationResult {
  isValid: boolean;
  errorMessage?: string;
  detectedReason?: string;
}

export function validateBioContent(bio: string): BioValidationResult {
  if (!bio || typeof bio !== 'string') {
    return { isValid: true };
  }

  const trimmed = bio.trim();
  if (trimmed.length === 0) {
    return { isValid: true };
  }

  // 1. Limite máximo de tamanho
  if (trimmed.length > 1000) {
    return {
      isValid: false,
      errorMessage: 'A biografia não pode ultrapassar 1000 caracteres.',
      detectedReason: 'EXCEED_MAX_LENGTH',
    };
  }

  // 2. Links externos suspeitos (WhatsApp, Telegram, encurtadores, etc.)
  const suspiciousLinksRegex = /(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com|t\.me|telegram\.me|bit\.ly|linktr\.ee|cutt\.ly|tinyurl\.com|is\.gd)/i;
  if (suspiciousLinksRegex.test(trimmed)) {
    return {
      isValid: false,
      errorMessage:
        'Por segurança da plataforma, não é permitido inserir links externos ou links de WhatsApp na sua biografia.',
      detectedReason: 'EXTERNAL_LINK_DETECTED',
    };
  }

  // 3. Menções a palavras-chave de contato externo combinadas com números ou solicitações de chat fora da plataforma
  const contactKeywordsWithNumbersRegex = /(?:whatsapp|whats|zap|zapzap|wpp|telefone|celular|fone|contato|ligue|chama no|direct)\s*[:=-]?\s*[\d\s\(\)\.-]{4,}/i;
  if (contactKeywordsWithNumbersRegex.test(trimmed)) {
    return {
      isValid: false,
      errorMessage:
        'Não é permitido divulgar telefone, WhatsApp ou contatos externos na biografia. Utilize os canais oficiais de agendamento e mensagens do Conexão Fitness.',
      detectedReason: 'CONTACT_KEYWORD_WITH_DIGITS',
    };
  }

  // 4. Formatos convencionais de telefone (ex: (51) 98765-4321, 51 98765-4321, 98765-4321, +55 51 987654321)
  const phonePatternRegex = /(?:\+?55\s*)?(?:\(?0?[1-9]{2}\)?\s*)?(?:9\s*)?[2-9]\d{3}[-\s\.]?\d{4}/;
  if (phonePatternRegex.test(trimmed)) {
    return {
      isValid: false,
      errorMessage:
        'Detectamos um possível número de telefone na biografia. Por regras da plataforma, contatos telefônicos não são permitidos neste campo.',
      detectedReason: 'PHONE_PATTERN_DETECTED',
    };
  }

  // 5. Detecção de dígitos camuflados ou espaçados (ex: 9 9 1 5 6 2 8 2 3 ou 5-1-9-9-1-2-3-4-5-6-7)
  // Se houver uma sequência contendo 8 ou mais dígitos com apenas pontuações/espaços entre eles:
  const spacedDigitsRegex = /(?:\d[\s\.\-_/\\,()]{0,3}){8,}/;
  if (spacedDigitsRegex.test(trimmed)) {
    return {
      isValid: false,
      errorMessage:
        'Não é permitido inserir sequências de números de telefone ou contato na biografia.',
      detectedReason: 'SPACED_DIGITS_DETECTED',
    };
  }

  // 6. Detecção de números por extenso em sequência (ex: nove nove um cinco...)
  const spelledNumbersRegex = /(?:(?:zero|um|dois|tr[eê]s|quatro|cinco|seis|meia|sete|oito|nove)[\s,-]*){6,}/i;
  if (spelledNumbersRegex.test(trimmed)) {
    return {
      isValid: false,
      errorMessage:
        'Não é permitido inserir números de telefone escritos por extenso na biografia.',
      detectedReason: 'SPELLED_NUMBERS_DETECTED',
    };
  }

  return { isValid: true };
}
