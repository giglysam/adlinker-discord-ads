
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  DollarSign, 
  TrendingUp, 
  Activity,
  Phone
} from 'lucide-react';
import WebhookSetup from './WebhookSetup';
import WebhookMonitor from './WebhookMonitor';

const AdShowerDashboard = () => {
  const { user, refreshUser } = useAuth();

  // Enhanced real-time balance updates with more frequent refresh
  useEffect(() => {
    if (!user?.id || !refreshUser) return;

    // Refresh user data every 5 seconds for immediate updates
    const balanceInterval = setInterval(() => {
      refreshUser();
    }, 5000);

    // Set up real-time subscription for user balance changes
    const userChannel = supabase
      .channel('user_balance_changes')
      .on('postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time user balance updated:', payload.new);
          // Immediately refresh user data when balance changes
          refreshUser();
        }
      )
      .subscribe();

    // Set up real-time subscription for new ad deliveries to this user's webhooks
    const deliveryChannel = supabase
      .channel('ad_delivery_updates')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ad_deliveries' },
        async (payload) => {
          console.log('New ad delivery detected:', payload.new);
          
          // Check if this delivery is for one of the user's webhooks
          const { data: webhook } = await supabase
            .from('webhooks')
            .select('user_id')
            .eq('id', payload.new.webhook_id)
            .eq('user_id', user.id)
            .single();
            
          if (webhook) {
            console.log('Ad delivery for current user, refreshing balance immediately');
            // Immediate refresh when user earns money
            refreshUser();
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(balanceInterval);
      supabase.removeChannel(userChannel);
      supabase.removeChannel(deliveryChannel);
    };
  }, [user?.id, refreshUser]);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Ad Shower Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage your Discord webhooks and track earnings</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Current Balance</p>
                  <p className="text-2xl font-bold text-green-400">${(user?.balance || 0).toFixed(5)}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-xs text-green-400">Live updates every 5 seconds</p>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Earning Rate</p>
                  <p className="text-2xl font-bold text-white">$0.00001</p>
                  <p className="text-xs text-gray-500">per ad delivered</p>
                </div>
                <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Max Webhooks</p>
                  <p className="text-2xl font-bold text-white">3</p>
                  <p className="text-xs text-gray-500">webhook slots available</p>
                </div>
                <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Webhook Health Monitor */}
        <WebhookMonitor />

        {/* Webhook Setup */}
        <WebhookSetup />

        {/* Enhanced Cashout Info */}
        <Card className="bg-blue-900/20 border-blue-500/50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Phone className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-blue-400 font-semibold mb-2">Ready to Cash Out?</h3>
                <p className="text-gray-300 mb-3">
                  Your balance updates automatically every time an ad is delivered to your webhooks. 
                  Current balance: <span className="text-green-400 font-bold">${(user?.balance || 0).toFixed(5)}</span>
                </p>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Contact Admin:</p>
                  <p className="text-white font-mono">+961 71831770</p>
                  <p className="text-gray-400 text-xs mt-1">WhatsApp available</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Distribution Status */}
        <Card className="bg-green-900/20 border-green-500/50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <div>
                <h3 className="text-green-400 font-semibold">Live Ad Distribution System</h3>
                <p className="text-gray-300 text-sm">
                  Ads are being sent to your webhooks every minute, 24/7. Earnings are added to your balance instantly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdShowerDashboard;
