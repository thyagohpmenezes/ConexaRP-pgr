import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';

interface UserProfile {
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar sessão atual ao montar o componente
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSession = (session: Session | null) => {
    if (session?.user) {
      setUser(session.user);
      
      // Regra SuperAdmin Hardcoded
      const isSuperAdmin = session.user.email === 'thyagohpmenezes@gmail.com';
      
      setProfile({
        email: session.user.email || '',
        role: isSuperAdmin ? 'SuperAdmin' : 'Auditor'
      });
    } else {
      setUser(null);
      setProfile(null);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
