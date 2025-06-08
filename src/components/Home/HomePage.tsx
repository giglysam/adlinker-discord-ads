
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Plus, Shield, TrendingUp, Users, Zap } from 'lucide-react';

const HomePage = () => {
  const scrollToAuth = () => {
    const authSection = document.getElementById('auth-section');
    if (authSection) {
      authSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center">
                <span className="text-white font-bold text-4xl">DA</span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Discord<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">AdNet</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The premier Discord advertising network connecting advertisers with engaged communities. 
              Maximize your reach and monetize your Discord server.
            </p>
            
            <Button 
              onClick={scrollToAuth}
              size="lg" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-xl transform hover:scale-105 transition-all duration-200"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose DiscordAdNet?</h2>
            <p className="text-xl text-gray-400">Join thousands of successful advertisers and Discord communities</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-200">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-blue-400" />
                </div>
                <CardTitle className="text-2xl text-white">For Advertisers</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-400 mb-4">
                  Reach engaged Discord communities with targeted advertising campaigns. 
                  Scale your marketing efforts across thousands of active servers.
                </p>
                <ul className="text-left text-gray-300 space-y-2">
                  <li className="flex items-center"><TrendingUp className="w-4 h-4 mr-2 text-green-400" /> Real-time analytics</li>
                  <li className="flex items-center"><Users className="w-4 h-4 mr-2 text-green-400" /> Targeted audiences</li>
                  <li className="flex items-center"><Zap className="w-4 h-4 mr-2 text-green-400" /> Instant deployment</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-200">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Monitor className="w-8 h-8 text-green-400" />
                </div>
                <CardTitle className="text-2xl text-white">For Server Owners</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-400 mb-4">
                  Monetize your Discord server by displaying relevant ads to your community. 
                  Earn passive income while maintaining server quality.
                </p>
                <ul className="text-left text-gray-300 space-y-2">
                  <li className="flex items-center"><TrendingUp className="w-4 h-4 mr-2 text-green-400" /> Passive income</li>
                  <li className="flex items-center"><Shield className="w-4 h-4 mr-2 text-green-400" /> Quality control</li>
                  <li className="flex items-center"><Zap className="w-4 h-4 mr-2 text-green-400" /> Easy integration</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-200">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-purple-400" />
                </div>
                <CardTitle className="text-2xl text-white">Secure & Reliable</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-400 mb-4">
                  Built with security and reliability in mind. Advanced fraud protection 
                  and real-time monitoring ensure quality for all participants.
                </p>
                <ul className="text-left text-gray-300 space-y-2">
                  <li className="flex items-center"><Shield className="w-4 h-4 mr-2 text-green-400" /> Fraud protection</li>
                  <li className="flex items-center"><Monitor className="w-4 h-4 mr-2 text-green-400" /> 24/7 monitoring</li>
                  <li className="flex items-center"><Users className="w-4 h-4 mr-2 text-green-400" /> Community driven</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">10K+</div>
              <div className="text-gray-400">Discord Servers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">1M+</div>
              <div className="text-gray-400">Monthly Impressions</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">500+</div>
              <div className="text-gray-400">Active Advertisers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">98%</div>
              <div className="text-gray-400">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div id="auth-section" className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Join DiscordAdNet today and start maximizing your Discord advertising potential
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
