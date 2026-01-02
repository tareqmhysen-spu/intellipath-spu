import { useState, useCallback } from 'react';
import { peerMatchingApi } from '@/api';
import type { PeerMatch, PeerMatchRequest } from '@/api/types';
import { useToast } from '@/hooks/use-toast';

export function useIntelliPathPeerMatching() {
  const [matches, setMatches] = useState<PeerMatch[]>([]);
  const [myMatches, setMyMatches] = useState<PeerMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const findMatches = useCallback(async (data: PeerMatchRequest) => {
    setIsLoading(true);
    try {
      const response = await peerMatchingApi.findMatches(data);
      setMatches(response);
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في البحث عن شركاء',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const acceptMatch = useCallback(async (matchId: string) => {
    try {
      await peerMatchingApi.acceptMatch(matchId);
      setMatches(prev => prev.map(m => 
        m.id === matchId ? { ...m, status: 'accepted' as const } : m
      ));
      toast({
        title: 'تم',
        description: 'تم قبول الطلب',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في القبول',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const declineMatch = useCallback(async (matchId: string) => {
    try {
      await peerMatchingApi.declineMatch(matchId);
      setMatches(prev => prev.map(m => 
        m.id === matchId ? { ...m, status: 'declined' as const } : m
      ));
      toast({
        title: 'تم',
        description: 'تم رفض الطلب',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في الرفض',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const getMyMatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await peerMatchingApi.getMyMatches();
      setMyMatches(response);
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في جلب التطابقات',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    matches,
    myMatches,
    isLoading,
    findMatches,
    acceptMatch,
    declineMatch,
    getMyMatches,
  };
}
