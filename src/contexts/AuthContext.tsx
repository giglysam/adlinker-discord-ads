import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'advertiser' | 'shower' | 'admin';
  balance?: number;
  webhookNotice?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signup: (username: string, email: string, password: string, role: 'advertiser' | 'shower') => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Check for existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
          return;
        }
        
        if (session?.user && mounted) {
          console.log('Found existing session for:', session.user.email);
          await loadUserProfile(session.user);
        } else {
          console.log('No existing session found');
        }
        
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (!mounted || !initialized) return;
      
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Loading user profile for:', supabaseUser.email);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        setLoading(false);
        return;
      }

      if (data) {
        console.log('User profile loaded:', data);
        setUser({
          id: data.id,
          username: data.username,
          email: data.email,
          role: data.role as 'advertiser' | 'shower' | 'admin',
          balance: data.balance || 0,
          webhookNotice: data.webhook_notice,
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login for:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error.message);
        setLoading(false);
        return false;
      }

      if (data.user) {
        console.log('Login successful for:', email);
        // Force a page reload to reset the application state
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
        return true;
      }
      
      setLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return false;
    }
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('Attempting Google sign in...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });

      if (error) {
        console.error('Google sign in error:', error.message);
        setLoading(false);
        return false;
      }

      // OAuth flow will handle the redirect
      return true;
    } catch (error) {
      console.error('Google sign in error:', error);
      setLoading(false);
      return false;
    }
  };

  const signup = async (username: string, email: string, password: string, role: 'advertiser' | 'shower'): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('Attempting signup for:', email);
      
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username,
            role,
          }
        }
      });

      if (authError) {
        console.error('Signup auth error:', authError.message);
        setLoading(false);
        return false;
      }

      if (!authData.user) {
        console.error('No user returned from signup');
        setLoading(false);
        return false;
      }

      // Then create the user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          username,
          email,
          role,
          balance: role === 'shower' ? 0 : null,
          password_hash: '',
        });

      if (profileError) {
        console.error('Profile creation error:', profileError.message);
        await supabase.auth.signOut();
        setLoading(false);
        return false;
      }

      console.log('Signup successful for:', email);
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error.message);
      }
      setUser(null);
      setLoading(false);
      // Force a page reload to reset the application state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      setLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: updates.username,
          balance: updates.balance,
          webhook_notice: updates.webhookNotice,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Update user error:', error.message);
        return;
      }

      setUser({ ...user, ...updates });
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  const refreshUser = async () => {
    if (!user) return;
  
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
  
      if (error) {
        console.error('Error refreshing user:', error.message);
        return;
      }
  
      if (data) {
        setUser({
          ...user,
          username: data.username || user.username,
          email: data.email || user.email,
          role: (data.role as 'advertiser' | 'shower' | 'admin') || user.role,
          balance: data.balance || user.balance,
          webhookNotice: data.webhook_notice || user.webhookNotice,
        });
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signInWithGoogle,
      signup, 
      logout, 
      updateUser, 
      refreshUser, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
