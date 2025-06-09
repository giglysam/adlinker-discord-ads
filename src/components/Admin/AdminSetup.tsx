
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Settings, CheckCircle } from 'lucide-react';

const AdminSetup = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  const createAdminUser = async () => {
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/create-admin-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Admin user created successfully! You can now log in with admin@discordadnet.com');
        setIsCreated(true);
      } else {
        toast.error(data.error || 'Failed to create admin user');
      }
    } catch (error) {
      console.error('Error creating admin user:', error);
      toast.error('Failed to create admin user');
    } finally {
      setIsCreating(false);
    }
  };

  if (isCreated) {
    return (
      <Card className="w-full max-w-md bg-green-900/20 border-green-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span>Admin user created successfully!</span>
          </div>
          <p className="text-sm text-green-300 mt-2">
            You can now log in with:<br />
            Email: admin@discordadnet.com<br />
            Password: Gabriels120?
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-gray-800 border-gray-700">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Settings className="w-8 h-8 text-purple-400" />
        </div>
        <CardTitle className="text-white">Admin Setup</CardTitle>
        <p className="text-gray-400 text-sm">Create the admin user account</p>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={createAdminUser} 
          disabled={isCreating}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isCreating ? 'Creating Admin User...' : 'Create Admin User'}
        </Button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          This will create an admin account with email: admin@discordadnet.com
        </p>
      </CardContent>
    </Card>
  );
};

export default AdminSetup;
