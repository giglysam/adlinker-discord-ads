
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthPage from '../components/Auth/AuthPage';
import AdvertiserDashboard from '../components/Advertiser/AdvertiserDashboard';
import AdShowerDashboard from '../components/AdShower/AdShowerDashboard';
import AdminDashboard from '../components/Admin/AdminDashboard';
import Navbar from '../components/Layout/Navbar';
import HomePage from '../components/Home/HomePage';

const Index = () => {
  const { user, loading } = useAuth();

  // Show loading only during initial auth check
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show homepage and auth page if no user
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
