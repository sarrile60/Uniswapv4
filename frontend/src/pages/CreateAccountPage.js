import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock, UserPlus, Copy, CheckCircle, Wallet } from 'lucide-react';
import { DateInput } from '@/components/DateInput';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CreateAccountPage = () => {
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableWallets, setAvailableWallets] = useState(null);
  const [createdUser, setCreatedUser] = useState(null);
  const [form, setForm] = useState({
    first_name: '', last_name: '', username: '', email: '', password: '',
    date_of_birth: '', start_date: '', end_date: '',
    eur_amount: '', total_fees: '',
  });

  const loadWalletCount = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/public/wallet-pool-count`);
      setAvailableWallets(res.data.available);
    } catch { setAvailableWallets(0); }
  }, []);

  useEffect(() => {
    if (pinUnlocked) loadWalletCount();
  }, [pinUnlocked, loadWalletCount]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pin === '8971') {
      setPinUnlocked(true);
    } else {
      toast.error('Invalid PIN');
      setPin('');
    }
  };

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.username || !form.email || !form.password || !form.date_of_birth) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/public/agent-create-user`, { ...form, pin: '8971' });
      if (res.data.ok) {
        setCreatedUser(res.data.data);
        loadWalletCount();
        toast.success('Account created successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    if (!createdUser) return;
    const text = `Full Name: ${createdUser.first_name} ${createdUser.last_name}
Email: ${createdUser.email}
Password: ${createdUser.password}
USDC Balance: €${createdUser.usdc_balance}
EUR Entered: €${createdUser.eur_amount}
Fees: €${createdUser.total_fees}
Transaction Period: ${createdUser.transaction_period}`;
    navigator.clipboard.writeText(text);
    toast.success('All details copied!');
  };

  // PIN Gate
  if (!pinUnlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-lg">
          <CardContent className="pt-8 pb-8 px-6">
            <div className="text-center mb-6">
              <Lock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h1 className="text-lg font-bold text-gray-900">Access Required</h1>
              <p className="text-sm text-gray-500 mt-1">Enter PIN to continue</p>
            </div>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <Input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
                className="text-center text-lg tracking-widest"
                maxLength={4}
                data-testid="agent-pin-input"
              />
              <Button type="submit" className="w-full" data-testid="agent-pin-submit">
                Enter
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success Summary
  if (createdUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-lg">
          <CardContent className="pt-8 pb-8 px-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h1 className="text-xl font-bold text-gray-900">Account Created</h1>
              <p className="text-sm text-gray-500 mt-1">Share these details with the client</p>
            </div>

            <div className="bg-gray-50 rounded-lg divide-y border">
              {[
                ['Full Name', `${createdUser.first_name} ${createdUser.last_name}`],
                ['Email', createdUser.email],
                ['Password', createdUser.password],
                ['USDC Balance', `€${createdUser.usdc_balance}`],
                ['EUR Entered', `€${createdUser.eur_amount}`],
                ['Fees', `€${createdUser.total_fees}`],
                ['Transaction Period', createdUser.transaction_period],
                ['Transactions Generated', createdUser.transactions_generated],
                ['Wallet Assigned', createdUser.wallet_assigned ? 'Yes' : 'No wallet available'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between px-4 py-3">
                  <span className="text-sm font-medium text-gray-600">{label}</span>
                  <span className="text-sm text-gray-900">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={copyAll} className="flex-1" variant="outline">
                <Copy className="w-4 h-4 mr-2" /> Copy All Details
              </Button>
              <Button onClick={() => { setCreatedUser(null); setForm({ first_name: '', last_name: '', username: '', email: '', password: '', date_of_birth: '', start_date: '', end_date: '', eur_amount: '', total_fees: '' }); }} className="flex-1">
                <UserPlus className="w-4 h-4 mr-2" /> Create Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Creation Form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Create Client Account
            </span>
            <span className="flex items-center gap-1.5 text-sm font-normal">
              <Wallet className="w-4 h-4 text-blue-500" />
              <span className={`font-semibold ${availableWallets > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {availableWallets !== null ? `${availableWallets} wallets available` : '...'}
              </span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-5">
            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input value={form.first_name} onChange={(e) => handleChange('first_name', e.target.value)} placeholder="Mario" required />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input value={form.last_name} onChange={(e) => handleChange('last_name', e.target.value)} placeholder="Rossi" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Username *</Label>
                <Input value={form.username} onChange={(e) => handleChange('username', e.target.value)} placeholder="mariorossi" required />
              </div>
              <div className="space-y-1.5">
                <Label>Date of Birth *</Label>
                <DateInput value={form.date_of_birth} onChange={(val) => handleChange('date_of_birth', val)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="client@email.com" required />
              </div>
              <div className="space-y-1.5">
                <Label>Password *</Label>
                <Input value={form.password} onChange={(e) => handleChange('password', e.target.value)} placeholder="Choose a password" required />
              </div>
            </div>

            {/* Financial */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Financial Setup</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>EUR Balance</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">&euro;</span>
                    <Input type="number" step="0.01" min="0" value={form.eur_amount} onChange={(e) => handleChange('eur_amount', e.target.value)} placeholder="60000" className="pl-7" />
                  </div>
                  <p className="text-xs text-gray-500">Auto-converts to USDC at live rate</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Total Fees / Commission</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">&euro;</span>
                    <Input type="number" step="0.01" min="0" value={form.total_fees} onChange={(e) => handleChange('total_fees', e.target.value)} placeholder="5400" className="pl-7" />
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction History Dates */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Transaction History Period</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <DateInput value={form.start_date} onChange={(val) => handleChange('start_date', val)} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <DateInput value={form.end_date} onChange={(val) => handleChange('end_date', val)} />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading || availableWallets === 0} className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base">
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            {availableWallets === 0 && (
              <p className="text-sm text-red-600 text-center">No wallets available. Contact admin to add wallets.</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateAccountPage;
