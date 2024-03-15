import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/UserDataStore';

export const useAuth = (redirectPath = '/login') => {
  const { user } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate(redirectPath);
    }
  }, [user, navigate, redirectPath]);

  return { user };
};
