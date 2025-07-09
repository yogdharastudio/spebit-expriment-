import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, XCircle, Eye, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  price_per_unit: number;
  total_amount: number;
  rupee_amount: number;
  status: string;
  transaction_type: string;
  blockchain_network?: string;
  receive_address?: string;
  payment_screenshot_url?: string;
  admin_notes?: string;
  created_at: string;
  cryptocurrencies?: {
    name: string;
    symbol: string;
  };
  payment_methods?: {
    name: string;
  };
}

const AdminTransactions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_transactions')
        .select(`
          *,
          cryptocurrencies(name, symbol),
          payment_methods(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedTransaction) return;
    
    setIsApproving(true);
    try {
      const { error } = await supabase
        .from('user_transactions')
        .update({ 
          status: 'approved',
          admin_notes: adminNotes 
        })
        .eq('id', selectedTransaction.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Transaction approved successfully"
      });
      
      setSelectedTransaction(null);
      setAdminNotes("");
      fetchTransactions();
    } catch (error) {
      console.error('Error approving transaction:', error);
      toast({
        title: "Error",
        description: "Failed to approve transaction",
        variant: "destructive"
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTransaction) return;
    
    setIsRejecting(true);
    try {
      const { error } = await supabase
        .from('user_transactions')
        .update({ 
          status: 'rejected',
          admin_notes: adminNotes 
        })
        .eq('id', selectedTransaction.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Transaction rejected successfully"
      });
      
      setSelectedTransaction(null);
      setAdminNotes("");
      fetchTransactions();
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to reject transaction",
        variant: "destructive"
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'payment_uploaded':
        return <Badge variant="secondary">Payment Uploaded</Badge>;
      case 'blockchain_submitted':
        return <Badge variant="outline">Blockchain Submitted</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const viewScreenshot = (url: string) => {
    if (url) {
      const { data } = supabase.storage.from('payment-screenshots').getPublicUrl(url);
      window.open(data.publicUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading Transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              Transaction Management
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>All Transactions ({transactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Crypto</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Total (₹)</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {transaction.user_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.cryptocurrencies?.symbol}</div>
                          <div className="text-sm text-muted-foreground">{transaction.cryptocurrencies?.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.amount}</TableCell>
                      <TableCell className="font-semibold">₹{transaction.total_amount}</TableCell>
                      <TableCell>{transaction.payment_methods?.name || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setAdminNotes(transaction.admin_notes || "");
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Transaction Details</DialogTitle>
                              <DialogDescription>
                                Review and manage transaction
                              </DialogDescription>
                            </DialogHeader>
                            {selectedTransaction && (
                              <div className="space-y-6">
                                {/* Transaction Info */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Transaction ID</Label>
                                    <div className="font-mono text-sm">{selectedTransaction.id}</div>
                                  </div>
                                  <div>
                                    <Label>User ID</Label>
                                    <div className="font-mono text-sm">{selectedTransaction.user_id}</div>
                                  </div>
                                  <div>
                                    <Label>Cryptocurrency</Label>
                                    <div>{selectedTransaction.cryptocurrencies?.name} ({selectedTransaction.cryptocurrencies?.symbol})</div>
                                  </div>
                                  <div>
                                    <Label>Amount</Label>
                                    <div>{selectedTransaction.amount} {selectedTransaction.cryptocurrencies?.symbol}</div>
                                  </div>
                                  <div>
                                    <Label>Price per Unit</Label>
                                    <div>₹{selectedTransaction.price_per_unit}</div>
                                  </div>
                                  <div>
                                    <Label>Total Amount</Label>
                                    <div className="font-semibold">₹{selectedTransaction.total_amount}</div>
                                  </div>
                                </div>

                                {/* Blockchain Details */}
                                {selectedTransaction.blockchain_network && (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Blockchain Network</Label>
                                      <div>{selectedTransaction.blockchain_network}</div>
                                    </div>
                                    <div>
                                      <Label>Receive Address</Label>
                                      <div className="font-mono text-sm break-all">{selectedTransaction.receive_address}</div>
                                    </div>
                                  </div>
                                )}

                                {/* Payment Screenshot */}
                                {selectedTransaction.payment_screenshot_url && (
                                  <div>
                                    <Label>Payment Screenshot</Label>
                                    <Button 
                                      variant="outline" 
                                      onClick={() => viewScreenshot(selectedTransaction.payment_screenshot_url!)}
                                      className="mt-2"
                                    >
                                      View Screenshot
                                    </Button>
                                  </div>
                                )}

                                {/* Status and Notes */}
                                <div>
                                  <Label>Current Status</Label>
                                  <div className="mt-2">{getStatusBadge(selectedTransaction.status)}</div>
                                </div>

                                <div>
                                  <Label htmlFor="admin-notes">Admin Notes</Label>
                                  <Textarea
                                    id="admin-notes"
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add notes about this transaction..."
                                    className="mt-2"
                                  />
                                </div>

                                {/* Action Buttons */}
                                {selectedTransaction.status !== 'approved' && selectedTransaction.status !== 'rejected' && (
                                  <div className="flex gap-2">
                                    <Button 
                                      onClick={handleApprove}
                                      disabled={isApproving}
                                      className="flex-1"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      {isApproving ? 'Approving...' : 'Approve'}
                                    </Button>
                                    <Button 
                                      variant="destructive"
                                      onClick={handleReject}
                                      disabled={isRejecting}
                                      className="flex-1"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      {isRejecting ? 'Rejecting...' : 'Reject'}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminTransactions;