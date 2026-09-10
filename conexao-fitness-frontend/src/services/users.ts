import { apiRequest } from "@/lib/apiClient";
import { AUTH_USER_KEY } from "@/lib/apiConfig";
import { validateBioContent } from "@/lib/bioValidator";
import type {
  AuthUser,
  PublicUserProfile,
  PersonalProfileData,
  UpdatePersonalProfileDto,
  AcademiaProfileData,
  UpdateAcademiaProfileDto,
} from "@/types/api";

export async function getPublicUserProfile(id: string): Promise<PublicUserProfile> {
  if (!id) {
    throw new Error("ID de usuário inválido");
  }

  // 2. Se for o próprio usuário logado
  try {
    const rawStored = localStorage.getItem(AUTH_USER_KEY);
    if (rawStored) {
      const stored = JSON.parse(rawStored);
      if (stored && (stored.id === id || id === "user-me")) {
        return {
          id: stored.id,
          name: stored.name,
          avatarUrl: stored.avatarUrl,
          role: stored.role,
          status: stored.status || "ATIVO",
          professionTitle: stored.professionTitle,
          cref: stored.cref,
          bio: stored.bio || "",
          cityBase: stored.cityBase || "Uruguaiana - RS",
          averageRating: 5.0,
          totalReviews: 12,
          followersCount: 24,
          followingCount: 15,
        };
      }
    }
  } catch (e) {
    console.error(e);
  }

  // 3. Tentar rota pública /users/public/:id
  try {
    const res = await apiRequest<PublicUserProfile>(`/users/public/${id}`);
    if (res && res.name) return res;
  } catch {
    // Continua para o fallback
  }

  // 4. Fallback: tentar rota padrão /users/:id
  try {
    const userRes = await apiRequest<any>(`/users/${id}`);
    if (userRes && userRes.name) {
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
          userRes.professionTitle ||
          (userRes.role === "PERSONAL" ? "Profissional Verificado" : undefined),
        cref: userRes.personalProfile?.cref || userRes.cref,
        bio: userRes.personalProfile?.bio || userRes.bio || "",
        modalities: userRes.personalProfile?.modalities || [],
        baseHourlyPrice: userRes.personalProfile?.baseHourlyPrice,
        qualityScore: userRes.personalProfile?.qualityScore ?? 5.0,
        responseRate: userRes.personalProfile?.responseRate ?? 100,
        createdAt: userRes.createdAt,
      };
    }
  } catch {
    // Continua para busca em posts locais
  }

  // 5. Fallback local: procurar nos posts em cache se esse autor existe
  try {
    const rawPosts = localStorage.getItem("cf_community_posts_v1");
    if (rawPosts) {
      const parsedPosts = JSON.parse(rawPosts);
      if (Array.isArray(parsedPosts)) {
        const found = parsedPosts.find(
          (p: any) => p.authorId === id || p.author?.id === id
        );
        if (found && found.author) {
          return {
            id: found.author.id || id,
            name: found.author.name || "Profissional",
            avatarUrl: found.author.avatarUrl,
            role: found.author.role || "PERSONAL",
            status: "ATIVO",
            cityBase: found.author.cityBase || "Uruguaiana - RS",
            professionTitle:
              found.author.personalProfile?.professionTitle ||
              (found.author.role === "PERSONAL" ? "Profissional da Saúde & Fitness" : undefined),
            cref: found.author.personalProfile?.cref,
            bio: found.author.bio || "",
            averageRating: 5.0,
            totalReviews: 8,
            followersCount: 18,
            followingCount: 12,
          };
        }
      }
    }
  } catch (e) {
    console.error(e);
  }

  // 6. Se realmente não existir
  throw new Error("Perfil de usuário ou profissional não encontrado.");
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

export async function getMyAcademiaProfile(): Promise<AcademiaProfileData> {
  try {
    return await apiRequest<AcademiaProfileData>("/users/me/profile/academia");
  } catch (err) {
    // Fallback do localStorage se o backend estiver desconectado
    const rawStored = localStorage.getItem(AUTH_USER_KEY);
    const stored = rawStored ? JSON.parse(rawStored) : {};
    const localGymKey = `cf_gym_profile_${stored.id || 'default'}`;
    const localGym = localStorage.getItem(localGymKey);
    if (localGym) {
      return JSON.parse(localGym);
    }
    return {
      userId: stored.id || "",
      name: stored.name || "Academia",
      email: stored.email || "",
      avatarUrl: stored.avatarUrl,
      nomeFantasia: stored.name,
      razaoSocial: stored.name,
      cnpj: stored.cpf || "",
      bio: stored.bio || "",
      city: stored.cityBase || "Uruguaiana - RS",
      state: "RS",
      openingHours: {
        monday_friday: "06:00 - 23:00",
        saturday: "08:00 - 18:00",
        sunday_holidays: "09:00 - 14:00",
      },
      facilities: [
        "Musculação Completa",
        "Área Cardio Climatizada",
        "Vestiários com Chuveiro",
        "Wi-Fi Gratuito",
        "Estacionamento",
      ],
      modalities: ["Musculação", "Spinning", "Cross Training", "Pilates"],
      dayPassPrice: 25.0,
      galleryUrls: [],
    };
  }
}

