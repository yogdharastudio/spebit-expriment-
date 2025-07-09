import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Edit, Trash2, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Cryptocurrency {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  logo_url: string;
  is_active: boolean;
  created_at: string;
}

const AdminCryptocurrencies = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cryptocurrencies, setCryptocurrencies] = useState<Cryptocurrency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCrypto, setEditingCrypto] = useState<Cryptocurrency | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    current_price: "",
    logo_url: "",
    is_active: true
  });

  useEffect(() => {
    fetchCryptocurrencies();
  }, []);

  const fetchCryptocurrencies = async () => {
    try {
      const { data, error } = await supabase
        .from('cryptocurrencies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCryptocurrencies(data || []);
    } catch (error) {
      console.error('Error fetching cryptocurrencies:', error);
      toast({
        title: "Error",
        description: "Failed to fetch cryptocurrencies",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const cryptoData = {
        name: formData.name,
        symbol: formData.symbol.toUpperCase(),
        current_price: parseFloat(formData.current_price),
        logo_url: formData.logo_url,
        is_active: formData.is_active
      };

      if (editingCrypto) {
        const { error } = await supabase
          .from('cryptocurrencies')
          .update(cryptoData)
          .eq('id', editingCrypto.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Cryptocurrency updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('cryptocurrencies')
          .insert([cryptoData]);
        
        if (error) throw error;
        
        toast({
          title: "Success", 
          description: "Cryptocurrency added successfully"
        });
      }

      setIsDialogOpen(false);
      setEditingCrypto(null);
      setFormData({
        name: "",
        symbol: "",
        current_price: "",
        logo_url: "",
        is_active: true
      });
      fetchCryptocurrencies();
    } catch (error) {
      console.error('Error saving cryptocurrency:', error);
      toast({
        title: "Error",
        description: "Failed to save cryptocurrency",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (crypto: Cryptocurrency) => {
    setEditingCrypto(crypto);
    setFormData({
      name: crypto.name,
      symbol: crypto.symbol,
      current_price: crypto.current_price.toString(),
      logo_url: crypto.logo_url || "",
      is_active: crypto.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cryptocurrency?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cryptocurrencies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Cryptocurrency deleted successfully"
      });
      fetchCryptocurrencies();
    } catch (error) {
      console.error('Error deleting cryptocurrency:', error);
      toast({
        title: "Error",
        description: "Failed to delete cryptocurrency",
        variant: "destructive"
      });
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('cryptocurrencies')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Cryptocurrency ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
      fetchCryptocurrencies();
    } catch (error) {
      console.error('Error toggling cryptocurrency status:', error);
      toast({
        title: "Error",
        description: "Failed to update cryptocurrency status",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading Cryptocurrencies...</p>
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
                <Coins className="h-6 w-6" />
                Cryptocurrency Management
              </h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingCrypto(null);
                  setFormData({
                    name: "",
                    symbol: "",
                    current_price: "",
                    logo_url: "",
                    is_active: true
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Cryptocurrency
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCrypto ? 'Edit Cryptocurrency' : 'Add New Cryptocurrency'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCrypto ? 'Update cryptocurrency details' : 'Add a new cryptocurrency to the platform'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Bitcoin"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="symbol">Symbol</Label>
                    <Input
                      id="symbol"
                      value={formData.symbol}
                      onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                      placeholder="BTC"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Current Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.current_price}
                      onChange={(e) => setFormData({...formData, current_price: e.target.value})}
                      placeholder="5000000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="logo">Logo URL</Label>
                    <Input
                      id="logo"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingCrypto ? 'Update' : 'Add'} Cryptocurrency
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
            <CardTitle>All Cryptocurrencies ({cryptocurrencies.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Logo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Price (₹)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cryptocurrencies.map((crypto) => (
                    <TableRow key={crypto.id}>
                      <TableCell>
                        <img 
                          src={crypto.logo_url || '/placeholder.svg'} 
                          alt={crypto.name}
                          className="w-8 h-8 rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{crypto.name}</TableCell>
                      <TableCell className="font-mono">{crypto.symbol}</TableCell>
                      <TableCell className="font-semibold">
                        ₹{crypto.current_price.toFixed(crypto.current_price < 1 ? 6 : 2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={crypto.is_active ? "default" : "secondary"}
                          size="sm"
                          onClick={() => toggleStatus(crypto.id, crypto.is_active)}
                        >
                          {crypto.is_active ? "Active" : "Inactive"}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {new Date(crypto.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(crypto)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(crypto.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

export default AdminCryptocurrencies;