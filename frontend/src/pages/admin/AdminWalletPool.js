import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Wallet, Plus, Trash2, RotateCcw, Unlock, Archive } from 'lucide-react';

const AdminWalletPool = () => {
  const { api } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [available, setAvailable] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newAddresses, setNewAddresses] = useState('');
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState('active'); // 'active' | 'archived'

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
      if (res.data.ok) { toast.success(res.data.message); setNewAddresses(''); loadWallets(); }
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
    finally { setAdding(false); }
  };

  const handleAction = async (id, action, label) => {
    try {
      if (action === 'delete') {
        if (!window.confirm('Permanently delete this wallet?')) return;
        await api.delete(`/admin/wallet-pool/${id}`);
      } else {
        await api.put(`/admin/wallet-pool/${id}/${action}`);
      }
      toast.success(label);
      loadWallets();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const activeWallets = wallets.filter(w => w.status !== 'archived');
  const archivedWallets = wallets.filter(w => w.status === 'archived');
  const displayWallets = tab === 'active' ? activeWallets : archivedWallets;

  const filtered = displayWallets.filter(w => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (w.address || '').toLowerCase().includes(q) ||
           (w.assigned_email || '').toLowerCase().includes(q);
  });

  const assignedCount = wallets.filter(w => w.status === 'assigned').length;

  return (
    <AdminLayout title="Wallet Pool">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-5 pb-4 text-center">
          <p className="text-3xl font-bold text-green-600">{available}</p>
          <p className="text-sm text-gray-500">Available</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{assignedCount}</p>
          <p className="text-sm text-gray-500">Assigned</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-4 text-center">
          <p className="text-3xl font-bold text-orange-500">{archivedWallets.length}</p>
          <p className="text-sm text-gray-500">Archived</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-4 text-center">
          <p className="text-3xl font-bold text-gray-700">{total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </CardContent></Card>
      </div>

      {/* Add Wallets */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" /> Add Wallets</CardTitle>
          <CardDescription>Paste wallet addresses, one per line</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={newAddresses} onChange={(e) => setNewAddresses(e.target.value)} placeholder={"0xABC123...def\n0xDEF456...abc"} rows={4} data-testid="wallet-pool-textarea" />
          <Button onClick={handleAddWallets} disabled={adding || !newAddresses.trim()}>
            <Plus className="w-4 h-4 mr-2" />{adding ? 'Adding...' : 'Add Wallets'}
          </Button>
        </CardContent>
      </Card>

      {/* Wallet List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5" /> Wallets</CardTitle>
          <div className="flex gap-2 mt-3">
            <Button variant={tab === 'active' ? 'default' : 'outline'} size="sm" onClick={() => setTab('active')}>
              Active ({activeWallets.length})
            </Button>
            <Button variant={tab === 'archived' ? 'default' : 'outline'} size="sm" onClick={() => setTab('archived')}>
              <Archive className="w-3.5 h-3.5 mr-1" /> Archived ({archivedWallets.length})
            </Button>
          </div>
          <div className="mt-3">
            <Input placeholder="Search by wallet address or assigned email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} data-testid="wallet-pool-search" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-8">{searchQuery ? 'No wallets match.' : tab === 'archived' ? 'No archived wallets.' : 'No wallets. Add some above.'}</p>
          ) : (
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {filtered.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-3 px-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge className={
                      w.status === 'available' ? 'bg-green-100 text-green-700' :
                      w.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }>
                      {w.status}
                    </Badge>
                    <span className="text-sm font-mono text-gray-700 truncate">{w.address}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {w.assigned_email && <span className="text-xs text-gray-500">{w.assigned_email}</span>}

                    {/* Actions based on status */}
                    {w.status === 'assigned' && (
                      <Button variant="ghost" size="sm" onClick={() => handleAction(w.id, 'release', 'Wallet released')} className="text-green-600 hover:text-green-800 h-8 px-2" title="Release (make available)">
                        <Unlock className="w-4 h-4" />
                      </Button>
                    )}
                    {(w.status === 'available' || w.status === 'assigned') && (
                      <Button variant="ghost" size="sm" onClick={() => handleAction(w.id, 'archive', 'Wallet archived')} className="text-orange-500 hover:text-orange-700 h-8 px-2" title="Archive">
                        <Archive className="w-4 h-4" />
                      </Button>
                    )}
                    {w.status === 'archived' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleAction(w.id, 'restore', 'Wallet restored')} className="text-green-600 hover:text-green-800 h-8 px-2" title="Restore">
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleAction(w.id, 'delete', 'Wallet permanently deleted')} className="text-red-500 hover:text-red-700 h-8 px-2" title="Delete permanently">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
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
