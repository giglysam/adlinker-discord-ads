
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, UserPlus } from 'lucide-react';

const GoogleRoleSelection = () => {
  const { completeGoogleSignup, googleUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    role: 'advertiser' as 'advertiser' | 'shower',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await completeGoogleSignup(formData.role, formData.username);
      if (success) {
        toast.success('Account setup completed successfully!');
      } else {
        toast.error('Failed to complete account setup. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to complete account setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!googleUser) {
    return null;
  }

  return (
    <Card className="w-full max-w-md bg-gray-800/90 backdrop-blur-sm border-gray-700">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-white">Complete Your Setup</CardTitle>
        <p className="text-gray-400">Welcome {googleUser.email}! Please complete your profile to get started.</p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-300">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-gray-300">Account Type</Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'advertiser' | 'shower') => 
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="advertiser">🎯 Advertiser (Promote your business)</SelectItem>
                <SelectItem value="shower">💰 Server Owner (Earn money)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mt-4">
            <p className="text-sm text-blue-200">
              {formData.role === 'advertiser' 
                ? '🎯 As an Advertiser, you can create and manage ad campaigns to promote your business.'
                : '💰 As a Server Owner, you can earn money by displaying ads on your Discord server.'
              }
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" 
            disabled={isLoading || !formData.username}
          >
            {isLoading ? 'Setting up...' : 'Complete Setup'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default GoogleRoleSelection;
