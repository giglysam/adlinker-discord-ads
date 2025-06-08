
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthPage from '../components/Auth/AuthPage';
import AdvertiserDashboard from '../components/Advertiser/AdvertiserDashboard';
import AdShowerDashboard from '../components/AdShower/AdShowerDashboard';
import AdminDashboard from '../components/Admin/AdminDashboard';
import Navbar from '../components/Layout/Navbar';
import HomePage from '../components/Home/HomePage';
import { toast } from 'sonner';

const Index = () => {
  const { user, loading, createAdminAccount } = useAuth();
  const [hasTriedAdminCreation, setHasTriedAdminCreation] = useState(false);

  // Try to create admin account on first load if not already done
  useEffect(() => {
    const tryCreateAdmin = async () => {
      if (!hasTriedAdminCreation) {
        setHasTriedAdminCreation(true);
        const adminCreated = localStorage.getItem('adminAccountCreated');
        if (!adminCreated) {
          try {
            const success = await createAdminAccount();
            if (success) {
              localStorage.setItem('adminAccountCreated', 'true');
              toast.success('Admin account created successfully');
            }
          } catch (error) {
            console.log('Admin account creation attempted');
          }
        }
      }
    };

    if (!loading && !user) {
      tryCreateAdmin();
    }
  }, [loading, user, createAdminAccount, hasTriedAdminCreation]);

  // Show loading only during initial auth check
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show auth page if no user
  if (!user) {
    return (
      <>
        <HomePage />
        <AuthPage />
      </>
    );
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'advertiser':
        return <AdvertiserDashboard />;
      case 'shower':
        return <AdShowerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <div className="text-white">Unknown user role</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      {renderDashboard()}
    </div>
  );
};

export default Index;
