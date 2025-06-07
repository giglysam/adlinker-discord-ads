
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { 
  DollarSign, 
  Webhook, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  ExternalLink,
  Clock,
  Phone,
  Activity
} from 'lucide-react';

interface WebhookEntry {
  id: number;
  url: string;
  serverName: string;
  status: 'active' | 'error' | 'pending';
  adsDelivered: number;
  lastDelivery: string;
  errorMessage?: string;
}

const AdShowerDashboard = () => {
  const { user, updateUser } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([
    {
      id: 1,
      url: 'https://discord.com/api/webhooks/123/abc',
      serverName: 'Gaming Community',
      status: 'active',
      adsDelivered: 145,
      lastDelivery: '2 minutes ago',
    },
    {
      id: 2,
      url: 'https://discord.com/api/webhooks/456/def',
      serverName: 'Tech Discussion',
      status: 'error',
      adsDelivered: 23,
      lastDelivery: '1 hour ago',
      errorMessage: 'Webhook permissions denied',
    },
  ]);

  const [newWebhook, setNewWebhook] = useState({
    url: '',
    serverName: '',
  });

  const [showAddForm, setShowAddForm] = useState(false);

  const totalAdsDelivered = webhooks.reduce((sum, webhook) => sum + webhook.adsDelivered, 0);
  const activeWebhooks = webhooks.filter(w => w.status === 'active').length;
  const errorWebhooks = webhooks.filter(w => w.status === 'error').length;

  const handleAddWebhook = () => {
    if (!newWebhook.url || !newWebhook.serverName) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!newWebhook.url.includes('discord.com/api/webhooks/')) {
      toast.error('Please enter a valid Discord webhook URL');
      return;
    }

    const webhook: WebhookEntry = {
      id: Date.now(),
      url: newWebhook.url,
      serverName: newWebhook.serverName,
      status: 'pending',
      adsDelivered: 0,
      lastDelivery: 'Never',
    };

    setWebhooks([webhook, ...webhooks]);
    setNewWebhook({ url: '', serverName: '' });
    setShowAddForm(false);
    toast.success('Webhook added! It will be verified shortly.');
  };

  const handleRemoveWebhook = (id: number) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
    toast.success('Webhook removed');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/30 text-green-400 border-green-500/50';
      case 'error':
        return 'bg-red-900/30 text-red-400 border-red-500/50';
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50';
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Ad Shower Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage your Discord webhooks and track earnings</p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Webhook
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Current Balance</p>
                  <p className="text-2xl font-bold text-green-400">${(user?.balance || 0).toFixed(5)}</p>
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
                  <p className="text-gray-400 text-sm">Active Webhooks</p>
                  <p className="text-2xl font-bold text-white">{activeWebhooks}</p>
                </div>
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Webhook className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Ads Delivered</p>
                  <p className="text-2xl font-bold text-white">{totalAdsDelivered}</p>
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
                  <p className="text-gray-400 text-sm">Estimated Daily</p>
                  <p className="text-2xl font-bold text-white">${(activeWebhooks * 0.00001 * 480).toFixed(5)}</p>
                </div>
                <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Webhooks Alert */}
        {errorWebhooks > 0 && (
          <Card className="bg-red-900/20 border-red-500/50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <AlertTriangle className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-red-400 font-semibold mb-2">Webhook Issues Detected</h3>
                  <p className="text-gray-300 mb-3">
                    {errorWebhooks} of your webhooks are experiencing errors and not receiving ads.
                    Please check your Discord bot permissions and webhook settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cashout Info */}
        <Card className="bg-blue-900/20 border-blue-500/50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Phone className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-blue-400 font-semibold mb-2">Ready to Cash Out?</h3>
                <p className="text-gray-300 mb-3">
                  Contact our admin to request a payout of your current balance: ${(user?.balance || 0).toFixed(5)}
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

        {/* Add Webhook Form */}
        {showAddForm && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Add New Webhook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Server Name"
                  value={newWebhook.serverName}
                  onChange={(e) => setNewWebhook({ ...newWebhook, serverName: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Input
                  type="url"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="flex space-x-3">
                <Button onClick={handleAddWebhook} className="bg-green-600 hover:bg-green-700">
                  Add Webhook
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Webhooks List */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Your Discord Webhooks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-white font-semibold">{webhook.serverName}</h3>
                      <Badge className={getStatusColor(webhook.status)}>
                        {getStatusIcon(webhook.status)}
                        <span className="ml-1 capitalize">{webhook.status}</span>
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-sm font-mono mb-2">{webhook.url}</p>
                    {webhook.errorMessage && (
                      <p className="text-red-400 text-sm mb-2">⚠️ {webhook.errorMessage}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>Ads Delivered: {webhook.adsDelivered}</span>
                      <span>Last Delivery: {webhook.lastDelivery}</span>
                      <span>Earned: ${(webhook.adsDelivered * 0.00001).toFixed(5)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveWebhook(webhook.id)}
                      className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              {webhooks.length === 0 && (
                <div className="text-center py-8">
                  <Webhook className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No webhooks added yet</p>
                  <p className="text-gray-500 text-sm">Add your first Discord webhook to start earning</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdShowerDashboard;
