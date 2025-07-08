
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { User, Mail, Lock, UserPlus, CheckCircle, Star } from 'lucide-react';

const AuthPage = () => {
  const { login, signInWithGoogle, signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [signupForm, setSignupForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'advertiser' as 'advertiser' | 'shower',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(loginForm.email, loginForm.password);
      if (success) {
        toast.success('Successfully logged in! Redirecting to your dashboard...');
      } else {
        toast.error('Invalid credentials. Please check your email and password.');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const success = await signInWithGoogle();
      if (success) {
        toast.success('Redirecting to Google authentication...');
      } else {
        toast.error('Google authentication failed. Please try again.');
      }
    } catch (error) {
      toast.error('Google authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await signup(signupForm.username, signupForm.email, signupForm.password, signupForm.role);
      if (success) {
        setShowSuccessMessage(true);
        toast.success('Account created successfully! Check your email to verify your account.', {
          duration: 6000,
        });
        // Clear the form
        setSignupForm({
          username: '',
          email: '',
          password: '',
          role: 'advertiser',
        });
      } else {
        toast.error('Signup failed. Please try again.');
      }
    } catch (error) {
      toast.error('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccessMessage) {
    return (
      <Card className="w-full max-w-md bg-gray-800/90 backdrop-blur-sm border-gray-700">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Account Created Successfully!</h3>
          <p className="text-gray-300 mb-6">
            We've sent a verification email to <strong className="text-white">{signupForm.email}</strong>. 
            Please check your inbox and click the verification link to activate your account.
          </p>
          <div className="space-y-3 text-sm text-gray-400 mb-6">
            <p>✅ Account created with {signupForm.role === 'advertiser' ? 'Advertiser' : 'Server Owner'} role</p>
            <p>📧 Verification email sent</p>
            <p>🚀 Ready to start {signupForm.role === 'advertiser' ? 'advertising' : 'earning'}!</p>
          </div>
          <Button 
            onClick={() => setShowSuccessMessage(false)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-gray-800/90 backdrop-blur-sm border-gray-700">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 flex items-center justify-center">
            <img src="/favicon.ico" alt="DiscordAdNet" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-white">Join DiscordAdNet</CardTitle>
        <p className="text-gray-400">Start advertising or earning today</p>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="signup" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger value="signup" className="data-[state=active]:bg-gray-600">Sign Up</TabsTrigger>
            <TabsTrigger value="login" className="data-[state=active]:bg-gray-600">Login</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signup" className="space-y-4 mt-6">
            <div className="mb-4 p-4 bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center space-x-2 text-green-300 mb-2">
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">Join the Revolution!</span>
              </div>
              <p className="text-sm text-green-200">✅ Free forever • ✅ Instant setup • ✅ Start earning immediately</p>
            </div>

            {/* Google Sign Up Button */}
            <Button 
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-300"
              variant="outline"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLoading ? 'Signing up...' : 'Continue with Google'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-800 px-2 text-gray-400">Or continue with email</span>
              </div>
            </div>
            
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Username"
                  value={signupForm.username}
                  onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              <Select
                value={signupForm.role}
                onValueChange={(value: 'advertiser' | 'shower') => 
                  setSignupForm({ ...signupForm, role: value })
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
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" disabled={isLoading}>
                <UserPlus className="w-4 h-4 mr-2" />
                {isLoading ? 'Creating Account...' : 'Create Free Account'}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="login" className="space-y-4 mt-6">
            {/* Google Login Button */}
            <Button 
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-100 text-gray-900"
              variant="outline"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-800 px-2 text-gray-400">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login to Dashboard'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AuthPage;
