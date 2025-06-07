
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, ExternalLink, Phone, Clock, CheckCircle, XCircle } from 'lucide-react';
import CreateAdModal from './CreateAdModal';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Ad {
  id: string;
  title: string;
  url: string;
  image_url: string;
  text: string;
  status: 'pending' | 'public' | 'stopped';
  created_at: string;
  impressions: number;
}

const AdvertiserDashboard = () => {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAds();
    }
  }, [user]);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ads:', error);
        toast.error('Failed to load ads');
        return;
      }

      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast.error('Failed to load ads');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'public':
        return <CheckCircle className="w-4 h-4" />;
      case 'stopped':
        return <XCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50';
      case 'public':
        return 'bg-green-900/30 text-green-400 border-green-500/50';
      case 'stopped':
        return 'bg-red-900/30 text-red-400 border-red-500/50';
    }
  };

  const handleCreateAd = async (adData: any) => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .insert({
          title: adData.title,
          url: adData.url,
          image_url: adData.imageUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
          text: adData.text,
          user_id: user?.id,
          status: 'pending',
          impressions: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating ad:', error);
        toast.error('Failed to create ad');
        return;
      }

      setAds([data, ...ads]);
      setShowCreateModal(false);
      toast.success('Ad created successfully!');
    } catch (error) {
      console.error('Error creating ad:', error);
      toast.error('Failed to create ad');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-white text-xl">Loading ads...</div>
        </div>
      </div>
    );
  }

  const pendingAds = ads.filter(ad => ad.status === 'pending');
  const publicAds = ads.filter(ad => ad.status === 'public');
  const totalImpressions = ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Advertiser Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage your Discord advertisements</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Ad
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Ads</p>
                  <p className="text-2xl font-bold text-white">{ads.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Public Ads</p>
                  <p className="text-2xl font-bold text-green-400">{publicAds.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending Ads</p>
                  <p className="text-2xl font-bold text-yellow-400">{pendingAds.length}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Impressions</p>
                  <p className="text-2xl font-bold text-white">{totalImpressions.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Ads Notice */}
        {pendingAds.length > 0 && (
          <Card className="bg-yellow-900/20 border-yellow-500/50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Phone className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-yellow-400 font-semibold mb-2">Pending Ads Need Approval</h3>
                  <p className="text-gray-300 mb-3">
                    You have {pendingAds.length} pending ad{pendingAds.length > 1 ? 's' : ''} waiting for approval.
                    Contact the admin to publish your ads and start reaching Discord communities.
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
        )}

        {/* Ads List */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Your Advertisements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ads.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No ads created yet. Create your first ad to get started!</p>
                </div>
              ) : (
                ads.map((ad) => (
                  <div key={ad.id} className="flex items-start space-x-4 p-4 bg-gray-700/50 rounded-lg">
                    <img
                      src={ad.image_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400'}
                      alt={ad.title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-white font-semibold">{ad.title}</h3>
                          <p className="text-gray-400 text-sm mt-1">{ad.text}</p>
                          <a
                            href={ad.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 text-sm hover:underline mt-1 inline-block"
                          >
                            {ad.url}
                          </a>
                        </div>
                        <Badge className={getStatusColor(ad.status)}>
                          {getStatusIcon(ad.status)}
                          <span className="ml-1 capitalize">{ad.status}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>Created: {new Date(ad.created_at).toLocaleDateString()}</span>
                          <span>Impressions: {(ad.impressions || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <CreateAdModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAd}
        />
      </div>
    </div>
  );
};

export default AdvertiserDashboard;
