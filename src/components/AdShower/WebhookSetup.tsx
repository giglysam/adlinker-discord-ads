
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Webhook, CheckCircle, ExternalLink, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface WebhookData {
  id: string;
  webhook_url: string;
  server_name: string;
  is_active: boolean;
  created_at: string;
}

const WebhookSetup = () => {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    serverName: '',
  });

  useEffect(() => {
    if (user?.id) {
      loadWebhooks();
    }
  }, [user?.id]);

  const loadWebhooks = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading webhooks:', error);
        toast.error('Failed to load webhooks');
        return;
      }

      setWebhooks(data || []);
    } catch (error) {
      console.error('Error loading webhooks:', error);
      toast.error('Failed to load webhooks');
    } finally {
      setInitialLoading(false);
    }
  };

  const addWebhook = async () => {
    if (!newWebhook.url || !newWebhook.serverName) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!newWebhook.url.includes('discord.com/api/webhooks/')) {
      toast.error('Please enter a valid Discord webhook URL');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          user_id: user?.id,
          webhook_url: newWebhook.url,
          server_name: newWebhook.serverName,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding webhook:', error);
        toast.error('Failed to add webhook');
        return;
      }

      setWebhooks([data, ...webhooks]);
      setNewWebhook({ url: '', serverName: '' });
      toast.success('Webhook added successfully!');
    } catch (error) {
      console.error('Error adding webhook:', error);
      toast.error('Failed to add webhook');
    } finally {
      setLoading(false);
    }
  };

  const removeWebhook = async (id: string) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error removing webhook:', error);
        toast.error('Failed to remove webhook');
        return;
      }

      setWebhooks(webhooks.filter(w => w.id !== id));
      toast.success('Webhook removed successfully');
    } catch (error) {
      console.error('Error removing webhook:', error);
      toast.error('Failed to remove webhook');
    }
  };

  const testWebhook = async (webhookUrl: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-test-ad', {
        body: { webhookUrl },
      });

      if (error) {
        toast.error('Webhook test failed');
        return;
      }

      toast.success('Test message sent successfully!');
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error('Webhook test failed');
    }
  };

  if (initialLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-white text-center">Loading webhooks...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Webhook className="w-5 h-5" />
          <span>Discord Webhook Setup</span>
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Add your Discord server webhooks to start receiving ads automatically
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Webhook */}
        <div className="space-y-4 p-4 bg-gray-700/50 rounded-lg">
          <h3 className="text-white font-medium">Add New Webhook</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="serverName" className="text-gray-300">Server Name</Label>
              <Input
                id="serverName"
                placeholder="My Discord Server"
                value={newWebhook.serverName}
                onChange={(e) => setNewWebhook({ ...newWebhook, serverName: e.target.value })}
                className="bg-gray-600 border-gray-500 text-white"
              />
            </div>
            <div>
              <Label htmlFor="webhookUrl" className="text-gray-300">Discord Webhook URL</Label>
              <Input
                id="webhookUrl"
                placeholder="https://discord.com/api/webhooks/..."
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                className="bg-gray-600 border-gray-500 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Get this from your Discord server settings → Integrations → Webhooks
              </p>
            </div>
          </div>
          <Button 
            onClick={addWebhook}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Adding...' : 'Add Webhook'}
          </Button>
        </div>

        {/* Webhook List */}
        <div className="space-y-3">
          <h3 className="text-white font-medium">Your Webhooks</h3>
          {webhooks.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No webhooks configured yet. Add your first webhook above to start earning!
            </p>
          ) : (
            webhooks.map((webhook) => (
              <div key={webhook.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-white font-medium">{webhook.server_name}</h4>
                    <Badge className={webhook.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}>
                      {webhook.is_active ? <CheckCircle className="w-3 h-3 mr-1" /> : null}
                      {webhook.is_active ? 'active' : 'inactive'}
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-sm font-mono truncate">
                    {webhook.webhook_url}
                  </p>
                  <p className="text-gray-500 text-xs">
                    Added: {new Date(webhook.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testWebhook(webhook.webhook_url)}
                    className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeWebhook(webhook.id)}
                    className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
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
          <h4 className="text-blue-300 font-medium mb-2">How to get your Discord webhook:</h4>
          <ol className="text-blue-200 text-sm space-y-1 list-decimal list-inside">
            <li>Go to your Discord server settings</li>
            <li>Click on "Integrations" in the left sidebar</li>
            <li>Click "Create Webhook" or edit an existing one</li>
            <li>Copy the webhook URL and paste it above</li>
            <li>Make sure the webhook has permission to send messages</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebhookSetup;
