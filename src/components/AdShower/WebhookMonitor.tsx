
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';

interface WebhookStats {
  totalWebhooks: number;
  activeWebhooks: number;
  totalSent: number;
  totalErrors: number;
  recentActivity: number;
  lastActivity: string;
}

const WebhookMonitor = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<WebhookStats>({
    totalWebhooks: 0,
    activeWebhooks: 0,
    totalSent: 0,
    totalErrors: 0,
    recentActivity: 0,
    lastActivity: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadStats();
      
      // Set up real-time subscription for webhook activity
      const subscription = supabase
        .channel('webhook_activity')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'webhook_logs' },
          () => {
            console.log('New webhook activity detected')
            loadStats()
          }
        )
        .subscribe()

      // Refresh stats every 30 seconds
      const interval = setInterval(loadStats, 30000)

      return () => {
        subscription.unsubscribe()
        clearInterval(interval)
      }
    }
  }, [user?.id]);

  const loadStats = async () => {
    if (!user?.id) return;

    try {
      // Get user's webhooks
      const { data: webhooks, error: webhooksError } = await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', user.id);

      if (webhooksError) throw webhooksError;

      // Get recent webhook logs for user's webhooks
      const webhookIds = webhooks?.map(w => w.id) || [];
      
      let recentLogs = [];
      let lastActivity = '';
      
      if (webhookIds.length > 0) {
        const { data: logs, error: logsError } = await supabase
          .from('webhook_logs')
          .select('*')
          .in('webhook_id', webhookIds)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!logsError && logs) {
          recentLogs = logs;
          lastActivity = logs[0]?.created_at || '';
        }
      }

      // Calculate stats
      const totalWebhooks = webhooks?.length || 0;
      const activeWebhooks = webhooks?.filter(w => w.is_active).length || 0;
      const totalSent = webhooks?.reduce((sum, w) => sum + (w.total_sent || 0), 0) || 0;
      const totalErrors = webhooks?.reduce((sum, w) => sum + (w.total_errors || 0), 0) || 0;
      
      // Recent activity (last hour)
      const oneHourAgo = new Date(Date.now() - 3600000);
      const recentActivity = recentLogs.filter(log => 
        new Date(log.created_at) > oneHourAgo
      ).length;

      setStats({
        totalWebhooks,
        activeWebhooks,
        totalSent,
        totalErrors,
        recentActivity,
        lastActivity
      });

    } catch (error) {
      console.error('Error loading webhook stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastActivity = (timestamp: string) => {
    if (!timestamp) return 'No activity';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getHealthStatus = () => {
    if (stats.activeWebhooks === 0) return { status: 'warning', text: 'No active webhooks' };
    if (stats.totalErrors > stats.totalSent * 0.1) return { status: 'error', text: 'High error rate' };
    if (stats.recentActivity === 0 && stats.totalSent > 0) return { status: 'warning', text: 'No recent activity' };
    return { status: 'success', text: 'Healthy' };
  };

  const health = getHealthStatus();

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-white text-center">Loading webhook stats...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Webhook Health Monitor</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={
              health.status === 'success' ? 'bg-green-900/30 text-green-400' :
              health.status === 'warning' ? 'bg-yellow-900/30 text-yellow-400' :
              'bg-red-900/30 text-red-400'
            }>
              {health.status === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
              {health.status === 'warning' && <AlertTriangle className="w-3 h-3 mr-1" />}
              {health.status === 'error' && <AlertTriangle className="w-3 h-3 mr-1" />}
              {health.text}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={loadStats}
              className="border-gray-600 text-gray-400 hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{stats.totalWebhooks}</p>
            <p className="text-xs text-gray-400">Total Webhooks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{stats.activeWebhooks}</p>
            <p className="text-xs text-gray-400">Active</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.totalSent}</p>
            <p className="text-xs text-gray-400">Total Sent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">{stats.totalErrors}</p>
            <p className="text-xs text-gray-400">Errors</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-400">Recent Activity (1h): </span>
            <span className="text-white font-medium">{stats.recentActivity} deliveries</span>
          </div>
          <div>
            <span className="text-gray-400">Last Activity: </span>
            <span className="text-white font-medium">{formatLastActivity(stats.lastActivity)}</span>
          </div>
        </div>

        {stats.totalSent > 0 && (
          <div className="p-3 bg-gray-700/50 rounded-lg">
            <div className="text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Success Rate:</span>
                <span className="text-green-400">
                  {((stats.totalSent - stats.totalErrors) / stats.totalSent * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Earnings:</span>
                <span className="text-green-400">
                  ${((stats.totalSent - stats.totalErrors) * 0.00001).toFixed(5)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WebhookMonitor;
