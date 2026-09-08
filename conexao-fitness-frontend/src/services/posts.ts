import { apiClient } from "@/lib/apiClient";
import type {
  Post,
  PostComment,
  CreatePostDto,
  CreateCommentDto,
} from "@/types/community";

// Posts de demonstração ricos com fotos reais para exibição inicial e fallback
export const INITIAL_DEMO_POSTS: Post[] = [
  {
    id: "demo-post-1",
    authorId: "user-personal-1",
    author: {
      id: "user-personal-1",
      name: "Prof. Diego Silva",
      avatarUrl: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=150",
      role: "PERSONAL",
      cityBase: "Uruguaiana - RS",
      averageRating: 4.9,
      personalProfile: {
        professionTitle: "Personal Trainer & Preparador Físico",
        cref: "012345-G/RS",
      },
    },
    content:
      "🔥 Dica de Ouro para Hipertrofia de Quadríceps:\nFoque no tempo sob tensão na fase excêntrica (3 segundos descendo no agachamento livre). O controle de carga e a amplitude máxima na fase profunda ativam muito mais unidades motoras do que socar peso com amplitude encurtada!\n\nConfiram a ficha que montei abaixo e me digam o que acharam nos comentários! 👇",
    category: "Treino",
    tags: ["#Treino", "#Hipertrofia", "#Pernas", "#Biomecanica"],
    mediaUrls: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=900&auto=format&fit=crop",
    ],
    workoutRoutine: {
      title: "Protocolo Foco em Quadríceps & Isquiotibiais",
      level: "Intermediário / Avançado",
      exercises: [
        {
          name: "Agachamento Livre com Barra",
          sets: "4",
          reps: "8-10",
          restSeconds: 90,
          notes: "3s na descida, subida explosiva",
        },
        {
          name: "Leg Press 45º",
          sets: "4",
          reps: "12-15",
          restSeconds: 60,
          notes: "Pés na base inferior para ênfase no quadríceps",
        },
        {
          name: "Cadeira Extensora (Drop-Set)",
          sets: "3",
          reps: "10+10",
          restSeconds: 60,
          notes: "Segurar 2s no ponto de contração máxima",
        },
        {
          name: "Mesa Flexora",
          sets: "4",
          reps: "12",
          restSeconds: 60,
          notes: "Tronco firme, sem balanço lombar",
        },
      ],
    },
    likesCount: 38,
    commentsCount: 6,
    isLiked: false,
    isFollowingAuthor: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: "demo-post-2",
    authorId: "user-nutri-1",
    author: {
      id: "user-nutri-1",
      name: "Dra. Camila Santos",
      avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150",
      role: "PERSONAL",
      cityBase: "Uruguaiana - RS",
      averageRating: 5.0,
      personalProfile: {
        professionTitle: "Nutricionista Esportiva",
        cref: "CRN 98765/RS",
      },
    },
    content:
      "🥗 Mito ou Verdade: Carboidrato à noite engorda?\nMITO! O que determina ganho ou perda de gordura é o balanço energético total do dia (superávit ou déficit calórico). Consumir uma fonte limpa de carboidrato (como aveia, batata-doce ou arroz) no jantar pode inclusive melhorar a síntese de melatonina e a qualidade do sono reparador!\n\nQual o carboidrato favorito de vocês na janta?",
    category: "Dieta",
    tags: ["#NutricaoEsportiva", "#DietaSemTerrorismo", "#Carboidratos", "#Saude"],
    mediaUrls: [
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=900&auto=format&fit=crop",
    ],
    likesCount: 52,
    commentsCount: 11,
    isLiked: false,
    isFollowingAuthor: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "demo-post-3",
    authorId: "user-aluno-1",
    author: {
      id: "user-aluno-1",
      name: "Lucas Menezes",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      role: "STUDENT",
      cityBase: "Uruguaiana - RS",
    },
    content:
      "Resultado de 5 meses com foco em treino e plano nutricional! 💪\nSaí de 84kg para 76kg com aumento notável de força no supino e agachamento. Seguir a comunidade e as orientações aqui tem feito toda a diferença. Bora pra cima que o ano está só começando!",
    category: "Evolução",
    tags: ["#EvolucaoFitness", "#Superacao", "#Foco", "#Musculacao"],
    mediaUrls: [
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=900&auto=format&fit=crop",
    ],
    likesCount: 89,
    commentsCount: 14,
    isLiked: true,
    isFollowingAuthor: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
  {
    id: "demo-post-4",
    authorId: "user-academia-1",
    author: {
      id: "user-academia-1",
      name: "Academia Conexão VIP",
      avatarUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150",
      role: "ACADEMIA",
      cityBase: "Uruguaiana - RS",
      averageRating: 4.8,
      academiaProfile: {
        nomeFantasia: "Conexão VIP Uruguaiana",
      },
    },
    content:
      "🚨 Novos equipamentos de biomecânica chegaram na nossa área de musculação!\nVenha conhecer nossa estrutura climatizada, vestiários premium e espaço funcional. Garanta seu Day Pass direto pelo app Conexão Fitness com desconto exclusivo nesta semana!",
    category: "Destaques",
    tags: ["#AcademiaVIP", "#DayPass", "#Infraestrutura", "#Fitness"],
    mediaUrls: [
      "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=900&auto=format&fit=crop",
    ],
    likesCount: 64,
    commentsCount: 4,
    isLiked: false,
    isFollowingAuthor: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
  },
];

