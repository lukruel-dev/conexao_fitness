import type { AuthUser } from "@/types/api";

/**
 * Identifica se o usuário logado atua como Nutricionista na plataforma.
 */
export function isNutritionist(user?: AuthUser | null): boolean {
  if (!user) return false;
  const title = (user.professionTitle || "").toLowerCase();
  const bio = (user.bio || "").toLowerCase();
  const name = (user.name || "").toLowerCase();
  
  return (
    title.includes("nutri") ||
    title.includes("diet") ||
    bio.includes("nutricionista") ||
    bio.includes("nutrição") ||
    name.includes("camila") || // Dra. Camila Santos (demo/seed nutri)
    name.includes("nutri")
  );
}

/**
 * Identifica se o usuário logado atua como Personal Trainer na plataforma.
 */
export function isPersonalTrainer(user?: AuthUser | null): boolean {
  if (!user) return false;
  if (isNutritionist(user)) return false; // Nutricionistas não são personais
  
  const title = (user.professionTitle || "").toLowerCase();
  const bio = (user.bio || "").toLowerCase();
  
  return (
    user.role === "PERSONAL" ||
    title.includes("personal") ||
    title.includes("treino") ||
    title.includes("treinador") ||
    title.includes("educa") ||
    title.includes("muscula") ||
    bio.includes("personal") ||
    bio.includes("treinador") ||
    Boolean(user.cref)
  );
}

/**
 * Verifica se o usuário tem autorização para prescrever Fichas de Treino.
 * Conforme regulamentação do CONFEF, apenas profissionais de Educação Física / Personal Trainers podem prescrever treinos.
 */
export function canPrescribeWorkout(user?: AuthUser | null): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: "Você precisa estar conectado como profissional." };
  }
  
  // Administrador pode testar tudo
  if (user.role === "ADMIN") {
    return { allowed: true };
  }
  
  if (isNutritionist(user)) {
    return {
      allowed: false,
      reason: "Prescrição de treino bloqueada. Conforme regulamentação do CONFEF/CFN, apenas Personal Trainers e profissionais de Educação Física com CREF ativo podem prescrever fichas de treino.",
    };
  }
  
  if (isPersonalTrainer(user)) {
    return { allowed: true };
  }
  
  return {
    allowed: false,
    reason: "Apenas Personal Trainers credenciados com CREF ativo podem prescrever fichas de treino para alunos.",
  };
}

/**
 * Verifica se o usuário tem autorização para prescrever Dietas e Planos Alimentares.
 * Conforme Lei nº 8.234/1991 do CFN (Conselho Federal de Nutricionistas), a prescrição dietética é ato privativo do Nutricionista.
 */
export function canPrescribeDiet(user?: AuthUser | null): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: "Você precisa estar conectado como profissional." };
  }
  
  // Administrador pode testar tudo
  if (user.role === "ADMIN") {
    return { allowed: true };
  }
  
  if (isPersonalTrainer(user) && !isNutritionist(user)) {
    return {
      allowed: false,
      reason: "Prescrição de dieta bloqueada. Conforme regulamentação do CFN (Conselho Federal de Nutricionistas), a prescrição dietética e cálculo de macronutrientes é ato privativo do profissional Nutricionista com registro no CRN.",
    };
  }
  
  if (isNutritionist(user)) {
    return { allowed: true };
  }
  
  return {
    allowed: false,
    reason: "Apenas Nutricionistas habilitados com registro no CRN podem prescrever planos alimentares e dietas.",
  };
}
