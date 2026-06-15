import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Wallet, Plus, Trash2 } from 'lucide-react';

const AdminWalletPool = () => {
  const { api } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [available, setAvailable] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newAddresses, setNewAddresses] = useState('');
  const [adding, setAdding] = useState(false);

  const loadWallets = async () => {
    try {
      const res = await api.get('/admin/wallet-pool');
      if (res.data.ok) {
        setWallets(res.data.data.wallets);
        setAvailable(res.data.data.available);
        setTotal(res.data.data.total);
      }
    } catch { toast.error('Failed to load wallet pool'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadWallets(); }, []);

  const handleAddWallets = async () => {
    const addresses = newAddresses.split('\n').map(a => a.trim()).filter(a => a);
    if (addresses.length === 0) return toast.error('Enter at least one wallet address');
    setAdding(true);
    try {
      const res = await api.post('/admin/wallet-pool', { addresses });
      if (res.data.ok) {
        toast.success(res.data.message);
        setNewAddresses('');
        loadWallets();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add wallets');
    } finally { setAdding(false); }
  };

  const handleRemove = async (id) => {
    try {
      await api.delete(`/admin/wallet-pool/${id}`);
      toast.success('Wallet removed');
      loadWallets();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Cannot remove assigned wallet');
    }
  };

  return (
    <AdminLayout title="Wallet Pool">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-3xl font-bold text-green-600">{available}</p>
            <p className="text-sm text-gray-500">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{total - available}</p>
            <p className="text-sm text-gray-500">Assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-3xl font-bold text-gray-700">{total}</p>
            <p className="text-sm text-gray-500">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Wallets */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Wallets
          </CardTitle>
          <CardDescription>Paste wallet addresses, one per line</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={newAddresses}
            onChange={(e) => setNewAddresses(e.target.value)}
            placeholder={"0xABC123...def\n0xDEF456...abc\n0x789GHI...jkl"}
            rows={5}
            data-testid="wallet-pool-textarea"
          />
          <Button onClick={handleAddWallets} disabled={adding || !newAddresses.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            {adding ? 'Adding...' : 'Add Wallets'}
          </Button>
        </CardContent>
      </Card>

      {/* Wallet List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" /> All Wallets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : wallets.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No wallets in pool. Add some above.</p>
          ) : (
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {wallets.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-3 px-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge className={w.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                      {w.status}
                    </Badge>
                    <span className="text-sm font-mono text-gray-700 truncate">{w.address}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    {w.assigned_email && (
                      <span className="text-xs text-gray-500">{w.assigned_email}</span>
                    )}
                    {w.status === 'available' && (
                      <Button variant="ghost" size="sm" onClick={() => handleRemove(w.id)} className="text-red-500 hover:text-red-700 h-8 w-8 p-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminWalletPool;