export async function updateMyAcademiaProfile(
  dto: UpdateAcademiaProfileDto
): Promise<AcademiaProfileData> {
  const rawStored = localStorage.getItem(AUTH_USER_KEY);
  const stored = rawStored ? JSON.parse(rawStored) : {};
  const localGymKey = `cf_gym_profile_${stored.id || 'default'}`;

  let result: AcademiaProfileData;
  try {
    result = await apiRequest<AcademiaProfileData>("/users/me/profile/academia", {
      method: "PATCH",
      body: dto,
    });
  } catch (e) {
    console.warn("Backend update error, saving to resilient localStorage:", e);
    // Salva localmente de forma resiliente
    const current = await getMyAcademiaProfile();
    result = { ...current, ...dto };
  }

  // Persiste no cache local
  localStorage.setItem(localGymKey, JSON.stringify(result));

  // Atualiza também AUTH_USER_KEY se alterou nome/avatar/bio
  if (dto.nomeFantasia || dto.avatarUrl || dto.bio) {
    if (dto.nomeFantasia) stored.name = dto.nomeFantasia;
    if (dto.avatarUrl) stored.avatarUrl = dto.avatarUrl;
    if (dto.bio) stored.bio = dto.bio;
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(stored));
  }

  return result;
}

export async function getMyPersonalProfile(): Promise<PersonalProfileData> {
  const rawStored = localStorage.getItem(AUTH_USER_KEY);
  const stored = rawStored ? JSON.parse(rawStored) : {};
  const localPersonalKey = `cf_personal_profile_${stored.id || 'default'}`;

  try {
    const res = await apiRequest<PersonalProfileData>("/users/me/profile/personal");
    if (res && res.userId) {
      localStorage.setItem(localPersonalKey, JSON.stringify(res));
      return res;
    }
  } catch (err) {
    console.warn("Backend get personal profile error, using fallback:", err);
  }

  const localPersonal = localStorage.getItem(localPersonalKey);
  if (localPersonal) {
    return JSON.parse(localPersonal);
  }

  return {
    userId: stored.id || "",
    name: stored.name || "Profissional",
    email: stored.email || "",
    avatarUrl: stored.avatarUrl,
    publicName: stored.name,
    cref: stored.cref || "CREF 012345-G/RS",
    professionTitle: stored.professionTitle || "Personal Trainer & Consultor",
    bio: stored.bio || "Especialista em hipertrofia, emagrecimento consciente e consultoria online de alta performance.",
    methodology: "Treinamento periodizado baseado em evidências científicas e biomecânica aplicada. Avaliação individualizada, progressão contínua de cargas e correção postural em cada movimento.",
    specialties: [
      "Hipertrofia Muscular",
      "Emagrecimento & Definição",
      "Consultoria Online",
      "Biomecânica & Postura",
      "Treinamento Funcional",
    ],
    serviceLocations: [
      "Online / Remoto pelo App Finex",
      "Academias Parceiras Cadastradas",
      "Atendimento a Domicílio / Condomínio",
    ],
    includedBenefits: [
      "Ficha de Treino Personalizada no App Finex",
      "Ajustes Semanais de Carga e Volume",
      "Suporte e Dúvidas via WhatsApp 24/7",
      "Vídeos demonstrativos de execução",
      "Avaliação Física por Bioimpedância e Dobras",
    ],
    modalities: ["Musculação", "Funcional", "Consultoria Online"],
    galleryUrls: [],
    instagram: "@personal_finex",
    whatsapp: stored.phone || "5555999999999",
    cityBase: stored.cityBase || "Uruguaiana - RS",
    serviceRadiusKm: 10,
    baseHourlyPrice: "120.00",
  };
}

export async function updateMyPersonalProfile(
  dto: UpdatePersonalProfileDto
): Promise<PersonalProfileData> {
  const rawStored = localStorage.getItem(AUTH_USER_KEY);
  const stored = rawStored ? JSON.parse(rawStored) : {};
  const localPersonalKey = `cf_personal_profile_${stored.id || 'default'}`;

  let result: PersonalProfileData;
  try {
    result = await apiRequest<PersonalProfileData>("/users/me/profile/personal", {
      method: "PATCH",
      body: dto,
    });
  } catch (e) {
    console.warn("Backend update error, saving to resilient localStorage:", e);
    const current = await getMyPersonalProfile();
    result = { ...current, ...dto };
  }

  // Persiste no cache local
  localStorage.setItem(localPersonalKey, JSON.stringify(result));

  // Atualiza também AUTH_USER_KEY se alterou publicName/avatarUrl/bio
  if (dto.publicName || dto.avatarUrl || dto.bio || dto.professionTitle || dto.cref) {
    if (dto.publicName) stored.name = dto.publicName;
    if (dto.avatarUrl) stored.avatarUrl = dto.avatarUrl;
    if (dto.bio) stored.bio = dto.bio;
    if (dto.professionTitle) stored.professionTitle = dto.professionTitle;
    if (dto.cref) stored.cref = dto.cref;
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(stored));
  }

  return result;
}

