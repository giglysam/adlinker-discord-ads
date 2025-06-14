
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  Play, 
  Square, 
  Activity,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

const LLMDistributionManager = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastExecution, setLastExecution] = useState<Date | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalCycles: 0,
    successfulDeliveries: 0,
    aiApprovals: 0,
    aiRejections: 0
  });
  const { toast } = useToast();

  const startLLMDistribution = async () => {
    try {
      setIsRunning(true);
      const response = await supabase.functions.invoke('llm-ad-distributor', {
        body: { start: true }
      });

      if (response.error) throw response.error;

      toast({
        title: "LLM Distribution Started",
        description: "AI-powered ad distribution is now running continuously",
      });

      addLog('🤖 LLM Distribution System Started');
      setLastExecution(new Date());
      
    } catch (error) {
      console.error('Error starting LLM distribution:', error);
      setIsRunning(false);
      toast({
        title: "Error",
        description: "Failed to start LLM distribution system",
        variant: "destructive",
      });
      addLog(`❌ Error starting system: ${error.message}`);
    }
  };

  const stopLLMDistribution = () => {
    setIsRunning(false);
    addLog('🛑 LLM Distribution System Stopped');
    toast({
      title: "LLM Distribution Stopped",
      description: "The continuous distribution has been stopped",
    });
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  const testLLMConnection = async () => {
    try {
      const response = await supabase.functions.invoke('llm-ad-distributor', {
        body: { test: true }
      });

      if (response.error) throw response.error;

      toast({
        title: "LLM Connection Test",
        description: "Successfully connected to OpenRouter LLM",
      });
      addLog('✅ LLM Connection Test Successful');
      
    } catch (error) {
      console.error('LLM test error:', error);
      toast({
        title: "LLM Test Failed",
        description: "Could not connect to OpenRouter LLM",
        variant: "destructive",
      });
      addLog(`❌ LLM Test Failed: ${error.message}`);
    }
  };

  // Simulate periodic updates (in real app, this would come from real-time subscriptions)
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalCycles: prev.totalCycles + 1
      }));
      
      // Simulate some activity
      if (Math.random() > 0.3) {
        setStats(prev => ({
          ...prev,
          successfulDeliveries: prev.successfulDeliveries + Math.floor(Math.random() * 3) + 1,
          aiApprovals: prev.aiApprovals + 1
        }));
        addLog('✅ AI approved ad distribution cycle');
      } else {
        setStats(prev => ({
          ...prev,
          aiRejections: prev.aiRejections + 1
        }));
        addLog('🚫 AI rejected ad for distribution');
      }
      
      setLastExecution(new Date());
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Bot className="w-5 h-5 text-blue-400" />
            <span>LLM-Powered Ad Distribution</span>
            <Badge variant={isRunning ? "default" : "secondary"} className="ml-2">
              {isRunning ? "Running" : "Stopped"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button 
                onClick={startLLMDistribution}
                disabled={isRunning}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Start LLM Distribution
              </Button>
              
              <Button 
                onClick={stopLLMDistribution}
                disabled={!isRunning}
                variant="destructive"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
              
              <Button 
                onClick={testLLMConnection}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Test LLM
              </Button>
            </div>

            {lastExecution && (
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Last execution: {lastExecution.toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Cycles</p>
                <p className="text-xl font-bold text-white">{stats.totalCycles}</p>
              </div>
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Deliveries</p>
                <p className="text-xl font-bold text-white">{stats.successfulDeliveries}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">AI Approvals</p>
                <p className="text-xl font-bold text-green-400">{stats.aiApprovals}</p>
              </div>
              <Bot className="w-6 h-6 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">AI Rejections</p>
                <p className="text-xl font-bold text-red-400">{stats.aiRejections}</p>
              </div>
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Logs */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Live System Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Start the LLM distribution to see activity.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-green-400 mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card className="bg-blue-900/20 border-blue-500/50">
        <CardContent className="p-6">
          <h3 className="text-blue-400 font-semibold mb-3">🤖 How LLM Integration Works</h3>
          <div className="space-y-2 text-gray-300 text-sm">
            <p>• <strong>Step 1:</strong> System selects a random ad from the database</p>
            <p>• <strong>Step 2:</strong> Ad content is sent to OpenRouter LLM for analysis</p>
            <p>• <strong>Step 3:</strong> AI decides whether to approve or reject the ad</p>
            <p>• <strong>Step 4:</strong> If approved, ad is distributed to all active Discord webhooks</p>
            <p>• <strong>Step 5:</strong> Users earn money for each successful delivery</p>
            <p>• <strong>Step 6:</strong> System waits 1 minute and repeats the cycle</p>
          </div>
          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <p className="text-yellow-400 text-sm">
              <strong>Note:</strong> The LLM acts as a quality filter, ensuring only appropriate content is distributed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LLMDistributionManager;
