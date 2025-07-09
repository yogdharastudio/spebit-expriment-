import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Edit, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentMethod {
  id: string;
  name: string;
  icon_url: string;
  is_active: boolean;
  upi_id?: string;
  email_id?: string;
  bank_name?: string;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  created_at: string;
}

const AdminPaymentMethods = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    icon_url: "",
    is_active: true,
    upi_id: "",
    email_id: "",
    bank_name: "",
    account_holder_name: "",
    account_number: "",
    ifsc_code: ""
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payment methods",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const methodData = {
        name: formData.name,
        icon_url: formData.icon_url,
        is_active: formData.is_active,
        upi_id: formData.upi_id || null,
        email_id: formData.email_id || null,
        bank_name: formData.bank_name || null,
        account_holder_name: formData.account_holder_name || null,
        account_number: formData.account_number || null,
        ifsc_code: formData.ifsc_code || null
      };

      if (editingMethod) {
        const { error } = await supabase
          .from('payment_methods')
          .update(methodData)
          .eq('id', editingMethod.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Payment method updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('payment_methods')
          .insert([methodData]);
        
        if (error) throw error;
        
        toast({
          title: "Success", 
          description: "Payment method added successfully"
        });
      }

      setIsDialogOpen(false);
      setEditingMethod(null);
      resetForm();
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast({
        title: "Error",
        description: "Failed to save payment method",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      icon_url: "",
      is_active: true,
      upi_id: "",
      email_id: "",
      bank_name: "",
      account_holder_name: "",
      account_number: "",
      ifsc_code: ""
    });
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      icon_url: method.icon_url || "",
      is_active: method.is_active,
      upi_id: method.upi_id || "",
      email_id: method.email_id || "",
      bank_name: method.bank_name || "",
      account_holder_name: method.account_holder_name || "",
      account_number: method.account_number || "",
      ifsc_code: method.ifsc_code || ""
    });
    setIsDialogOpen(true);
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Payment method ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error toggling payment method status:', error);
      toast({
        title: "Error",
        description: "Failed to update payment method status",
        variant: "destructive"
      });
    }
  };

  const getPaymentDetails = (method: PaymentMethod) => {
    if (method.name === 'PayPal' && method.email_id) {
      return method.email_id;
    } else if (method.name === 'Bank Transfer' && method.account_number) {
      return `${method.bank_name} - ${method.account_number}`;
    } else if (method.upi_id) {
      return method.upi_id;
    }
    return 'Not configured';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading Payment Methods...</p>
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
              <Button variant="ghost" onClick={() => navigate("/admin")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
              <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                <CreditCard className="h-6 w-6" />
                Payment Methods Management
              </h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingMethod(null);
                  resetForm();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingMethod ? 'Edit Payment Method' : 'Add New Payment Method'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure payment method details that users will see
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Method Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Google Pay"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="icon">Icon URL</Label>
                      <Input
                        id="icon"
                        value={formData.icon_url}
                        onChange={(e) => setFormData({...formData, icon_url: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* UPI Details */}
                  <div>
                    <Label htmlFor="upi">UPI ID (for UPI-based methods)</Label>
                    <Input
                      id="upi"
                      value={formData.upi_id}
                      onChange={(e) => setFormData({...formData, upi_id: e.target.value})}
                      placeholder="admin@googlepay"
                    />
                  </div>

                  {/* Email Details */}
                  <div>
                    <Label htmlFor="email">Email ID (for PayPal)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email_id}
                      onChange={(e) => setFormData({...formData, email_id: e.target.value})}
                      placeholder="admin@paypal.com"
                    />
                  </div>

                  {/* Bank Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Bank Transfer Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bank_name">Bank Name</Label>
                        <Input
                          id="bank_name"
                          value={formData.bank_name}
                          onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                          placeholder="State Bank of India"
                        />
                      </div>
                      <div>
                        <Label htmlFor="account_holder">Account Holder Name</Label>
                        <Input
                          id="account_holder"
                          value={formData.account_holder_name}
                          onChange={(e) => setFormData({...formData, account_holder_name: e.target.value})}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="account_number">Account Number</Label>
                        <Input
                          id="account_number"
                          value={formData.account_number}
                          onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                          placeholder="1234567890123456"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ifsc">IFSC Code</Label>
                        <Input
                          id="ifsc"
                          value={formData.ifsc_code}
                          onChange={(e) => setFormData({...formData, ifsc_code: e.target.value})}
                          placeholder="SBIN0001234"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingMethod ? 'Update' : 'Add'} Payment Method
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>All Payment Methods ({paymentMethods.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Icon</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Payment Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell>
                        <img 
                          src={method.icon_url || '/placeholder.svg'} 
                          alt={method.name}
                          className="w-8 h-8 rounded"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{method.name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {getPaymentDetails(method)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={method.is_active ? "default" : "secondary"}
                          size="sm"
                          onClick={() => toggleStatus(method.id, method.is_active)}
                        >
                          {method.is_active ? "Active" : "Inactive"}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {new Date(method.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(method)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
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

export default AdminPaymentMethods;