// Cache local em memória e storage para persistência de interações locais
const STORAGE_POSTS_KEY = "cf_local_posts";
const STORAGE_LIKES_KEY = "cf_local_likes";
const STORAGE_FOLLOWS_KEY = "cf_local_follows";
const STORAGE_COMMENTS_KEY = "cf_local_comments";

function getLocalPosts(): Post[] {
  try {
    const raw = localStorage.getItem(STORAGE_POSTS_KEY);
    if (!raw) return INITIAL_DEMO_POSTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DEMO_POSTS;
  } catch {
    return INITIAL_DEMO_POSTS;
  }
}

function saveLocalPosts(posts: Post[]) {
  try {
    localStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error("Erro salvando posts locais:", e);
  }
}

function getLocalLikes(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_LIKES_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveLocalLikes(likes: Set<string>) {
  try {
    localStorage.setItem(STORAGE_LIKES_KEY, JSON.stringify(Array.from(likes)));
  } catch (e) {
    console.error("Erro salvando likes:", e);
  }
}

export function getLocalFollows(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_FOLLOWS_KEY);
    return new Set(raw ? JSON.parse(raw) : ["user-personal-1", "user-academia-1"]);
  } catch {
    return new Set(["user-personal-1", "user-academia-1"]);
  }
}

export function saveLocalFollows(follows: Set<string>) {
  try {
    localStorage.setItem(STORAGE_FOLLOWS_KEY, JSON.stringify(Array.from(follows)));
  } catch (e) {
    console.error("Erro salvando follows:", e);
  }
}

function getLocalCommentsMap(): Record<string, PostComment[]> {
  try {
    const raw = localStorage.getItem(STORAGE_COMMENTS_KEY);
    if (!raw) return getDefaultCommentsMap();
    return JSON.parse(raw);
  } catch {
    return getDefaultCommentsMap();
  }
}

