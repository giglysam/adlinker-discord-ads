
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthPage from '../components/Auth/AuthPage';
import AdvertiserDashboard from '../components/Advertiser/AdvertiserDashboard';
import AdShowerDashboard from '../components/AdShower/AdShowerDashboard';
import AdminDashboard from '../components/Admin/AdminDashboard';
import Navbar from '../components/Layout/Navbar';

const Index = () => {
  const { user, loading } = useAuth();

  // Don't show loading for normal operations, only during initial auth
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
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
