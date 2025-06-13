import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Webhook, CheckCircle, ExternalLink, Trash2, Activity, TrendingUp, AlertCircle, Timer, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface WebhookData {
  id: string;
  webhook_url: string;
  server_name: string;
  is_active: boolean;
  created_at: string;
  total_sent: number;
  total_errors: number;
  last_success_at: string;
  last_sent_at: string;
  last_error: string;
  user_id: string;
}

const WebhookSetup = () => {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [automationStatus, setAutomationStatus] = useState<'running' | 'stopped' | 'checking'>('checking');
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    serverName: '',
  });

  const MAX_WEBHOOKS = 3;

  useEffect(() => {
    if (user?.id) {
      console.log('Loading webhooks for user:', user.id);
      loadWebhooks();
      checkAutomationStatus();
      
      // Set up interval to check automation status every 30 seconds
      const interval = setInterval(checkAutomationStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const checkAutomationStatus = async () => {
    try {
      console.log('Checking automation status...');
      
      // Check if there are any active webhooks and public ads
      const { data: webhookCount, error: webhookError } = await supabase
        .from('webhooks')
        .select('id', { count: 'exact' })
        .eq('is_active', true);

      const { data: adCount, error: adError } = await supabase
        .from('ads')
        .select('id', { count: 'exact' })
        .eq('status', 'public');

      if (webhookError) {
        console.error('Error checking webhooks:', webhookError);
      }
      if (adError) {
        console.error('Error checking ads:', adError);
      }

      console.log(`Found ${webhookCount?.length || 0} active webhooks and ${adCount?.length || 0} public ads`);

      if (webhookCount && adCount && webhookCount.length > 0 && adCount.length > 0) {
        setAutomationStatus('running');
      } else {
        setAutomationStatus('stopped');
      }
    } catch (error) {
      console.error('Error checking automation status:', error);
      setAutomationStatus('stopped');
    }
  };

  const loadWebhooks = async () => {
    if (!user?.id) {
      console.log('No user ID, skipping webhook load');
      return;
    }

    try {
      console.log('Loading webhooks for user:', user.id);
      
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading webhooks:', error);
        toast.error('Failed to load webhook slots: ' + error.message);
        return;
      }

      console.log('Successfully loaded webhooks:', data);
      setWebhooks(data || []);
    } catch (error) {
      console.error('Error loading webhooks:', error);
      toast.error('Failed to load webhook slots');
    } finally {
      setInitialLoading(false);
    }
  };

  const validateDiscordWebhook = (url: string): boolean => {
    // Strict Discord webhook URL validation
    const discordWebhookRegex = /^https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d{17,19}\/[\w-]{68}$/;
    return discordWebhookRegex.test(url);
  };

  const testWebhookWithAPI = async (webhookUrl: string): Promise<boolean> => {
    try {
      console.log('Testing webhook via API:', webhookUrl.slice(0, 50) + '...');
      
      const { data, error } = await supabase.functions.invoke('send-test-ad', {
        body: { webhookUrl }
      });

      if (error) {
        console.error('API test error:', error);
        toast.error('Webhook test failed: ' + error.message);
        return false;
      }

      if (data?.success) {
        console.log('Webhook test successful:', data);
        toast.success('Webhook test successful!');
        return true;
      } else {
        console.error('Webhook test failed:', data);
        toast.error('Webhook test failed: ' + (data?.error || 'Unknown error'));
        return false;
      }
    } catch (error) {
      console.error('Webhook test failed:', error);
      toast.error('Webhook test failed: ' + error.message);
      return false;
    }
  };

  const addWebhook = async () => {
    if (!newWebhook.url || !newWebhook.serverName) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    if (webhooks.length >= MAX_WEBHOOKS) {
      toast.error(`Maximum ${MAX_WEBHOOKS} webhook slots allowed`);
      return;
    }

    if (!validateDiscordWebhook(newWebhook.url)) {
      toast.error('Please enter a valid Discord webhook URL (format: https://discord.com/api/webhooks/ID/TOKEN)');
      return;
    }

    // Check if webhook URL already exists for this user
    const existingWebhook = webhooks.find(w => w.webhook_url === newWebhook.url);
    if (existingWebhook) {
      toast.error('This webhook URL is already added to your slots');
      return;
    }

    setLoading(true);
    try {
      console.log('Adding webhook for user:', user.id, 'Server:', newWebhook.serverName);
      
      // Test the webhook using the API before adding it
      toast.info('Testing webhook connection...');
      const isWorking = await testWebhookWithAPI(newWebhook.url);
      
      if (!isWorking) {
        setLoading(false);
        return;
      }

      // Add webhook to database with user ID
      const webhookData = {
        user_id: user.id,
        webhook_url: newWebhook.url,
        server_name: newWebhook.serverName,
        is_active: true,
        total_sent: 0,
        total_errors: 0
      };

      console.log('Inserting webhook data:', webhookData);

      const { data, error } = await supabase
        .from('webhooks')
        .insert(webhookData)
        .select()
        .single();

      if (error) {
        console.error('Error saving webhook to database:', error);
        toast.error('Failed to save webhook slot: ' + error.message);
        return;
      }

      console.log('Webhook slot saved successfully:', data);
      
      // Update local state
      setWebhooks([data, ...webhooks]);
      setNewWebhook({ url: '', serverName: '' });
      toast.success(`Webhook slot "${newWebhook.serverName}" created and activated successfully! Ready to receive ads.`);
      
      // Check automation status and trigger first distribution
      setTimeout(async () => {
        await checkAutomationStatus();
        await triggerManualDistribution();
      }, 1000);

    } catch (error) {
      console.error('Error adding webhook slot:', error);
      toast.error('Failed to add webhook slot: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeWebhook = async (id: string, serverName: string) => {
    try {
      console.log('Removing webhook slot:', id, serverName);
      
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id); // Extra security check

      if (error) {
        console.error('Error removing webhook:', error);
        toast.error('Failed to remove webhook slot: ' + error.message);
        return;
      }

      setWebhooks(webhooks.filter(w => w.id !== id));
      toast.success(`Webhook slot "${serverName}" removed successfully`);
      checkAutomationStatus();
    } catch (error) {
      console.error('Error removing webhook slot:', error);
      toast.error('Failed to remove webhook slot: ' + error.message);
    }
  };

  const testWebhook = async (webhookUrl: string) => {
    await testWebhookWithAPI(webhookUrl);
  };

  const triggerManualDistribution = async () => {
    try {
      setLoading(true);
      console.log('Triggering manual ad distribution...');
      
      const { data, error } = await supabase.functions.invoke('distribute-ads');

      if (error) {
        console.error('Distribution trigger failed:', error);
        toast.error('Failed to trigger ad distribution: ' + error.message);
        return;
      }

      console.log('Distribution triggered successfully:', data);
      toast.success('Ad distribution triggered successfully!');
      loadWebhooks(); // Refresh to see updated stats
    } catch (error) {
      console.error('Error triggering distribution:', error);
      toast.error('Failed to trigger ad distribution: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatLastSent = (timestamp: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getAvailableSlots = () => MAX_WEBHOOKS - webhooks.length;

  if (initialLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-white text-center">Loading your webhook slots...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Webhook className="w-5 h-5" />
            <span>Discord Webhook Slots ({webhooks.length}/{MAX_WEBHOOKS})</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={
              automationStatus === 'running' ? 'bg-green-900/30 text-green-400' :
              automationStatus === 'stopped' ? 'bg-red-900/30 text-red-400' :
              'bg-yellow-900/30 text-yellow-400'
            }>
              {automationStatus === 'running' && <Activity className="w-3 h-3 mr-1" />}
              {automationStatus === 'stopped' && <AlertCircle className="w-3 h-3 mr-1" />}
              {automationStatus === 'checking' && <Timer className="w-3 h-3 mr-1" />}
              Automation {automationStatus}
            </Badge>
          </div>
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Create up to 3 webhook slots for your Discord servers. All webhooks are tested and immediately active.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Real-time Automation Status */}
        <div className="p-4 bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium">System Status</h3>
            <Button
              size="sm"
              onClick={triggerManualDistribution}
              disabled={loading || automationStatus === 'stopped'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Send Ads Now
            </Button>
          </div>
          <div className="text-sm text-gray-300">
            {automationStatus === 'running' && (
              <p className="text-green-400">✅ System is active - ads are being distributed automatically to your {webhooks.filter(w => w.is_active).length} active webhook slots</p>
            )}
            {automationStatus === 'stopped' && (
              <p className="text-red-400">⚠️ System is inactive - add working webhook slots to start earning</p>
            )}
            {automationStatus === 'checking' && (
              <p className="text-yellow-400">🔄 Checking system status...</p>
            )}
          </div>
        </div>

        {/* Add New Webhook Form - Only show if slots available */}
        {getAvailableSlots() > 0 && (
          <div className="space-y-4 p-4 bg-gray-700/50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Plus className="w-4 h-4 text-blue-400" />
              <h3 className="text-white font-medium">Create Webhook Slot ({getAvailableSlots()} remaining)</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="serverName" className="text-gray-300">Discord Server Name</Label>
                <Input
                  id="serverName"
                  placeholder="My Awesome Server"
                  value={newWebhook.serverName}
                  onChange={(e) => setNewWebhook({ ...newWebhook, serverName: e.target.value })}
                  className="bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <Label htmlFor="webhookUrl" className="text-gray-300">Discord Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz..."
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  className="bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Get this from Discord: Server Settings → Integrations → Webhooks → Copy Webhook URL
                </p>
              </div>
            </div>
            <Button 
              onClick={addWebhook}
              disabled={loading || !newWebhook.url || !newWebhook.serverName}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
            >
              {loading ? 'Testing & Creating Slot...' : 'Create Webhook Slot'}
            </Button>
          </div>
        )}

        {/* Maximum slots reached message */}
        {getAvailableSlots() === 0 && (
          <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-300 text-sm font-medium">
              🎯 Maximum webhook slots reached ({MAX_WEBHOOKS}/{MAX_WEBHOOKS}). Remove a slot to add a new one.
            </p>
          </div>
        )}

        {/* Active Webhook Slots List */}
        <div className="space-y-3">
          <h3 className="text-white font-medium">Your Webhook Slots ({webhooks.length}/{MAX_WEBHOOKS})</h3>
          {webhooks.length === 0 ? (
            <div className="text-center py-8 bg-gray-700/30 rounded-lg">
              <Webhook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg font-medium mb-2">No webhook slots created</p>
              <p className="text-gray-500 text-sm">Create your first webhook slot above to start receiving ads and earning money!</p>
            </div>
          ) : (
            webhooks.map((webhook) => (
              <div key={webhook.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-white font-medium">{webhook.server_name}</h4>
                    <Badge className={webhook.is_active ? 'bg-green-900/30 text-green-400 border-green-500/50' : 'bg-red-900/30 text-red-400 border-red-500/50'}>
                      {webhook.is_active ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                      {webhook.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-sm font-mono truncate mb-2 max-w-md">
                    {webhook.webhook_url}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                    <div>
                      <span className="text-green-400">✓ Delivered: {webhook.total_sent || 0}</span>
                      {(webhook.total_errors || 0) > 0 && (
                        <span className="text-red-400 ml-3">✗ Errors: {webhook.total_errors}</span>
                      )}
                    </div>
                    <div>
                      <span>Last sent: {formatLastSent(webhook.last_sent_at)}</span>
                    </div>
                  </div>
                  {webhook.last_error && (
                    <p className="text-red-400 text-xs mt-1 truncate">
                      Error: {webhook.last_error}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testWebhook(webhook.webhook_url)}
                    className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                    title="Test webhook"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeWebhook(webhook.id, webhook.server_name)}
                    className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                    title="Remove webhook slot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <h4 className="text-blue-300 font-medium mb-2">📋 How to create a webhook slot:</h4>
          <ol className="text-blue-200 text-sm space-y-1 list-decimal list-inside">
            <li>Open your Discord server settings</li>
            <li>Go to "Integrations" → "Webhooks"</li>
            <li>Click "New Webhook" or edit existing one</li>
            <li>Choose the channel where ads will appear</li>
            <li>Copy the webhook URL and paste it above</li>
            <li>Click "Create Webhook Slot" to test and activate immediately</li>
          </ol>
          <div className="mt-3 p-2 bg-green-900/20 border border-green-500/30 rounded">
            <p className="text-green-300 text-sm font-medium">
              ⚡ Your webhook slots are saved to your profile and will persist across sessions! Failed webhooks are only deleted after repeated failures.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebhookSetup;