function saveLocalCommentsMap(map: Record<string, PostComment[]>) {
  try {
    localStorage.setItem(STORAGE_COMMENTS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("Erro salvando comentários:", e);
  }
}

function getDefaultCommentsMap(): Record<string, PostComment[]> {
  return {
    "demo-post-1": [
      {
        id: "c1",
        postId: "demo-post-1",
        authorId: "user-aluno-1",
        author: {
          id: "user-aluno-1",
          name: "Lucas Menezes",
          role: "STUDENT",
        },
        content: "Excelente dica, professor! Fiz o agachamento cadenciado e o estímulo foi surreal.",
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      },
      {
        id: "c2",
        postId: "demo-post-1",
        authorId: "user-nutri-1",
        author: {
          id: "user-nutri-1",
          name: "Dra. Camila Santos",
          role: "PERSONAL",
          personalProfile: { professionTitle: "Nutricionista" },
        },
        content: "Perfeito! E não se esqueçam de caprichar na ingestão de água e aminoácidos no pós-treino!",
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
    ],
    "demo-post-2": [
      {
        id: "c3",
        postId: "demo-post-2",
        authorId: "user-personal-1",
        author: {
          id: "user-personal-1",
          name: "Prof. Diego Silva",
          role: "PERSONAL",
        },
        content: "Muito importante desmistificar isso! Sem energia não há treino de alta intensidade.",
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
    ],
  };
}

export async function listPosts(params?: {
  feed?: "explore" | "following";
  authorId?: string;
  tag?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: Post[]; total: number; hasMore: boolean }> {
  try {
    const query = new URLSearchParams();
    if (params?.feed) query.set("feed", params.feed);
    if (params?.authorId) query.set("authorId", params.authorId);
    if (params?.tag) query.set("tag", params.tag);
    if (params?.category) query.set("category", params.category);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const res = await apiClient.get<{ items: Post[]; total: number; hasMore: boolean }>(
      `/posts?${query.toString()}`
    );
    if (res && Array.isArray(res.items)) {
      return res;
    }
  } catch (err) {
    console.warn("API de posts indisponível, usando repositório local:", err);
  }

  // Fallback local enriquecido
  let localPosts = getLocalPosts();
  const localLikes = getLocalLikes();
  const localFollows = getLocalFollows();

  // Aplica curtidas e seguidos locais
  localPosts = localPosts.map((p) => ({
    ...p,
    isLiked: localLikes.has(p.id) || p.isLiked,
    isFollowingAuthor: localFollows.has(p.authorId) || p.isFollowingAuthor,
  }));

  if (params?.authorId) {
    localPosts = localPosts.filter(
      (p) =>
        p.authorId === params.authorId ||
        (params.authorId === "user-me" && p.authorId === "user-me")
    );
  } else if (params?.feed === "following") {
    localPosts = localPosts.filter((p) => localFollows.has(p.authorId));
  }

  if (params?.category && params.category !== "Todos") {
    localPosts = localPosts.filter((p) => p.category.toLowerCase() === params.category!.toLowerCase());
  }

  if (params?.tag) {
    const tagQuery = params.tag.toLowerCase();
    localPosts = localPosts.filter((p) =>
      p.tags.some((t) => t.toLowerCase().includes(tagQuery))
    );
  }

  return {
    items: localPosts,
    total: localPosts.length,
    hasMore: false,
  };
}

export async function createPost(dto: CreatePostDto, currentUser?: any): Promise<Post> {
  try {
    const res = await apiClient.post<Post>("/posts", dto);
    if (res && res.id) {
      return res;
    }
  } catch (err) {
    console.warn("API de criação de post indisponível, persistindo localmente:", err);
  }

  // Fallback local
  const currentLocalPosts = getLocalPosts();
  let originalPost: Post | undefined;
  if (dto.sharedPostId) {
    originalPost = currentLocalPosts.find((p) => p.id === dto.sharedPostId);
    if (originalPost) {
      originalPost.sharesCount = (originalPost.sharesCount || 0) + 1;
    }
  }

  const authorId = currentUser?.id || "user-me";
  const newPost: Post = {
    id: "post-" + Date.now(),
    authorId,
    author: {
      id: authorId,
      name: currentUser?.name || "Você (Atleta Conexão)",
      role: currentUser?.role || "STUDENT",
      avatarUrl:
        currentUser?.avatarUrl ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      cityBase: currentUser?.cityBase || "Uruguaiana - RS",
    },
    content: dto.content,
    category: dto.category || "Geral",
    tags: dto.tags || ["#Comunidade"],
    mediaUrls: dto.mediaUrls || [],
    workoutRoutine: dto.workoutRoutine,
    sharedPostId: dto.sharedPostId,
    sharedPost: originalPost,
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    isLiked: false,
    isFollowingAuthor: false,
    createdAt: new Date().toISOString(),
  };

  const updated = [newPost, ...currentLocalPosts];
  saveLocalPosts(updated);
  return newPost;
}

export async function sharePost(
  postId: string,
  commentary?: string,
  currentUser?: any
): Promise<Post> {
  const content = commentary?.trim() || "🔄 Compartilhou uma publicação da comunidade:";
  return createPost(
    {
      content,
      category: "Geral",
      tags: ["#Compartilhado", "#Comunidade"],
      sharedPostId: postId,
    },
    currentUser
  );
}

export async function toggleLikePost(
  postId: string
): Promise<{ liked: boolean; likesCount: number }> {
  try {
    const res = await apiClient.post<{ liked: boolean; likesCount: number }>(
      `/posts/${postId}/like`,
      {}
    );
    if (res) return res;
  } catch (err) {
    console.warn("Toggle like remoto falhou, atualizando localmente:", err);
  }

  const localLikes = getLocalLikes();
  const localPosts = getLocalPosts();
  const isLiked = localLikes.has(postId);

  let newCount = 0;
  if (isLiked) {
    localLikes.delete(postId);
  } else {
    localLikes.add(postId);
  }
  saveLocalLikes(localLikes);

  const updatedPosts = localPosts.map((p) => {
    if (p.id === postId) {
      newCount = Math.max(0, p.likesCount + (isLiked ? -1 : 1));
      return { ...p, isLiked: !isLiked, likesCount: newCount };
    }
    return p;
  });
  saveLocalPosts(updatedPosts);

  return { liked: !isLiked, likesCount: newCount };
}

export async function listComments(postId: string): Promise<PostComment[]> {
  try {
    const res = await apiClient.get<PostComment[]>(`/posts/${postId}/comments`);
    if (Array.isArray(res)) return res;
  } catch (err) {
    console.warn("List comments remoto falhou, usando cache local:", err);
  }

  const map = getLocalCommentsMap();
  return map[postId] || [];
}

export async function addComment(
  postId: string,
  content: string,
  authorName = "Você"
): Promise<PostComment> {
  try {
    const res = await apiClient.post<PostComment>(`/posts/${postId}/comments`, {
      content,
    });
    if (res && res.id) return res;
  } catch (err) {
    console.warn("Adicionar comentário remoto falhou, persistindo localmente:", err);
  }

  const map = getLocalCommentsMap();
  const list = map[postId] || [];
  const newComment: PostComment = {
    id: "comment-" + Date.now(),
    postId,
    authorId: "user-me",
    author: {
      id: "user-me",
      name: authorName,
      role: "STUDENT",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    },
    content,
    createdAt: new Date().toISOString(),
  };

  map[postId] = [...list, newComment];
  saveLocalCommentsMap(map);

  // Atualiza contagem no post
  const posts = getLocalPosts();
  const updatedPosts = posts.map((p) =>
    p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
  );
  saveLocalPosts(updatedPosts);

  return newComment;
}

export async function toggleFollowUser(
  targetUserId: string
): Promise<{ following: boolean }> {
  try {
    const res = await apiClient.post<{ following: boolean }>(
      `/posts/users/${targetUserId}/follow`,
      {}
    );
    if (res) return res;
  } catch (err) {
    console.warn("Toggle follow remoto falhou, atualizando localmente:", err);
  }

  const follows = getLocalFollows();
  const isFollowing = follows.has(targetUserId);

  if (isFollowing) {
    follows.delete(targetUserId);
  } else {
    follows.add(targetUserId);
  }
  saveLocalFollows(follows);

  return { following: !isFollowing };
}

export async function deletePost(
  postId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await apiClient.delete<{ success: boolean; message?: string }>(
      `/posts/${postId}`
    );
    const local = getLocalPosts();
    saveLocalPosts(local.filter((p) => p.id !== postId));
    return res || { success: true };
  } catch (err: any) {
    console.warn("Delete post remoto falhou ou offline, removendo do cache local:", err);
    const local = getLocalPosts();
    saveLocalPosts(local.filter((p) => p.id !== postId));
    return { success: true };
  }
}
