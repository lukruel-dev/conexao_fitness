import { apiClient } from "@/lib/apiClient";
import type {
  Post,
  PostComment,
  CreatePostDto,
  CreateCommentDto,
} from "@/types/community";

// Cache local em memória e storage para persistência de interações locais
const STORAGE_POSTS_KEY = "cf_local_posts";
const STORAGE_LIKES_KEY = "cf_local_likes";
const STORAGE_FOLLOWS_KEY = "cf_local_follows";
const STORAGE_COMMENTS_KEY = "cf_local_comments";

function getLocalPosts(): Post[] {
  try {
    const raw = localStorage.getItem(STORAGE_POSTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Filtrar posts de demo legados
    if (Array.isArray(parsed)) {
      return parsed.filter((p: any) => !p.id?.startsWith("demo-post-") && !p.authorId?.startsWith("user-"));
    }
    return [];
  } catch {
    return [];
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
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
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
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveLocalCommentsMap(map: Record<string, PostComment[]>) {
  try {
    localStorage.setItem(STORAGE_COMMENTS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("Erro salvando comentários:", e);
  }
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
