
import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, DollarSign, Plus, Monitor } from 'lucide-react';

const Navbar = () => {
  const { user, logout, refreshUser } = useAuth();

  // Enhanced real-time balance updates for navbar
  useEffect(() => {
    if (!user?.id || user.role !== 'shower' || !refreshUser) return;

    // Set up real-time subscription for user balance changes in navbar
    const userChannel = supabase
      .channel('navbar_user_balance')
      .on('postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('Navbar: User balance updated:', payload.new);
          refreshUser();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
    };
  }, [user?.id, user?.role, refreshUser]);

  if (!user) return null;

  const getRoleIcon = () => {
    switch (user.role) {
      case 'advertiser':
        return <Plus className="w-4 h-4" />;
      case 'shower':
        return <Monitor className="w-4 h-4" />;
      case 'admin':
        return <Settings className="w-4 h-4" />;
    }
  };

  const getRoleColor = () => {
    switch (user.role) {
      case 'advertiser':
        return 'text-blue-400';
      case 'shower':
        return 'text-green-400';
      case 'admin':
        return 'text-purple-400';
    }
  };

  return (
    <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DA</span>
              </div>
              <span className="text-white font-bold text-xl">DiscordAdNet</span>
            </div>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-800 ${getRoleColor()}`}>
              {getRoleIcon()}
              <span className="text-sm font-medium capitalize">{user.role}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user.role === 'shower' && user.balance !== undefined && (
              <div className="flex items-center space-x-2 bg-green-900/30 px-3 py-1 rounded-full">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-medium">${user.balance.toFixed(5)}</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Live balance updates"></div>
              </div>
            )}
            <div className="text-gray-300">
              Welcome, <span className="text-white font-medium">{user.username}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="text-gray-300 hover:text-white">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
