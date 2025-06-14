import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../../contexts/AuthContext';
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

  // Refresh user data every 30 seconds to keep balance updated
  useEffect(() => {
    if (refreshUser) {
      const interval = setInterval(() => {
        refreshUser();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [refreshUser]);

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
                  <p className="text-xs text-gray-500">Updates automatically</p>
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
      </div>
    </div>
  );
};

export default AdShowerDashboard;
