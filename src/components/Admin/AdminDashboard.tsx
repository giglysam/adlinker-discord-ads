
import React, { useState } from 'react';
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

interface Ad {
  id: number;
  title: string;
  url: string;
  imageUrl: string;
  text: string;
  status: 'pending' | 'public' | 'stopped';
  advertiser: string;
  createdAt: string;
  impressions: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: 'advertiser' | 'shower';
  balance?: number;
  adsCreated?: number;
  webhooks?: number;
  joinedAt: string;
}

interface WebhookLog {
  id: number;
  webhook: string;
  server: string;
  status: 'success' | 'error';
  adId: number;
  timestamp: string;
  errorMessage?: string;
}

const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ads, setAds] = useState<Ad[]>([
    {
      id: 1,
      title: 'Gaming Website',
      url: 'https://mygamingsite.com',
      imageUrl: 'https://images.unsplash.com/photo-1538481199464-7160b8b05f62?w=400',
      text: 'Check out the best gaming content and reviews!',
      status: 'pending',
      advertiser: 'gamer123',
      createdAt: '2024-01-15',
      impressions: 0,
    },
    {
      id: 2,
      title: 'Tech Blog',
      url: 'https://mytechblog.com',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
      text: 'Latest tech news and tutorials for developers.',
      status: 'public',
      advertiser: 'techwriter',
      createdAt: '2024-01-10',
      impressions: 1250,
    },
  ]);

  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      username: 'gamer123',
      email: 'gamer@example.com',
      role: 'advertiser',
      adsCreated: 3,
      joinedAt: '2024-01-10',
    },
    {
      id: 2,
      username: 'shower1',
      email: 'shower@example.com',
      role: 'shower',
      balance: 0.00045,
      webhooks: 2,
      joinedAt: '2024-01-05',
    },
  ]);

  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([
    {
      id: 1,
      webhook: 'https://discord.com/api/webhooks/123/abc',
      server: 'Gaming Community',
      status: 'success',
      adId: 2,
      timestamp: '2024-01-15 14:30:00',
    },
    {
      id: 2,
      webhook: 'https://discord.com/api/webhooks/456/def',
      server: 'Tech Discussion',
      status: 'error',
      adId: 2,
      timestamp: '2024-01-15 14:27:00',
      errorMessage: 'Webhook permissions denied',
    },
  ]);

  const handleApproveAd = (id: number) => {
    setAds(ads.map(ad => 
      ad.id === id ? { ...ad, status: 'public' as const } : ad
    ));
    toast.success('Ad approved and made public');
  };

  const handleStopAd = (id: number) => {
    setAds(ads.map(ad => 
      ad.id === id ? { ...ad, status: 'stopped' as const } : ad
    ));
    toast.success('Ad stopped');
  };

  const handleDeleteAd = (id: number) => {
    setAds(ads.filter(ad => ad.id !== id));
    toast.success('Ad deleted');
  };

  const handleDeleteUser = (id: number) => {
    setUsers(users.filter(user => user.id !== id));
    toast.success('User deleted');
  };

  const handleUpdateBalance = (id: number, newBalance: number) => {
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
    ad.advertiser.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <div className="space-y-4">
                  {filteredAds.map((ad) => (
                    <div key={ad.id} className="flex items-start space-x-4 p-4 bg-gray-700/50 rounded-lg">
                      <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-white font-semibold">{ad.title}</h3>
                            <p className="text-gray-400 text-sm">by {ad.advertiser}</p>
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
                            Created: {ad.createdAt} | Impressions: {ad.impressions}
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-white font-semibold">{user.username}</h3>
                          <Badge className={user.role === 'advertiser' ? 'bg-blue-900/30 text-blue-400' : 'bg-green-900/30 text-green-400'}>
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm mb-1">{user.email}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>Joined: {user.joinedAt}</span>
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteUser(user.id)}
                          className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Webhook Delivery Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {webhookLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge className={getStatusColor(log.status)}>
                          {getStatusIcon(log.status)}
                          <span className="ml-1 capitalize">{log.status}</span>
                        </Badge>
                        <div>
                          <p className="text-white text-sm font-medium">{log.server}</p>
                          <p className="text-gray-400 text-xs">{log.webhook}</p>
                          {log.errorMessage && (
                            <p className="text-red-400 text-xs">Error: {log.errorMessage}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-xs">Ad ID: {log.adId}</p>
                        <p className="text-gray-500 text-xs">{log.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
