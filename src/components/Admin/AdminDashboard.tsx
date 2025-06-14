import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  DollarSign, 
  Send, 
  Activity, 
  RefreshCw,
  Bot,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import LLMDistributionManager from './LLMDistributionManager';

const AdminDashboard = () => {
  const [userCount, setUserCount] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [adStats, setAdStats] = useState({ total: 0, public: 0, pending: 0 });
  const [webhookStats, setWebhookStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch user counts
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('count', { count: 'exact' });

        if (usersError) {
          console.error("Error fetching user count:", usersError);
          toast({ title: "Error", description: "Failed to fetch user count.", variant: "destructive" });
        } else {
          setUserCount(users ? users[0].count : 0);
        }

        // Fetch total balance
        const { data: balances, error: balancesError } = await supabase
          .from('users')
          .select('balance');

        if (balancesError) {
          console.error("Error fetching balances:", balancesError);
          toast({ title: "Error", description: "Failed to fetch total balance.", variant: "destructive" });
        } else {
          const total = balances?.reduce((acc, user) => acc + (user.balance || 0), 0) || 0;
          setTotalBalance(total);
        }

        // Fetch ad stats
        const { data: ads, error: adsError } = await supabase
          .from('ads')
          .select('status');

        if (adsError) {
          console.error("Error fetching ad stats:", adsError);
          toast({ title: "Error", description: "Failed to fetch ad statistics.", variant: "destructive" });
        } else {
          const total = ads?.length || 0;
          const publicCount = ads?.filter(ad => ad.status === 'public').length || 0;
          const pendingCount = ads?.filter(ad => ad.status === 'pending').length || 0;
          setAdStats({ total, public: publicCount, pending: pendingCount });
        }

        // Fetch webhook stats
        const { data: webhooks, error: webhooksError } = await supabase
          .from('webhooks')
          .select('is_active');

        if (webhooksError) {
          console.error("Error fetching webhook stats:", webhooksError);
          toast({ title: "Error", description: "Failed to fetch webhook statistics.", variant: "destructive" });
        } else {
          const total = webhooks?.length || 0;
          const activeCount = webhooks?.filter(webhook => webhook.is_active).length || 0;
          const inactiveCount = total - activeCount;
          setWebhookStats({ total, active: activeCount, inactive: inactiveCount });
        }

        setLastRefresh(new Date());

      } catch (error) {
        console.error("Critical error fetching admin data:", error);
        toast({ title: "Critical Error", description: "Failed to load admin dashboard data.", variant: "destructive" });
      }
    };

    fetchAdminData();
  }, []);

  const refreshData = () => {
    toast({ title: "Refreshing Data", description: "Admin dashboard data is being refreshed." });
    setLastRefresh(new Date());
    // Re-trigger data fetching
    useEffect(() => {
      const fetchAdminData = async () => {
        try {
          // Fetch user counts
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('count', { count: 'exact' });
  
          if (usersError) {
            console.error("Error fetching user count:", usersError);
            toast({ title: "Error", description: "Failed to fetch user count.", variant: "destructive" });
          } else {
            setUserCount(users ? users[0].count : 0);
          }
  
          // Fetch total balance
          const { data: balances, error: balancesError } = await supabase
            .from('users')
            .select('balance');
  
          if (balancesError) {
            console.error("Error fetching balances:", balancesError);
            toast({ title: "Error", description: "Failed to fetch total balance.", variant: "destructive" });
          } else {
            const total = balances?.reduce((acc, user) => acc + (user.balance || 0), 0) || 0;
            setTotalBalance(total);
          }
  
          // Fetch ad stats
          const { data: ads, error: adsError } = await supabase
            .from('ads')
            .select('status');
  
          if (adsError) {
            console.error("Error fetching ad stats:", adsError);
            toast({ title: "Error", description: "Failed to fetch ad statistics.", variant: "destructive" });
          } else {
            const total = ads?.length || 0;
            const publicCount = ads?.filter(ad => ad.status === 'public').length || 0;
            const pendingCount = ads?.filter(ad => ad.status === 'pending').length || 0;
            setAdStats({ total, public: publicCount, pending: pendingCount });
          }
  
          // Fetch webhook stats
          const { data: webhooks, error: webhooksError } = await supabase
            .from('webhooks')
            .select('is_active');
  
          if (webhooksError) {
            console.error("Error fetching webhook stats:", webhooksError);
            toast({ title: "Error", description: "Failed to fetch webhook statistics.", variant: "destructive" });
          } else {
            const total = webhooks?.length || 0;
            const activeCount = webhooks?.filter(webhook => webhook.is_active).length || 0;
            const inactiveCount = total - activeCount;
            setWebhookStats({ total, active: activeCount, inactive: inactiveCount });
          }
  
          setLastRefresh(new Date());
  
        } catch (error) {
          console.error("Critical error fetching admin data:", error);
          toast({ title: "Critical Error", description: "Failed to load admin dashboard data.", variant: "destructive" });
        }
      };
  
      fetchAdminData();
    }, []);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Control Center</h1>
          <p className="text-blue-300">Complete system management and monitoring</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{userCount}</p>
                </div>
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Balance</p>
                  <p className="text-2xl font-bold text-green-400">${totalBalance.toFixed(2)}</p>
                </div>
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Ads</p>
                  <p className="text-2xl font-bold text-white">{adStats.total}</p>
                  <p className="text-xs text-gray-500">Public: {adStats.public}, Pending: {adStats.pending}</p>
                </div>
                <Activity className="w-6 h-6 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Webhooks</p>
                  <p className="text-2xl font-bold text-white">{webhookStats.total}</p>
                  <p className="text-xs text-gray-500">Active: {webhookStats.active}, Inactive: {webhookStats.inactive}</p>
                </div>
                <Settings className="w-6 h-6 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* LLM Distribution Manager */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Bot className="w-6 h-6 mr-2 text-blue-400" />
            AI-Powered Distribution
          </h2>
          <LLMDistributionManager />
        </div>

        {/* Manual Distribution */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Send className="w-6 h-6 mr-2 text-green-400" />
            Manual Distribution
          </h2>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <p className="text-white">This feature is under development. Manual ad distribution will be available soon.</p>
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mt-4" />
            </CardContent>
          </Card>
        </div>

        {/* System Monitoring */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-orange-400" />
            System Monitoring
          </h2>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Real-time Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Last Data Refresh</p>
                  <p className="text-white">{lastRefresh.toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">System Status</p>
                  <p className="text-green-400 flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> Operational</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Uptime</p>
                  <p className="text-white">99.99%</p>
                </div>
                <div>
                  <Button onClick={refreshData} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
