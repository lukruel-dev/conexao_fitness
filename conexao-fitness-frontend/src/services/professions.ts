import { apiRequest } from '@/lib/apiClient';

export interface Profession {
  id: string;
  title: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const listProfessions = async (): Promise<Profession[]> => {
  return apiRequest<Profession[]>('/professions');
};

export const listAllProfessionsAdmin = async (): Promise<Profession[]> => {
  return apiRequest<Profession[]>('/professions/admin/all');
};

export const createProfession = async (title: string): Promise<Profession> => {
  return apiRequest<Profession>('/professions', { method: 'POST', body: { title } });
};

export const updateProfession = async (id: string, updateData: { title?: string; isActive?: boolean }): Promise<Profession> => {
  return apiRequest<Profession>(`/professions/${id}`, { method: 'PATCH', body: updateData });
};

export const deleteProfession = async (id: string): Promise<void> => {
  await apiRequest(`/professions/${id}`, { method: 'DELETE' });
};
