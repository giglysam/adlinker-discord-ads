
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, DollarSign } from 'lucide-react';

const AdRedirect = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const adId = searchParams.get('ad_id');
  const webhookId = searchParams.get('webhook_id');

  useEffect(() => {
    const processClick = async () => {
      if (!adId || !webhookId) {
        setError('Missing required parameters');
        setLoading(false);
        return;
      }

      try {
        console.log('Processing ad click:', { adId, webhookId });

        // Call the edge function directly via fetch to handle redirects properly
        const response = await fetch(
          `https://azuwehjpqqmhfzfluiui.supabase.co/functions/v1/ad-redirect?ad_id=${adId}&webhook_id=${webhookId}`,
          {
            method: 'GET',
            redirect: 'manual' // Don't follow redirects automatically
          }
        );

        if (response.status === 302) {
          // This is a redirect response, get the location
          const redirectUrl = response.headers.get('Location');
          if (redirectUrl) {
            console.log('Successful click processing, redirecting to:', redirectUrl);
            setResult({
              success: true,
              redirect_url: redirectUrl,
              first_click: true,
              earning: 0.01,
              message: 'Great! You earned $0.01 for this click!'
            });
            setLoading(false);

            // Auto-redirect after 3 seconds
            setTimeout(() => {
              window.open(redirectUrl, '_blank');
            }, 3000);
            return;
          }
        }

        // Handle other response types
        const data = await response.json();
        
        if (!response.ok) {
          setError(data.message || 'Failed to process click');
          setLoading(false);
          return;
        }

        console.log('Click processed successfully:', data);
        setResult(data);
        setLoading(false);

      } catch (err) {
        console.error('Click processing error:', err);
        setError('An unexpected error occurred');
        setLoading(false);
      }
    };

    processClick();
  }, [adId, webhookId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Processing your click...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
            <Button 
              onClick={() => window.history.back()} 
              className="mt-4 w-full"
              variant="outline"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            {result?.first_click ? (
              <>
                <DollarSign className="h-5 w-5" />
                Click Rewarded!
              </>
            ) : (
              <>
                <ExternalLink className="h-5 w-5" />
                Click Processed
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">{result?.message}</p>
          
          {result?.first_click && (
            <div className="bg-green-100 p-3 rounded-lg">
              <p className="text-green-800 font-semibold">
                You earned ${result.earning}!
              </p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Redirecting to the advertiser's website in 3 seconds...
            </p>
            
            <Button 
              onClick={() => window.open(result?.redirect_url, '_blank')}
              className="w-full"
              disabled={!result?.redirect_url}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit Now
            </Button>
          </div>

          <Button 
            onClick={() => window.close()} 
            variant="outline"
            className="w-full"
          >
            Close Window
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdRedirect;
