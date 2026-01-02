// Talent Ledger API Endpoints
import { apiClient } from '../client';
import type {
  Skill,
  Certification,
} from '../types';

export const talentLedgerApi = {
  // Get all skills
  getSkills: () =>
    apiClient.get<Skill[]>('/talent-ledger/skills'),

  // Add skill
  addSkill: (name: string, category: string) =>
    apiClient.post<Skill>('/talent-ledger/skills', { name, category }),

  // Update skill level
  updateSkillLevel: (skillId: string, level: number) =>
    apiClient.put<Skill>(`/talent-ledger/skills/${skillId}/level`, { level }),

  // Delete skill
  deleteSkill: (skillId: string) =>
    apiClient.delete<{ message: string }>(`/talent-ledger/skills/${skillId}`),

  // Get certifications
  getCertifications: () =>
    apiClient.get<Certification[]>('/talent-ledger/certifications'),

  // Add certification
  addCertification: (data: Omit<Certification, 'id'>) =>
    apiClient.post<Certification>('/talent-ledger/certifications', data),

  // Delete certification
  deleteCertification: (certificationId: string) =>
    apiClient.delete<{ message: string }>(`/talent-ledger/certifications/${certificationId}`),

  // Verify skill
  verifySkill: (skillId: string, proof: string) =>
    apiClient.post<Skill>(`/talent-ledger/skills/${skillId}/verify`, { proof }),
};
