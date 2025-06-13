
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Plus, Shield, TrendingUp, Users, Zap, Bot, DollarSign } from 'lucide-react';

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
              <div className="w-24 h-24 flex items-center justify-center">
                <img src="/favicon.ico"></img>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Discord<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">AdNet</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-4xl mx-auto">
              The premier Discord advertising network connecting advertisers with engaged communities. 
              Maximize your reach, monetize your Discord server, and grow your business with targeted advertising.
            </p>
            
            <div className="text-lg text-gray-400 mb-8 max-w-3xl mx-auto">
              Join thousands of successful advertisers and Discord server owners who are already earning and growing with our platform.
            </div>
            
            <Button 
              onClick={scrollToAuth}
              size="lg" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-xl transform hover:scale-105 transition-all duration-200"
            >
              Get Started Now - It's Free!
            </Button>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How DiscordAdNet Works</h2>
            <p className="text-xl text-gray-400">Simple, effective, and profitable for everyone</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* For Advertisers */}
            <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-200">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-blue-400" />
                </div>
                <CardTitle className="text-2xl text-white">For Advertisers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-gray-300">
                    <h4 className="font-semibold text-white mb-2">🎯 Target Discord Communities</h4>
                    <p>Reach highly engaged Discord users across thousands of active servers with your advertising campaigns.</p>
                  </div>
                  <div className="text-gray-300">
                    <h4 className="font-semibold text-white mb-2">📊 Real-Time Analytics</h4>
                    <p>Track impressions, clicks, and engagement with comprehensive analytics and reporting tools.</p>
                  </div>
                  <div className="text-gray-300">
                    <h4 className="font-semibold text-white mb-2">⚡ Instant Deployment</h4>
                    <p>Launch your campaigns instantly across our network of Discord servers with just a few clicks.</p>
                  </div>
                  <div className="text-gray-300">
                    <h4 className="font-semibold text-white mb-2">💰 Cost-Effective</h4>
                    <p>Pay-per-impression model ensures you only pay for actual ad views with transparent pricing.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* For Server Owners */}
            <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-200">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Monitor className="w-8 h-8 text-green-400" />
                </div>
                <CardTitle className="text-2xl text-white">For Discord Server Owners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-gray-300">
                    <h4 className="font-semibold text-white mb-2">💸 Earn Passive Income</h4>
                    <p>Monetize your Discord server by displaying relevant ads to your community members.</p>
                  </div>
                  <div className="text-gray-300">
                    <h4 className="font-semibold text-white mb-2">🔧 Easy Integration</h4>
                    <p>Set up our Discord bot in minutes with simple webhook integration - no technical skills required.</p>
                  </div>
                  <div className="text-gray-300">
                    <h4 className="font-semibold text-white mb-2">🛡️ Quality Control</h4>
                    <p>All ads are reviewed and filtered to ensure they're appropriate for your community.</p>
                  </div>
                  <div className="text-gray-300">
                    <h4 className="font-semibold text-white mb-2">📈 Transparent Earnings</h4>
                    <p>Real-time earnings tracking with instant payouts when you reach the minimum threshold.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-400">Everything you need for successful Discord advertising</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-200">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-purple-400" />
                </div>
                <CardTitle className="text-xl text-white">Smart Discord Bot</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-400">
                  Our intelligent Discord bot automatically delivers ads at optimal times for maximum engagement.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-200">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
                <CardTitle className="text-xl text-white">Fair Revenue Sharing</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-400">
                  Competitive revenue sharing model that rewards server owners fairly for their community engagement.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-200">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-blue-400" />
                </div>
                <CardTitle className="text-xl text-white">Advanced Security</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-400">
                  Enterprise-grade security with fraud protection and 24/7 monitoring for safe advertising.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Trusted by Thousands</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">10K+</div>
              <div className="text-gray-400">Discord Servers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">5M+</div>
              <div className="text-gray-400">Monthly Impressions</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">1.2K+</div>
              <div className="text-gray-400">Active Advertisers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">99%</div>
              <div className="text-gray-400">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div id="auth-section" className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Join DiscordAdNet today and start maximizing your Discord advertising potential. 
            Whether you're looking to advertise or monetize your server, we've got you covered.
          </p>
          <div className="text-lg text-blue-400 font-medium">
            👇 Create your account below - It's completely free! 👇
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
