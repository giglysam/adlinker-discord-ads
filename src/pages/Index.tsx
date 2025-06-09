
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

  console.log('Index render - user:', user, 'loading:', loading);

  // Show loading only during initial auth check
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show homepage with integrated auth if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <HomePage />
        <div className="py-8 bg-gray-900/50" id="auth-section">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Get Started Today</h2>
              <p className="text-xl text-gray-400">Join thousands of users already earning with DiscordAdNet</p>
            </div>
            <div className="flex justify-center">
              <AuthPage />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    console.log('Rendering dashboard for role:', user.role);
    switch (user.role) {
      case 'advertiser':
        return <AdvertiserDashboard />;
      case 'shower':
        return <AdShowerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <div className="text-white">Unknown user role: {user.role}</div>;
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
