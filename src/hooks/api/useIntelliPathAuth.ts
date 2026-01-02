import { useState, useCallback } from 'react';
import { authApi, apiClient } from '@/api';
import type { LoginRequest, RegisterRequest, StudentRegisterRequest, UserInfo } from '@/api/types';
import { useToast } from '@/hooks/use-toast';

export function useIntelliPathAuth() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      apiClient.setTokens(response.access_token, response.refresh_token);
      setUser(response.user);
      toast({
        title: 'تم تسجيل الدخول',
        description: 'مرحباً بك في IntelliPath',
      });
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ في تسجيل الدخول',
        description: error.message || 'فشل في تسجيل الدخول',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(data);
      apiClient.setTokens(response.access_token, response.refresh_token);
      setUser(response.user);
      toast({
        title: 'تم إنشاء الحساب',
        description: 'تم تسجيلك بنجاح',
      });
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ في التسجيل',
        description: error.message || 'فشل في إنشاء الحساب',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const registerStudent = useCallback(async (data: StudentRegisterRequest) => {
    setIsLoading(true);
    try {
      const response = await authApi.registerStudent(data);
      apiClient.setTokens(response.access_token, response.refresh_token);
      setUser(response.user);
      toast({
        title: 'تم إنشاء الحساب',
        description: 'تم تسجيلك كطالب بنجاح',
      });
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ في التسجيل',
        description: error.message || 'فشل في إنشاء حساب الطالب',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const logout = useCallback(() => {
    apiClient.clearTokens();
    setUser(null);
    toast({
      title: 'تم تسجيل الخروج',
      description: 'نراك قريباً',
    });
  }, [toast]);

  const fetchCurrentUser = useCallback(async () => {
    if (!apiClient.getAccessToken()) return null;
    
    setIsLoading(true);
    try {
      const userInfo = await authApi.me();
      setUser(userInfo);
      return userInfo;
    } catch {
      apiClient.clearTokens();
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isLoading,
    login,
    register,
    registerStudent,
    logout,
    fetchCurrentUser,
  };
}
