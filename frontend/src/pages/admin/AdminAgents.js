import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Trash2, Users, Copy, Eye, EyeOff } from 'lucide-react';

const AdminAgents = () => {
  const { api } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [form, setForm] = useState({ username: '', password: '', display_name: '' });

  const loadAgents = async () => {
    try {
      const res = await api.get('/admin/agents');
      if (res.data.ok) setAgents(res.data.data.agents);
    } catch { toast.error('Failed to load agents'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAgents(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return toast.error('Username and password required');
    setCreating(true);
    try {
      const res = await api.post('/admin/agents', form);
      if (res.data.ok) {
        toast.success(`Agent "${form.display_name || form.username}" created`);
        setForm({ username: '', password: '', display_name: '' });
        loadAgents();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create agent');
    } finally { setCreating(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete agent "${name}"?`)) return;
    try {
      await api.delete(`/admin/agents/${id}`);
      toast.success('Agent deleted');
      loadAgents();
    } catch { toast.error('Failed to delete agent'); }
  };

  return (
    <AdminLayout title="Agents">
      {/* Create Agent */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Create Agent
          </CardTitle>
          <CardDescription>Agents can create client accounts at /CreateAccount</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex items-end gap-4">
            <div className="flex-1 space-y-1.5">
              <Label>Display Name</Label>
              <Input value={form.display_name} onChange={(e) => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Marco Rossi" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Username *</Label>
              <Input value={form.username} onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))} placeholder="marco" required />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Password *</Label>
              <Input value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Password" required />
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create Agent'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Agents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" /> All Agents ({agents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : agents.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No agents created yet.</p>
          ) : (
            <div className="divide-y">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between py-4 px-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{agent.display_name}</p>
                      <p className="text-sm text-gray-500">@{agent.username}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-gray-600 font-mono">
                        {showPasswords[agent.id] ? agent.plain_password : '••••••••'}
                      </span>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 p-0.5"
                        onClick={() => setShowPasswords(p => ({ ...p, [agent.id]: !p[agent.id] }))}
                      >
                        {showPasswords[agent.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-blue-600 p-0.5"
                        onClick={() => { navigator.clipboard.writeText(agent.plain_password || ''); toast.success('Password copied'); }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className="bg-blue-100 text-blue-700">
                      {agent.accounts_created || 0} accounts
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(agent.created_at).toLocaleDateString('en-GB')}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(agent.id, agent.display_name)} className="text-red-500 hover:text-red-700 h-8 w-8 p-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
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

export default AdminAgents;
