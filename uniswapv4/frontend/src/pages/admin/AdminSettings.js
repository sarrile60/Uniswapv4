import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, Mail, Shield, Info, Landmark, Building2, Upload, CheckCircle } from 'lucide-react';

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
    sender_email: 'info@uniswapv4.com',
    default_withdrawal_iban: 'MT29CFTE28004000000000005634364',
    default_withdrawal_swift: 'CFTEMTM1',
    default_connected_app_name: '',
    default_connected_app_logo: '',
    auto_approve_kyc: false,
    auto_approve_kyc_minutes: 30,
  });

  useEffect(() => {
    loadSettings();
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
      <AdminLayout title="Settings">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
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
                placeholder="e.g. CHIANTIN BANK"
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
    </AdminLayout>
  );
};

export default AdminSettings;
