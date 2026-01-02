// Auth API Endpoints
import { apiClient } from '../client';
import type {
  LoginRequest,
  RegisterRequest,
  StudentRegisterRequest,
  AuthResponse,
  UserInfo,
} from '../types';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', data),

  registerStudent: (data: StudentRegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register/student', data),

  refreshToken: () =>
    apiClient.post<AuthResponse>('/auth/refresh'),

  me: () =>
    apiClient.get<UserInfo>('/auth/me'),

  updateEmail: (email: string) =>
    apiClient.put<{ message: string }>('/auth/update-email', { email }),

  updatePassword: (currentPassword: string, newPassword: string) =>
    apiClient.put<{ message: string }>('/auth/update-password', {
      current_password: currentPassword,
      new_password: newPassword,
    }),

  requestPasswordReset: (email: string) =>
    apiClient.post<{ message: string }>('/auth/password-reset/request', { email }),

  confirmPasswordReset: (token: string, newPassword: string) =>
    apiClient.post<{ message: string }>('/auth/password-reset/confirm', {
      token,
      new_password: newPassword,
    }),

  guestLogin: () =>
    apiClient.post<AuthResponse>('/auth/guest/login'),
};
