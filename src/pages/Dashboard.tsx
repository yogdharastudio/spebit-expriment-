import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { initializeNotifications, priceMonitor } from "@/utils/notifications";

interface Cryptocurrency {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  logo_url: string;
  is_active: boolean;
}

interface UserWallet {
  id: string;
  balance: number;
  referral_earnings: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [cryptocurrencies, setCryptocurrencies] = useState<Cryptocurrency[]>([]);
  const [userWallet, setUserWallet] = useState<UserWallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUser();
    fetchCryptocurrencies();
    initializeNotifications();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserWallet();
      generateReferralCode();
      checkAdminRole();
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };

  const fetchCryptocurrencies = async () => {
    try {
      const { data, error } = await supabase
        .from('cryptocurrencies')
        .select('*')
        .eq('is_active', true)
        .order('current_price', { ascending: false });

      if (error) throw error;
      setCryptocurrencies(data || []);
    } catch (error) {
      console.error('Error fetching cryptocurrencies:', error);
      toast({
        title: "Error",
        description: "Failed to load cryptocurrencies",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserWallet = async () => {
    try {
      let { data: wallet, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Wallet doesn't exist, create one
        const { data: newWallet, error: createError } = await supabase
          .from('user_wallets')
          .insert({ user_id: user.id, balance: 0, referral_earnings: 0 })
          .select()
          .single();

        if (createError) throw createError;
        wallet = newWallet;
      } else if (error) {
        throw error;
      }

      setUserWallet(wallet);
    } catch (error) {
      console.error('Error fetching user wallet:', error);
    }
  };

  const generateReferralCode = async () => {
    try {
      // Check if user already has a referral code
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('referrer_id', user.id)
        .single();

      if (existingReferral) {
        setReferralCode(existingReferral.referral_code);
      } else {
        // Generate new referral code
        const code = `SPB${user.id.slice(0, 8).toUpperCase()}`;
        setReferralCode(code);
        
        // Save to database - create a record for the referrer
        await supabase
          .from('referrals')
          .insert({
            referrer_id: user.id,
            referred_id: user.id, // placeholder for now
            referral_code: code
          });
      }
    } catch (error) {
      console.error('Error generating referral code:', error);
    }
  };

  const checkAdminRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (data && !error) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
    }
  };

  const generateReferralLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/auth?ref=${referralCode}`;
  };

  const shareReferral = async (platform: string) => {
    const referralLink = generateReferralLink();
    const message = `Join Spebit - India's leading crypto exchange! Get started with my referral link and start trading Bitcoin, Ethereum, USDT and more. ${referralLink}`;
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join Spebit - India\'s leading crypto exchange!')}`, '_blank');
        break;
      case 'copy':
        await navigator.clipboard.writeText(referralLink);
        toast({
          title: "Link Copied!",
          description: "Referral link copied to clipboard",
        });
        break;
      default:
        if (navigator.share) {
          navigator.share({
            title: 'Join Spebit',
            text: message,
            url: referralLink,
          });
        }
    }
  };

  const handleBuy = (crypto: Cryptocurrency) => {
    navigate(`/buy-crypto/${crypto.id}`);
  };


  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const copyReferralCode = async () => {
    await navigator.clipboard.writeText(referralCode);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/d6b36037-7c49-4f49-98f6-d7eb957417d4.png" 
                alt="Spebit Logo" 
                className="h-8 w-8"
              />
              <span className="text-lg sm:text-xl font-bold">Spebit</span>
            </div>
            
            {/* Mobile Navigation */}
            <div className="flex items-center gap-1 sm:gap-3">
              {isAdmin && (
                <Button variant="secondary" size="sm" onClick={() => navigate("/admin")}>
                  <span className="hidden sm:inline">⚙️ Admin Panel</span>
                  <span className="sm:hidden">⚙️</span>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => navigate("/history")}>
                <span className="hidden sm:inline">📄 History</span>
                <span className="sm:hidden">📄</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open("https://t.me/your_support_bot", "_blank")}
              >
                <span className="hidden sm:inline">💬 Support</span>
                <span className="sm:hidden">💬</span>
              </Button>
              <Button variant="outline" size="sm" onClick={copyReferralCode}>
                <span className="hidden sm:inline">🎁 Refer</span>
                <span className="sm:hidden">🎁</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">❌</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* User Wallet Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💰 Your Wallet
            </CardTitle>
            <CardDescription>
              Welcome back, {user?.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  ₹{userWallet?.balance?.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-muted-foreground">Total Balance</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  ₹{userWallet?.referral_earnings?.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-muted-foreground">Referral Earnings</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-lg font-semibold">{referralCode}</p>
                <p className="text-sm text-muted-foreground">Your Referral Code</p>
                <Button size="sm" variant="outline" onClick={copyReferralCode} className="mt-2">
                  Copy Code
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎁 Refer & Earn
            </CardTitle>
            <CardDescription>
              Earn $2 for each successful referral when they buy crypto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Your Referral Link:</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    value={generateReferralLink()} 
                    readOnly 
                    className="flex-1 p-2 bg-background border rounded text-sm"
                  />
                  <Button size="sm" onClick={() => shareReferral('copy')}>
                    Copy Link
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => shareReferral('whatsapp')}
                  className="flex items-center gap-2"
                >
                  📱 WhatsApp
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => shareReferral('telegram')}
                  className="flex items-center gap-2"
                >
                  📨 Telegram
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => shareReferral('copy')}
                  className="flex items-center gap-2"
                >
                  📋 Copy
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => shareReferral('share')}
                  className="flex items-center gap-2"
                >
                  📤 Share
                </Button>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Share your referral link through social media, email, or messaging apps</p>
                <p>• Earn $2 reward when someone signs up and makes their first crypto purchase</p>
                <p>• Rewards are added to your wallet automatically</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cryptocurrencies Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🚀 Cryptocurrencies
            </CardTitle>
            <CardDescription>
              Buy from {cryptocurrencies.length} available cryptocurrencies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cryptocurrencies.map((crypto) => (
                <Card key={crypto.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <img 
                        src={crypto.logo_url} 
                        alt={crypto.name}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          e.currentTarget.src = `https://cryptologos.cc/logos/${crypto.name.toLowerCase()}-${crypto.symbol.toLowerCase()}-logo.png`;
                        }}
                      />
                      <div>
                        <h3 className="font-semibold">{crypto.symbol}</h3>
                        <p className="text-sm text-muted-foreground">{crypto.name}</p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-2xl font-bold text-primary">
                        ₹{crypto.current_price.toFixed(crypto.current_price < 1 ? 6 : 2)}
                      </p>
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={() => handleBuy(crypto)}
                    >
                      Buy {crypto.symbol}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

    </div>
  );
};

export default Dashboard;
