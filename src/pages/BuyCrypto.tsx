import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Cryptocurrency {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  logo_url: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon_url: string;
  upi_id?: string;
  email_id?: string;
  bank_name?: string;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
}

const BuyCrypto = () => {
  const { cryptoId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [crypto, setCrypto] = useState<Cryptocurrency | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [user, setUser] = useState<any>(null);
  const [rupeeAmount, setRupeeAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [blockchainNetwork, setBlockchainNetwork] = useState("");
  const [receiveAddress, setReceiveAddress] = useState("");
  const [currentStep, setCurrentStep] = useState(1); // 1: amount/payment, 2: blockchain address, 3: processing
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
    if (cryptoId) {
      fetchCrypto();
    }
    fetchPaymentMethods();
  }, [cryptoId]);

  useEffect(() => {
    let subscription: any;
    if (transactionId) {
      // Subscribe to transaction status changes
      subscription = supabase
        .channel('transaction-updates')
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'user_transactions',
            filter: `id=eq.${transactionId}`
          }, 
          (payload) => {
            const newStatus = payload.new.status;
            if (newStatus === 'approved') {
              setShowProcessingDialog(false);
              toast({
                title: "✅ Payment Approved!",
                description: "Your crypto purchase has been approved successfully!",
              });
              navigate("/dashboard");
            } else if (newStatus === 'rejected') {
              setShowProcessingDialog(false);
              toast({
                title: "❌ Payment Rejected",
                description: "Your payment has been rejected. Please try again.",
                variant: "destructive",
              });
              setCurrentStep(1);
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [transactionId, navigate, toast]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };

  const fetchCrypto = async () => {
    try {
      const { data, error } = await supabase
        .from('cryptocurrencies')
        .select('*')
        .eq('id', cryptoId)
        .single();

      if (error) throw error;
      setCrypto(data);
    } catch (error) {
      console.error('Error fetching crypto:', error);
      toast({
        title: "Error",
        description: "Failed to load cryptocurrency details",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const calculateCryptoAmount = () => {
    if (!crypto || !rupeeAmount || !crypto.current_price) return "0";
    const price = parseFloat(crypto.current_price.toString());
    const amount = parseFloat(rupeeAmount) / price;
    console.log(`Calculating: ${rupeeAmount} INR / ${price} = ${amount} ${crypto.symbol}`);
    return amount.toFixed(price < 1 ? 8 : 6);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const getSelectedPaymentMethod = () => {
    return paymentMethods.find(method => method.id === selectedPaymentMethod);
  };

  const processReferralReward = async (userId: string) => {
    try {
      // Find if the user was referred by someone
      const { data: referralData } = await supabase
        .from('referrals')
        .select('referrer_id')
        .eq('referred_id', userId)
        .single();

      if (referralData && referralData.referrer_id !== userId) {
        // Add $2 (approximately ₹166) to referrer's wallet
        const rewardAmount = 166; // $2 in INR
        
        // Get current referral earnings
        const { data: currentWallet } = await supabase
          .from('user_wallets')
          .select('referral_earnings')
          .eq('user_id', referralData.referrer_id)
          .single();

        if (currentWallet) {
          // Update referrer's earnings
          const newEarnings = (currentWallet.referral_earnings || 0) + rewardAmount;
          
          const { error: walletError } = await supabase
            .from('user_wallets')
            .update({ referral_earnings: newEarnings })
            .eq('user_id', referralData.referrer_id);

          if (!walletError) {
            // Update referral record with earnings
            await supabase
              .from('referrals')
              .update({ earnings: rewardAmount })
              .eq('referrer_id', referralData.referrer_id)
              .eq('referred_id', userId);
          }
        }
      }
    } catch (error) {
      console.error('Error processing referral reward:', error);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!rupeeAmount || !selectedPaymentMethod || !paymentScreenshot) {
      toast({
        title: "Error",
        description: "Please fill all required fields and upload payment screenshot",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload payment screenshot
      const fileName = `${user.id}/${Date.now()}_${paymentScreenshot.name}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, paymentScreenshot);

      if (uploadError) throw uploadError;

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('user_transactions')
        .insert({
          user_id: user.id,
          crypto_id: crypto!.id,
          transaction_type: 'buy',
          amount: parseFloat(calculateCryptoAmount()),
          price_per_unit: crypto!.current_price,
          total_amount: parseFloat(rupeeAmount),
          rupee_amount: parseFloat(rupeeAmount),
          payment_method_id: selectedPaymentMethod,
          payment_screenshot_url: fileName,
          status: 'payment_uploaded'
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Check if this is the user's first transaction to process referral
      const { data: userTransactions } = await supabase
        .from('user_transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('transaction_type', 'buy');

      // If this is the first transaction, process referral reward
      if (userTransactions && userTransactions.length === 1) {
        await processReferralReward(user.id);
      }
      
      setTransactionId(transaction.id);
      setCurrentStep(2);
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast({
        title: "Error",
        description: "Failed to submit payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBlockchainSubmit = async () => {
    if (!blockchainNetwork || !receiveAddress) {
      toast({
        title: "Error",
        description: "Please fill blockchain network and receive address",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_transactions')
        .update({
          blockchain_network: blockchainNetwork,
          receive_address: receiveAddress,
          status: 'blockchain_submitted'
        })
        .eq('id', transactionId);

      if (error) throw error;

      setShowProcessingDialog(true);
      
      // Auto close after 2 minutes if no response
      setTimeout(() => {
        setShowProcessingDialog(false);
        toast({
          title: "Processing",
          description: "Your transaction is still being processed. You'll be notified once approved.",
        });
        navigate("/dashboard");
      }, 120000); // 2 minutes

    } catch (error) {
      console.error('Error submitting blockchain details:', error);
      toast({
        title: "Error",
        description: "Failed to submit blockchain details. Please try again.",
        variant: "destructive",
      });
    }
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

  if (!crypto) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Cryptocurrency not found</p>
            <Button onClick={() => navigate("/dashboard")} className="mt-4">
              Go Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              ← Back to Dashboard
            </Button>
            <h1 className="text-xl font-bold">Buy {crypto.symbol}</h1>
            <div></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Crypto Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <img 
                src={crypto.logo_url} 
                alt={crypto.name}
                className="w-16 h-16 rounded-full"
                onError={(e) => {
                  e.currentTarget.src = `https://cryptologos.cc/logos/${crypto.name.toUpperCase()}-${crypto.symbol.toLowerCase()}-logo.png`;
                }}
              />
              <div>
                <h2 className="text-2xl font-bold">{crypto.symbol}</h2>
                <p className="text-muted-foreground">{crypto.name}</p>
                <p className="text-xl font-semibold text-primary">
                  ₹{crypto.current_price.toFixed(crypto.current_price < 1 ? 6 : 2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Purchase Details</CardTitle>
              <CardDescription>
                Enter amount and payment details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount Input */}
              <div>
                <Label htmlFor="rupee-amount">Amount (₹)</Label>
                <Input
                  id="rupee-amount"
                  type="number"
                  placeholder="Enter amount in rupees"
                  value={rupeeAmount}
                  onChange={(e) => setRupeeAmount(e.target.value)}
                  min="1"
                />
                {rupeeAmount && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    You will receive: <span className="font-semibold text-primary">
                      {calculateCryptoAmount()} {crypto.symbol}
                    </span>
                  </p>
                )}
              </div>

              {/* Payment Methods */}
              <div>
                <Label>Select Payment Method</Label>
                <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center space-x-2 p-4 border rounded-lg">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Label htmlFor={method.id} className="flex items-center gap-2 cursor-pointer">
                          <img src={method.icon_url} alt={method.name} className="w-6 h-6" />
                          {method.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Payment Method Details */}
              {selectedPaymentMethod && getSelectedPaymentMethod() && (
                <div>
                  <Label>Payment Details</Label>
                  <Card className="mt-2">
                    <CardContent className="p-4">
                      {(() => {
                        const method = getSelectedPaymentMethod()!;
                        
                        if (method.name === 'PayPal' && method.email_id) {
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">PayPal Email:</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{method.email_id}</span>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => copyToClipboard(method.email_id!, 'PayPal Email')}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        } else if (method.name === 'Bank Transfer') {
                          return (
                            <div className="space-y-2">
                              {method.account_holder_name && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Account Holder:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{method.account_holder_name}</span>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => copyToClipboard(method.account_holder_name!, 'Account Holder Name')}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {method.bank_name && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Bank Name:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{method.bank_name}</span>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => copyToClipboard(method.bank_name!, 'Bank Name')}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {method.account_number && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Account Number:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{method.account_number}</span>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => copyToClipboard(method.account_number!, 'Account Number')}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {method.ifsc_code && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">IFSC Code:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{method.ifsc_code}</span>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => copyToClipboard(method.ifsc_code!, 'IFSC Code')}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        } else if (method.upi_id) {
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">UPI ID:</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{method.upi_id}</span>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => copyToClipboard(method.upi_id!, 'UPI ID')}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        return <p className="text-sm text-muted-foreground">Payment details not available</p>;
                      })()}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Payment Screenshot Upload */}
              <div>
                <Label htmlFor="payment-screenshot">Upload Payment Screenshot</Label>
                <Input
                  id="payment-screenshot"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a screenshot of your payment confirmation
                </p>
              </div>

              <Button onClick={handlePaymentSubmit} className="w-full">
                Submit Payment Details
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Details</CardTitle>
              <CardDescription>
                Enter your blockchain network and receive address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="blockchain-network">Blockchain Network</Label>
                <Input
                  id="blockchain-network"
                  placeholder="e.g., Ethereum, BSC, Polygon, etc."
                  value={blockchainNetwork}
                  onChange={(e) => setBlockchainNetwork(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="receive-address">Receive Address</Label>
                <Input
                  id="receive-address"
                  placeholder="Enter your wallet address"
                  value={receiveAddress}
                  onChange={(e) => setReceiveAddress(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Make sure this address is correct. Cryptocurrency sent to wrong address cannot be recovered.
                </p>
              </div>

              <Button onClick={handleBlockchainSubmit} className="w-full">
                Submit Order
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Processing Dialog */}
        <Dialog open={showProcessingDialog} onOpenChange={setShowProcessingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payment Processing</DialogTitle>
              <DialogDescription>
                Please wait for 2 minutes while we process your payment...
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 py-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
              <p className="text-center text-muted-foreground">
                Your transaction is being processed. This popup will close automatically once approved.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default BuyCrypto;
