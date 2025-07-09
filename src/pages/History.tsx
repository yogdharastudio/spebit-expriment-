import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface Transaction {
  id: string;
  crypto_id: string;
  transaction_type: string;
  amount: number;
  price_per_unit: number;
  total_amount: number;
  status: string;
  created_at: string;
  cryptocurrencies: {
    symbol: string;
    name: string;
    logo_url: string;
  };
}

const History = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTransactions();
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

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_transactions')
        .select(`
          *,
          cryptocurrencies (
            symbol,
            name,
            logo_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-2">
                <img 
                  src="/lovable-uploads/d6b36037-7c49-4f49-98f6-d7eb957417d4.png" 
                  alt="Spebit Logo" 
                  className="h-8 w-8"
                />
                <span className="text-xl font-bold">Transaction History</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Your Trading History
            </CardTitle>
            <CardDescription>
              View all your cryptocurrency transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No transactions yet</p>
                <p className="text-muted-foreground">Start trading to see your history here</p>
                <Button 
                  className="mt-4"
                  onClick={() => navigate("/dashboard")}
                >
                  Start Trading
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cryptocurrency</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Price per Unit</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img 
                            src={transaction.cryptocurrencies.logo_url} 
                            alt={transaction.cryptocurrencies.name}
                            className="w-8 h-8 rounded-full"
                            onError={(e) => {
                              e.currentTarget.src = `https://cryptologos.cc/logos/${transaction.cryptocurrencies.name.toLowerCase()}-${transaction.cryptocurrencies.symbol.toLowerCase()}-logo.png`;
                            }}
                          />
                          <div>
                            <p className="font-medium">{transaction.cryptocurrencies.symbol}</p>
                            <p className="text-sm text-muted-foreground">{transaction.cryptocurrencies.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.transaction_type === 'buy' ? 'default' : 'secondary'}>
                          {transaction.transaction_type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.amount.toFixed(8)}</TableCell>
                      <TableCell>${transaction.price_per_unit.toFixed(2)}</TableCell>
                      <TableCell>${transaction.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                         <Badge 
                           variant={
                             transaction.status === 'approved' ? 'default' : 
                             transaction.status === 'rejected' ? 'destructive' :
                             transaction.status === 'payment_uploaded' ? 'secondary' :
                             transaction.status === 'blockchain_submitted' ? 'outline' :
                             'secondary'
                           }
                         >
                           {transaction.status === 'approved' ? 'APPROVED' :
                            transaction.status === 'rejected' ? 'REJECTED' :
                            transaction.status === 'payment_uploaded' ? 'PAYMENT UPLOADED' :
                            transaction.status === 'blockchain_submitted' ? 'SUBMITTED' :
                            transaction.status.toUpperCase()}
                         </Badge>
                      </TableCell>
                      <TableCell>{formatDate(transaction.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default History;