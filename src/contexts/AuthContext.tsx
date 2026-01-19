import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

type UserRole = 'admin' | 'editor' | 'user' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isEditor: boolean;
  canAccess: boolean; // admin or editor
  role: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isAdmin = role === 'admin';
  const isEditor = role === 'editor';
  const canAccess = role === 'admin' || role === 'editor';

  useEffect(() => {
    let mounted = true;

    const syncAuthState = (session: Session | null) => {
      if (!mounted) return;

      setLoading(true);
      setSession(session);
      setUser(session?.user ?? null);

      // Important: do NOT block auth events (SIGNED_IN) with awaited DB calls.
      if (session?.user) {
        setRole(null);
        void checkUserRole(session.user.id)
          .then((userRole) => {
            if (mounted) setRole(userRole);
          })
          .finally(() => {
            if (mounted) setLoading(false);
          });
      } else {
        setRole(null);
        setLoading(false);
      }
    };

    // Listener first (prevents missing SIGNED_IN events)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncAuthState(session);
    });

    // Initial session load
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => syncAuthState(session))
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkUserRole = async (userId: string): Promise<UserRole> => {
    try {
      // Fetch all roles for the user (may have multiple)
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error || !data || data.length === 0) return 'user';
      
      // Return highest privilege role: admin > editor > user
      const roles = data.map(r => r.role);
      if (roles.includes('admin')) return 'admin';
      if (roles.includes('editor')) return 'editor';
      return 'user';
    } catch {
      return 'user';
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isEditor, canAccess, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
