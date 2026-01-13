import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    let initialLoadDone = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log("Auth state change:", event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const adminStatus = await checkAdminStatus(session.user.id);
          if (mounted) {
            setIsAdmin(adminStatus);
          }
        } else {
          setIsAdmin(false);
        }
        
        // Only set loading false from listener after initial load is done
        if (initialLoadDone && mounted) {
          setLoading(false);
        }
      }
    );

    // Check for existing session
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        console.log("Initial session:", session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const adminStatus = await checkAdminStatus(session.user.id);
          if (mounted) {
            setIsAdmin(adminStatus);
          }
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        initialLoadDone = true;
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    initSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async (userId: string): Promise<boolean> => {
    try {
      console.log("Checking admin status for:", userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      console.log("Admin check result:", data, error);
      
      if (!error && data) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signOut }}>
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
