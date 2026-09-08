import { apiRequest } from "@/lib/apiClient";
import { AUTH_USER_KEY } from "@/lib/apiConfig";
import { validateBioContent } from "@/lib/bioValidator";
import type { AuthUser, PublicUserProfile } from "@/types/api";

// Dados de fallback para perfis de demonstração / featured
const DEMO_PROFILES: Record<string, Partial<PublicUserProfile>> = {
  "pro-1": {
    id: "pro-1",
    name: "Prof. Diego Silva",
    professionTitle: "Personal Trainer & Preparador Físico",
    cref: "CREF 012345-G/RS",
    role: "PERSONAL",
    status: "ATIVO",
    cityBase: "Uruguaiana - RS (Presencial e Online)",
    averageRating: 4.9,
    totalReviews: 48,
    avatarUrl: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&auto=format&fit=crop",
    bio: "Especialista em hipertrofia, emagrecimento consciente e periodização de força. Atuo com acompanhamento presencial em academias parceiras e consultoria personalizada online com prescrição de treinos individualizados.",
    modalities: ["Musculação", "Hipertrofia", "Consultoria Online", "Emagrecimento", "Treino Funcional"],
    baseHourlyPrice: "75.00",
    followersCount: 142,
    followingCount: 38,
    qualityScore: 4.9,
    responseRate: 98,
  },
  "pro-2": {
    id: "pro-2",
    name: "Dra. Camila Santos",
    professionTitle: "Nutricionista Esportiva & Clínica",
    cref: "CRN 98765/RS",
    role: "PERSONAL",
    status: "ATIVO",
    cityBase: "Uruguaiana - RS (Consultório e Online)",
    averageRating: 5.0,
    totalReviews: 32,
    avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop",
    bio: "Nutricionista com foco em nutrição esportiva de alta performance, composição corporal, bioimpedância e reeducação alimentar sem dietas restritivas. Planos alimentares 100% personalizados para os seus objetivos.",
    modalities: ["Bioimpedância", "Emagrecimento", "Suplementação", "Hipertrofia", "Nutrição Clínica"],
    baseHourlyPrice: "140.00",
    followersCount: 215,
    followingCount: 64,
    qualityScore: 5.0,
    responseRate: 100,
  },
  "pro-3": {
    id: "pro-3",
    name: "Dr. Rodrigo Oliveira",
    professionTitle: "Fisioterapeuta Desportivo & Osteopata",
    cref: "CREFITO 54321/RS",
    role: "PERSONAL",
    status: "ATIVO",
    cityBase: "Uruguaiana - RS",
    averageRating: 4.9,
    totalReviews: 29,
    avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop",
    bio: "Fisioterapeuta especialista em prevenção de lesões, reabilitação ortopédica e desportiva, liberação miofascial e ventosaterapia. Atendimento clínico com foco na recuperação rápida e segura do atleta.",
    modalities: ["Reabilitação", "Liberação Miofascial", "Ventosaterapia", "Osteopatia", "Prevenção de Lesões"],
    baseHourlyPrice: "130.00",
    followersCount: 98,
    followingCount: 22,
    qualityScore: 4.9,
    responseRate: 95,
  },
};

export async function getPublicUserProfile(id: string): Promise<PublicUserProfile> {
  // Se for ID demo estático
  if (DEMO_PROFILES[id]) {
    return DEMO_PROFILES[id] as PublicUserProfile;
  }

  try {
    const res = await apiRequest<PublicUserProfile>(`/users/public/${id}`);
    return res;
  } catch (err) {
    // Fallback: tentar rota padrão /users/:id
    try {
      const userRes = await apiRequest<any>(`/users/${id}`);
      return {
        id: userRes.id,
        name: userRes.name,
        avatarUrl: userRes.avatarUrl,
        role: userRes.role,
        status: userRes.status,
        cityBase: userRes.cityBase || "Uruguaiana - RS",
        averageRating: userRes.averageRating || 5.0,
        totalReviews: userRes.totalReviews || 0,
        professionTitle:
          userRes.personalProfile?.professionTitle ||
          (userRes.role === "PERSONAL" ? "Personal Trainer" : undefined),
        cref: userRes.personalProfile?.cref,
        bio: userRes.personalProfile?.bio || userRes.bio || "",
        modalities: userRes.personalProfile?.modalities || [],
        baseHourlyPrice: userRes.personalProfile?.baseHourlyPrice,
        qualityScore: userRes.personalProfile?.qualityScore ?? 5.0,
        responseRate: userRes.personalProfile?.responseRate ?? 100,
        createdAt: userRes.createdAt,
      };
    } catch {
      if (DEMO_PROFILES[id]) return DEMO_PROFILES[id] as PublicUserProfile;
      throw err;
    }
  }
}

export async function updateMyBio(bio: string): Promise<AuthUser> {
  const trimmed = (bio || "").trim();

  // Validação no frontend antes de enviar
  if (trimmed) {
    const validation = validateBioContent(trimmed);
    if (!validation.isValid) {
      throw new Error(validation.errorMessage);
    }
  }

  const updatedUser = await apiRequest<AuthUser>("/users/me/bio", {
    method: "PATCH",
    body: { bio: trimmed },
  });

  // Atualiza cache local
  const currentRaw = localStorage.getItem(AUTH_USER_KEY);
  if (currentRaw) {
    try {
      const parsed = JSON.parse(currentRaw);
      parsed.bio = trimmed;
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(parsed));
    } catch (e) {
      console.error(e);
    }
  }

  return updatedUser;
}
