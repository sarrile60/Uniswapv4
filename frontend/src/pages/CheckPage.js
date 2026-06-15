import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CheckPage = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null); // null | 'found' | 'not_found'
  const [loading, setLoading] = useState(false);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.get(`${API_URL}/api/public/check-user`, { params: { q: query.trim() } });
      setResult(res.data.found ? 'found' : 'not_found');
    } catch {
      setResult('not_found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-8 pb-8 px-6">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-900">User Verification</h1>
            <p className="text-sm text-gray-500 mt-1">Check if a user is registered</p>
          </div>

          <form onSubmit={handleCheck} className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setResult(null); }}
                placeholder="Enter name or email"
                className="flex-1"
                data-testid="check-user-input"
              />
              <Button type="submit" disabled={loading || !query.trim()} data-testid="check-user-btn">
                <Search className="w-4 h-4 mr-1" />
                {loading ? '...' : 'Check'}
              </Button>
            </div>
          </form>

          {result === 'found' && (
            <div className="mt-5 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg" data-testid="check-result-found">
              <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-green-800">Yes, Registered</p>
                <p className="text-sm text-green-600">This user is registered in the system.</p>
              </div>
            </div>
          )}

          {result === 'not_found' && (
            <div className="mt-5 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="check-result-not-found">
              <XCircle className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <p className="font-semibold text-red-800">Not Found</p>
                <p className="text-sm text-red-600">No user found with this name or email.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckPage;
