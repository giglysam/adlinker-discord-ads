import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Users,
  Eye,
  DollarSign,
  Webhook,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Search,
  UserX,
  AlertTriangle,
  Activity,
  TrendingUp,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Ad {
  id: string;
  title: string;
  url: string;
  image_url: string;
  text: string;
  status: 'pending' | 'public' | 'stopped';
  user_id: string;
  created_at: string;
  impressions: number;
  username?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'advertiser' | 'shower' | 'admin';
  balance?: number;
  created_at: string;
  adsCreated?: number;
  webhooks?: number;
}

interface WebhookLog {
  id: string;
  webhook_url: string;
  server_name: string;
  status: 'success' | 'error';
  ad_id: string;
  created_at: string;
  error_message?: string;
}

const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ads, setAds] = useState<Ad[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAds(),
        loadUsers(),
        loadWebhookLogs()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadAds = async () => {
    const { data, error } = await supabase
      .from('ads')
      .select(`
        *,
        users!inner(username)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading ads:', error);
      return;
    }

    const adsWithUsernames = data.map(ad => ({
      ...ad,
      username: ad.users?.username || 'Unknown',
      status: ad.status as 'pending' | 'public' | 'stopped',
      impressions: ad.impressions || 0
    }));

    setAds(adsWithUsernames);
  };

  const loadUsers = async () => {
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error loading users:', usersError);
      return;
    }

    // Get ad counts for advertisers
    const { data: adCounts, error: adCountsError } = await supabase
      .from('ads')
      .select('user_id')
      .eq('status', 'public');

    // Get webhook counts for showers
    const { data: webhookCounts, error: webhookCountsError } = await supabase
      .from('webhooks')
      .select('user_id')
      .eq('is_active', true);

    const adCountsByUser = adCounts?.reduce((acc, ad) => {
      acc[ad.user_id] = (acc[ad.user_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const webhookCountsByUser = webhookCounts?.reduce((acc, webhook) => {
      acc[webhook.user_id] = (acc[webhook.user_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const enrichedUsers = usersData.map(user => ({
      ...user,
      role: user.role as 'advertiser' | 'shower' | 'admin',
      balance: user.balance || 0,
      adsCreated: user.role === 'advertiser' ? adCountsByUser[user.id] || 0 : undefined,
      webhooks: user.role === 'shower' ? webhookCountsByUser[user.id] || 0 : undefined,
    }));

    setUsers(enrichedUsers);
  };

  const loadWebhookLogs = async () => {
    const { data, error } = await supabase
      .from('ad_deliveries')
      .select(`
        id,
        status,
        error_message,
        created_at,
        ad_id,
        webhook_id,
        webhooks!inner(webhook_url, server_name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading webhook logs:', error);
      return;
    }

    const logs = data.map(log => ({
      id: log.id,
      webhook_url: log.webhooks?.webhook_url || '',
      server_name: log.webhooks?.server_name || 'Unknown Server',
      status: log.status as 'success' | 'error',
      ad_id: log.ad_id,
      created_at: log.created_at,
      error_message: log.error_message,
    }));

    setWebhookLogs(logs);
  };

  const handleApproveAd = async (id: string) => {
    const { error } = await supabase
      .from('ads')
      .update({ status: 'public' })
      .eq('id', id);

    if (error) {
      console.error('Error approving ad:', error);
      toast.error('Failed to approve ad');
      return;
    }

    setAds(ads.map(ad => 
      ad.id === id ? { ...ad, status: 'public' as const } : ad
    ));
    toast.success('Ad approved and made public');
  };

  const handleStopAd = async (id: string) => {
    const { error } = await supabase
      .from('ads')
      .update({ status: 'stopped' })
      .eq('id', id);

    if (error) {
      console.error('Error stopping ad:', error);
      toast.error('Failed to stop ad');
      return;
    }

    setAds(ads.map(ad => 
      ad.id === id ? { ...ad, status: 'stopped' as const } : ad
    ));
    toast.success('Ad stopped');
  };

  const handleDeleteAd = async (id: string) => {
    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting ad:', error);
      toast.error('Failed to delete ad');
      return;
    }

    setAds(ads.filter(ad => ad.id !== id));
    toast.success('Ad deleted');
  };

  const handleDeleteUser = async (id: string) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
      return;
    }

    setUsers(users.filter(user => user.id !== id));
    toast.success('User deleted');
  };

  const handleUpdateBalance = async (id: string, newBalance: number) => {
    const { error } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', id);

    if (error) {
      console.error('Error updating balance:', error);
      toast.error('Failed to update balance');
      return;
    }

    setUsers(users.map(user => 
      user.id === id ? { ...user, balance: newBalance } : user
    ));
    toast.success('Balance updated');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50';
      case 'public':
        return 'bg-green-900/30 text-green-400 border-green-500/50';
      case 'stopped':
        return 'bg-red-900/30 text-red-400 border-red-500/50';
      case 'success':
        return 'bg-green-900/30 text-green-400 border-green-500/50';
      case 'error':
        return 'bg-red-900/30 text-red-400 border-red-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'public':
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'stopped':
      case 'error':
        return <XCircle className="w-4 h-4" />;
    }
  };

  const pendingAds = ads.filter(ad => ad.status === 'pending').length;
  const publicAds = ads.filter(ad => ad.status === 'public').length;
  const totalUsers = users.length;
  const totalBalance = users.reduce((sum, user) => sum + (user.balance || 0), 0);
  const successfulDeliveries = webhookLogs.filter(log => log.status === 'success').length;
  const errorDeliveries = webhookLogs.filter(log => log.status === 'error').length;

  const filteredAds = ads.filter(ad => 
    ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ad.username && ad.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage ads, users, and system monitoring</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs">Pending Ads</p>
                  <p className="text-xl font-bold text-yellow-400">{pendingAds}</p>
                </div>
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs">Public Ads</p>
                  <p className="text-xl font-bold text-green-400">{publicAds}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs">Total Users</p>
                  <p className="text-xl font-bold text-white">{totalUsers}</p>
                </div>
                <Users className="w-5 h-5 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs">Total Balance</p>
                  <p className="text-xl font-bold text-green-400">${totalBalance.toFixed(5)}</p>
                </div>
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs">Successful</p>
                  <p className="text-xl font-bold text-green-400">{successfulDeliveries}</p>
                </div>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs">Errors</p>
                  <p className="text-xl font-bold text-red-400">{errorDeliveries}</p>
                </div>
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search ads, users, or webhooks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="ads" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="ads" className="data-[state=active]:bg-gray-700">
              Ads Management
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-700">
              Users Management
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="data-[state=active]:bg-gray-700">
              Webhook Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ads" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Advertisement Management</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredAds.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    {searchTerm ? 'No ads found matching your search.' : 'No ads created yet.'}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredAds.map((ad) => (
                      <div key={ad.id} className="flex items-start space-x-4 p-4 bg-gray-700/50 rounded-lg">
                        {ad.image_url && (
                          <img
                            src={ad.image_url}
                            alt={ad.title}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-white font-semibold">{ad.title}</h3>
                              <p className="text-gray-400 text-sm">by {ad.username}</p>
                            </div>
                            <Badge className={getStatusColor(ad.status)}>
                              {getStatusIcon(ad.status)}
                              <span className="ml-1 capitalize">{ad.status}</span>
                            </Badge>
                          </div>
                          <p className="text-gray-300 text-sm mb-2">{ad.text}</p>
                          <a
                            href={ad.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 text-sm hover:underline mb-2 inline-block"
                          >
                            {ad.url}
                          </a>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-400">
                              Created: {new Date(ad.created_at).toLocaleDateString()} | Impressions: {ad.impressions}
                            </div>
                            <div className="flex space-x-2">
                              {ad.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveAd(ad.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Approve
                                </Button>
                              )}
                              {ad.status === 'public' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStopAd(ad.id)}
                                  className="border-yellow-600 text-yellow-600 hover:bg-yellow-600"
                                >
                                  Stop
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteAd(ad.id)}
                                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredUsers.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    {searchTerm ? 'No users found matching your search.' : 'No users registered yet.'}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-white font-semibold">{user.username}</h3>
                            <Badge className={
                              user.role === 'advertiser' ? 'bg-blue-900/30 text-blue-400' : 
                              user.role === 'admin' ? 'bg-purple-900/30 text-purple-400' :
                              'bg-green-900/30 text-green-400'
                            }>
                              {user.role}
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-sm mb-1">{user.email}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                            {user.role === 'advertiser' && <span>Ads: {user.adsCreated}</span>}
                            {user.role === 'shower' && (
                              <>
                                <span>Balance: ${(user.balance || 0).toFixed(5)}</span>
                                <span>Webhooks: {user.webhooks}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {user.role === 'shower' && (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                step="0.00001"
                                placeholder="New balance"
                                className="w-32 bg-gray-700 border-gray-600 text-white text-sm"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    const target = e.target as HTMLInputElement;
                                    handleUpdateBalance(user.id, parseFloat(target.value) || 0);
                                    target.value = '';
                                  }
                                }}
                              />
                            </div>
                          )}
                          {user.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user.id)}
                              className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Webhook Delivery Logs</CardTitle>
              </CardHeader>
              <CardContent>
                {webhookLogs.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    No webhook deliveries yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {webhookLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Badge className={getStatusColor(log.status)}>
                            {getStatusIcon(log.status)}
                            <span className="ml-1 capitalize">{log.status}</span>
                          </Badge>
                          <div>
                            <p className="text-white text-sm font-medium">{log.server_name}</p>
                            <p className="text-gray-400 text-xs truncate max-w-md">{log.webhook_url}</p>
                            {log.error_message && (
                              <p className="text-red-400 text-xs">Error: {log.error_message}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-xs">Ad ID: {log.ad_id}</p>
                          <p className="text-gray-500 text-xs">{new Date(log.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
