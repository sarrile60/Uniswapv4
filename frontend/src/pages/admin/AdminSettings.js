import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, Mail, Shield, Info, Landmark, Building2, Upload, CheckCircle, Globe, Send, Users, User } from 'lucide-react';

const AdminSettings = () => {
  const { api, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    maintenance_message: '',
    allow_registration: true,
    resend_api_key: '',
    sender_email: 'info@uni-swapv4.org',
    default_withdrawal_iban: 'MT29CFTE28004000000000005634364',
    default_withdrawal_swift: 'CFTEMTM1',
    default_connected_app_name: '',
    default_connected_app_logo: '',
    auto_approve_kyc: false,
    auto_approve_kyc_minutes: 30,
  });

  // Domain migration notification state
  const [domainNotif, setDomainNotif] = useState({
    old_domain: '',
    new_domain: '',
    target: 'all', // 'all' or a specific user email
    lang: 'it',
  });
  const [sendingDomain, setSendingDomain] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    loadSettings();
    loadUsersList();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      if (response.data.ok) {
        setSettings(response.data.data.settings);
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadUsersList = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get('/admin/users?page=1&page_size=500');
      if (response.data.ok) {
        const allUsers = response.data.data.users || [];
        // Filter to only show non-admin users (clients)
        const clients = allUsers.filter(u => u.role === 'user');
        setUsersList(clients);
      }
    } catch (error) {
      console.error('Failed to load users for domain notification');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSendDomainNotification = async () => {
    if (!domainNotif.old_domain.trim()) {
      toast.error('Please enter the old domain');
      return;
    }
    if (!domainNotif.new_domain.trim()) {
      toast.error('Please enter the new domain');
      return;
    }

    const targetLabel = domainNotif.target === 'all' 
      ? 'ALL registered users in your tenant' 
      : domainNotif.target;

    if (!window.confirm(`Are you sure you want to send the domain migration email to ${targetLabel}?`)) {
      return;
    }

    setSendingDomain(true);
    try {
      if (domainNotif.target === 'all') {
        // Broadcast to all users in admin's tenant
        const response = await api.post('/admin/broadcast-email', {
          email_type: 'domain_change',
          lang: domainNotif.lang,
          old_domain: domainNotif.old_domain.trim(),
          new_domain: domainNotif.new_domain.trim(),
        });
        if (response.data.ok) {
          const d = response.data.data;
          toast.success(`Domain notification sent! ${d.sent}/${d.total} emails delivered${d.failed > 0 ? `, ${d.failed} failed` : ''}`);
        }
      } else {
        // Send to a single user — find user by email
        const targetUser = usersList.find(u => u.email === domainNotif.target);
        if (!targetUser) {
          toast.error('Selected user not found');
          setSendingDomain(false);
          return;
        }
        const response = await api.post(`/admin/users/${targetUser.id}/send-email`, {
          email_type: 'domain_change',
          lang: domainNotif.lang,
          old_domain: domainNotif.old_domain.trim(),
          new_domain: domainNotif.new_domain.trim(),
        });
        if (response.data.ok) {
          toast.success(`Domain notification sent to ${domainNotif.target}`);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send domain notification');
    } finally {
      setSendingDomain(false);
    }
  };

  const handleSave = async () => {
    if (user?.role !== 'superadmin') {
      toast.error('Only superadmins can modify settings');
      return;
    }

    setSaving(true);
    try {
      const payload = {};
      if (settings.maintenance_mode !== undefined) payload.maintenance_mode = settings.maintenance_mode;
      if (settings.maintenance_message) payload.maintenance_message = settings.maintenance_message;
      if (settings.allow_registration !== undefined) payload.allow_registration = settings.allow_registration;
      if (settings.resend_api_key && settings.resend_api_key !== '***configured***') {
        payload.resend_api_key = settings.resend_api_key;
      }
      if (settings.sender_email) payload.sender_email = settings.sender_email;
      if (settings.default_withdrawal_iban) payload.default_withdrawal_iban = settings.default_withdrawal_iban;
      if (settings.default_withdrawal_swift) payload.default_withdrawal_swift = settings.default_withdrawal_swift;
      if (settings.default_connected_app_name !== undefined) payload.default_connected_app_name = settings.default_connected_app_name;
      if (settings.default_connected_app_logo !== undefined) payload.default_connected_app_logo = settings.default_connected_app_logo;
      if (settings.auto_approve_kyc !== undefined) payload.auto_approve_kyc = settings.auto_approve_kyc;
      if (settings.auto_approve_kyc_minutes !== undefined) payload.auto_approve_kyc_minutes = settings.auto_approve_kyc_minutes;

      const response = await api.put('/admin/settings', payload);
      if (response.data.ok) {
        toast.success('Settings saved successfully');
        loadSettings();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/admin/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.ok) {
        setSettings(s => ({ ...s, default_connected_app_logo: res.data.data.url }));
        toast.success('Logo uploaded — click Save to apply to all users');
      }
    } catch (err) {
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-2xl space-y-6">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              System Status
            </CardTitle>
            <CardDescription>Control system availability and registration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-gray-500">Disable access for all users</p>
              </div>
              <Switch
                checked={settings.maintenance_mode}
                onCheckedChange={(v) => setSettings(s => ({ ...s, maintenance_mode: v }))}
              />
            </div>

            {settings.maintenance_mode && (
              <div className="space-y-2">
                <Label>Maintenance Message</Label>
                <Input
                  value={settings.maintenance_message}
                  onChange={(e) => setSettings(s => ({ ...s, maintenance_message: e.target.value }))}
                  placeholder="System is under maintenance..."
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Public Registration</Label>
                <p className="text-sm text-gray-500">Let users sign up themselves</p>
              </div>
              <Switch
                checked={settings.allow_registration}
                onCheckedChange={(v) => setSettings(s => ({ ...s, allow_registration: v }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Email Settings (Resend)
            </CardTitle>
            <CardDescription>Configure email service for automated notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Get your Resend API key from <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">resend.com/api-keys</a>. 
                  You'll also need to verify a domain for sending emails.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Resend API Key</Label>
              <Input
                type="password"
                value={settings.resend_api_key}
                onChange={(e) => setSettings(s => ({ ...s, resend_api_key: e.target.value }))}
                placeholder="re_xxxxxxxxxxxxx"
              />
              {settings.resend_api_key === '***configured***' && (
                <p className="text-xs text-green-600">API key is configured</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Sender Email</Label>
              <Input
                type="email"
                value={settings.sender_email}
                onChange={(e) => setSettings(s => ({ ...s, sender_email: e.target.value }))}
                placeholder="noreply@yourdomain.com"
              />
              <p className="text-xs text-gray-500">Must be from a verified domain in Resend</p>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Bank Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Landmark className="w-5 h-5 mr-2" />
              Withdrawal Bank Settings
            </CardTitle>
            <CardDescription>Default IBAN and SWIFT/BIC used for all client withdrawals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  These bank details are automatically applied to all client withdrawals. Clients cannot modify these fields. Changes take effect immediately for new withdrawals.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>IBAN</Label>
              <Input
                data-testid="admin-withdrawal-iban"
                value={settings.default_withdrawal_iban}
                onChange={(e) => setSettings(s => ({ ...s, default_withdrawal_iban: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                placeholder="MT29CFTE28004000000000005634364"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>SWIFT / BIC</Label>
              <Input
                data-testid="admin-withdrawal-swift"
                value={settings.default_withdrawal_swift}
                onChange={(e) => setSettings(s => ({ ...s, default_withdrawal_swift: e.target.value.toUpperCase().trim() }))}
                placeholder="CFTEMTM1"
                className="font-mono"
              />
            </div>
          </CardContent>
        </Card>

        {/* Default Connected App */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Default Connected App
            </CardTitle>
            <CardDescription>Set the bank/app name and logo for all users. Saving updates all existing users too.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>App / Bank Name</Label>
              <Input
                value={settings.default_connected_app_name}
                onChange={(e) => setSettings(s => ({ ...s, default_connected_app_name: e.target.value }))}
                placeholder="e.g. Merchant UAB"
                data-testid="default-app-name"
              />
            </div>

            <div className="space-y-2">
              <Label>App / Bank Logo</Label>
              <div className="flex items-center gap-4">
                {settings.default_connected_app_logo && (
                  <img
                    src={settings.default_connected_app_logo}
                    alt="Logo"
                    className="w-14 h-14 rounded-lg object-contain border bg-white p-1"
                  />
                )}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : settings.default_connected_app_logo ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">Max 2MB. PNG, JPG, SVG supported.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KYC Auto-Approval */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              KYC Auto-Approval
            </CardTitle>
            <CardDescription>Automatically approve KYC submissions after a set delay</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Auto-Approval</Label>
                <p className="text-sm text-gray-500">KYC will be approved automatically after the configured delay</p>
              </div>
              <Switch
                data-testid="auto-approve-kyc-toggle"
                checked={settings.auto_approve_kyc}
                onCheckedChange={(v) => setSettings(s => ({ ...s, auto_approve_kyc: v }))}
              />
            </div>

            {settings.auto_approve_kyc && (
              <div className="space-y-2">
                <Label>Delay (minutes)</Label>
                <Input
                  data-testid="auto-approve-kyc-minutes"
                  type="number"
                  min="1"
                  value={settings.auto_approve_kyc_minutes}
                  onChange={(e) => setSettings(s => ({ ...s, auto_approve_kyc_minutes: e.target.value === '' ? '' : (parseInt(e.target.value) || '') }))}
                  onBlur={(e) => setSettings(s => ({ ...s, auto_approve_kyc_minutes: Math.max(1, parseInt(s.auto_approve_kyc_minutes) || 1) }))}
                  placeholder="30"
                />
                <p className="text-xs text-gray-500">Minimum 1 minute. KYC will be auto-approved this many minutes after submission.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Domain Migration Notification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Domain Migration Notification
            </CardTitle>
            <CardDescription>
              Notify users about a domain change. Emails are sent only to users in your tenant (Italy admin → Italy users, Canada admin → Canada users).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  A professional security-themed email will be sent informing clients about the infrastructure upgrade and new platform address. Their credentials remain unchanged.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Old Domain</Label>
                <Input
                  data-testid="domain-notif-old"
                  value={domainNotif.old_domain}
                  onChange={(e) => setDomainNotif(s => ({ ...s, old_domain: e.target.value }))}
                  placeholder="https://uni-swapv4.org"
                />
              </div>
              <div className="space-y-2">
                <Label>New Domain</Label>
                <Input
                  data-testid="domain-notif-new"
                  value={domainNotif.new_domain}
                  onChange={(e) => setDomainNotif(s => ({ ...s, new_domain: e.target.value }))}
                  placeholder="https://uni-swapv4.org"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Send To</Label>
              <select
                data-testid="domain-notif-target"
                value={domainNotif.target}
                onChange={(e) => setDomainNotif(s => ({ ...s, target: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">📧 All Registered Users (your tenant only)</option>
                {usersList.map(u => (
                  <option key={u.id} value={u.email}>
                    👤 {u.first_name} {u.last_name} — {u.email}
                  </option>
                ))}
              </select>
              {domainNotif.target === 'all' && (
                <p className="text-xs text-amber-600 font-medium">
                  ⚠️ This will send an email to ALL registered clients in your tenant database.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email Language</Label>
              <select
                data-testid="domain-notif-lang"
                value={domainNotif.lang}
                onChange={(e) => setDomainNotif(s => ({ ...s, lang: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="it">🇮🇹 Italiano</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                data-testid="domain-notif-send"
                onClick={handleSendDomainNotification}
                disabled={sendingDomain || !domainNotif.old_domain || !domainNotif.new_domain}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendingDomain 
                  ? 'Sending...' 
                  : domainNotif.target === 'all' 
                    ? 'Send to All Users' 
                    : 'Send to Selected User'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving || user?.role !== 'superadmin'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        {user?.role !== 'superadmin' && (
          <p className="text-sm text-orange-600 text-center">
            Only superadmins can modify system settings
          </p>
        )}
      </div>
    </>
  );
};

export default AdminSettings;
