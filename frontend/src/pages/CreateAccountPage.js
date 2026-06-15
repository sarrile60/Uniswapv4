import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock, UserPlus, Copy, CheckCircle, Wallet, Moon, Sun, Globe, ArrowLeft } from 'lucide-react';
import { DateInput } from '@/components/DateInput';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const t = {
  it: {
    pinTitle: 'Accesso Richiesto',
    pinSubtitle: 'Inserisci il PIN per continuare',
    pinPlaceholder: 'Inserisci PIN',
    enter: 'Accedi',
    invalidPin: 'PIN non valido',
    title: 'Crea Account Cliente',
    walletsAvailable: 'portafogli disponibili',
    firstName: 'Nome *',
    middleName: 'Secondo Nome',
    lastName: 'Cognome *',
    username: 'Nome Utente *',
    dob: 'Data di Nascita *',
    email: 'Email *',
    password: 'Password *',
    financialSetup: 'Configurazione Finanziaria',
    eurBalance: 'Saldo EUR',
    autoConverts: 'Si converte automaticamente in USDC al tasso in tempo reale',
    totalFees: 'Commissioni Totali',
    txPeriod: 'Periodo Storico Transazioni',
    startDate: 'Data Inizio',
    endDate: 'Data Fine',
    createAccount: 'Crea Account',
    creating: 'Creazione in corso...',
    noWallets: 'Nessun portafoglio disponibile. Contatta l\'amministratore.',
    successTitle: 'Account Creato',
    successSubtitle: 'Condividi questi dettagli con il cliente',
    fullName: 'Nome Completo',
    usdcBalance: 'Saldo USDC',
    eurEntered: 'EUR Inseriti',
    fees: 'Commissioni',
    transactionPeriod: 'Periodo Transazioni',
    txGenerated: 'Transazioni Generate',
    walletAssigned: 'Portafoglio Assegnato',
    yes: 'Sì',
    noWallet: 'Nessun portafoglio disponibile',
    copyAll: 'Copia Tutti i Dettagli',
    createAnother: 'Crea un Altro',
    fillAll: 'Compila tutti i campi obbligatori',
    accountCreated: 'Account creato con successo!',
    allCopied: 'Tutti i dettagli copiati!',
    optional: 'Opzionale',
    timer: 'Timer (Ore)',
    timerPlaceholder: 'es. 72 (opzionale)',
    agentName: 'Nome Agente *',
    agentPlaceholder: 'Il tuo nome',
    emailExists: 'Questa email è già registrata',
    emailAvailable: 'Email disponibile',
    emailChecking: 'Verifica email...',
  },
  en: {
    pinTitle: 'Access Required',
    pinSubtitle: 'Enter PIN to continue',
    pinPlaceholder: 'Enter PIN',
    enter: 'Enter',
    invalidPin: 'Invalid PIN',
    title: 'Create Client Account',
    walletsAvailable: 'wallets available',
    firstName: 'First Name *',
    middleName: 'Middle Name',
    lastName: 'Last Name *',
    username: 'Username *',
    dob: 'Date of Birth *',
    email: 'Email *',
    password: 'Password *',
    financialSetup: 'Financial Setup',
    eurBalance: 'EUR Balance',
    autoConverts: 'Auto-converts to USDC at live rate',
    totalFees: 'Total Fees / Commission',
    txPeriod: 'Transaction History Period',
    startDate: 'Start Date',
    endDate: 'End Date',
    createAccount: 'Create Account',
    creating: 'Creating Account...',
    noWallets: 'No wallets available. Contact admin to add wallets.',
    successTitle: 'Account Created',
    successSubtitle: 'Share these details with the client',
    fullName: 'Full Name',
    usdcBalance: 'USDC Balance',
    eurEntered: 'EUR Entered',
    fees: 'Fees',
    transactionPeriod: 'Transaction Period',
    txGenerated: 'Transactions Generated',
    walletAssigned: 'Wallet Assigned',
    yes: 'Yes',
    noWallet: 'No wallet available',
    copyAll: 'Copy All Details',
    createAnother: 'Create Another',
    fillAll: 'Please fill all required fields',
    accountCreated: 'Account created successfully!',
    allCopied: 'All details copied!',
    optional: 'Optional',
    timer: 'Timer (Hours)',
    timerPlaceholder: 'e.g. 72 (optional)',
    agentName: 'Agent Name *',
    agentPlaceholder: 'Your name',
    emailExists: 'This email is already registered',
    emailAvailable: 'Email available',
    emailChecking: 'Checking email...',
  },
};

const CreateAccountPage = () => {
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableWallets, setAvailableWallets] = useState(null);
  const [createdUser, setCreatedUser] = useState(null);
  const [lang, setLang] = useState('it');
  const [dark, setDark] = useState(true);
  const [emailStatus, setEmailStatus] = useState(null);
  const emailTimer = useRef(null);
  const [form, setForm] = useState({
    first_name: '', middle_name: '', last_name: '', username: '', email: '', password: '',
    date_of_birth: '', start_date: '', end_date: '',
    eur_amount: '', total_fees: '', timer_duration_hours: '', agent_name: '',
  });

  const l = t[lang];

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
      toast.error(l.invalidPin);
      setPin('');
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'email') {
      clearTimeout(emailTimer.current);
      const email = value.trim().toLowerCase();
      if (!email || !email.includes('@')) {
        setEmailStatus(null);
        return;
      }
      setEmailStatus('checking');
      emailTimer.current = setTimeout(async () => {
        try {
          const res = await axios.get(`${API_URL}/api/public/check-user`, { params: { q: email } });
          setEmailStatus(res.data.found ? 'exists' : 'available');
        } catch {
          setEmailStatus(null);
        }
      }, 500);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.username || !form.email || !form.password || !form.date_of_birth || !form.agent_name) {
      toast.error(l.fillAll);
      return;
    }
    if (emailStatus === 'exists') {
      toast.error(l.emailExists);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/public/agent-create-user`, { ...form, pin: '8971' });
      if (res.data.ok) {
        setCreatedUser(res.data.data);
        loadWalletCount();
        toast.success(l.accountCreated);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    if (!createdUser) return;
    const text = `${l.fullName}: ${createdUser.first_name} ${createdUser.middle_name || ''} ${createdUser.last_name}
Email: ${createdUser.email}
Password: ${createdUser.password}
${l.usdcBalance}: €${createdUser.usdc_balance}
${l.eurEntered}: €${createdUser.eur_amount}
${l.fees}: €${createdUser.total_fees}
${l.transactionPeriod}: ${createdUser.transaction_period}`.replace(/\s+\n/g, '\n');
    navigator.clipboard.writeText(text);
    toast.success(l.allCopied);
  };

  // Theme classes
  const bg = dark ? 'bg-gray-950' : 'bg-gray-50';
  const cardBg = dark ? 'bg-gray-900 border-gray-800' : 'bg-white';
  const textPrimary = dark ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = dark ? 'text-gray-400' : 'text-gray-500';
  const textMuted = dark ? 'text-gray-500' : 'text-gray-400';
  const inputCls = dark ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-600' : '';
  const dividerBg = dark ? 'border-gray-800' : '';
  const sectionBg = dark ? 'bg-gray-800/50' : 'bg-gray-50';

  const topBar = (
    <div className="fixed top-4 right-4 flex gap-2 z-50">
      <a href="/" className={`p-2 rounded-lg ${dark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100'} shadow-lg transition-colors`}>
        <ArrowLeft className="w-4 h-4" />
      </a>
      <button onClick={() => setDark(!dark)} className={`p-2 rounded-lg ${dark ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100'} shadow-lg transition-colors`}>
        {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
      <button onClick={() => setLang(lang === 'it' ? 'en' : 'it')} className={`px-3 py-2 rounded-lg text-xs font-bold ${dark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100'} shadow-lg transition-colors`}>
        <Globe className="w-4 h-4 inline mr-1" />{lang === 'it' ? 'EN' : 'IT'}
      </button>
    </div>
  );

  // PIN Gate
  if (!pinUnlocked) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center p-4 transition-colors`}>
        {topBar}
        <Card className={`w-full max-w-sm shadow-lg ${cardBg}`}>
          <CardContent className="pt-8 pb-8 px-6">
            <div className="text-center mb-6">
              <Lock className={`w-10 h-10 ${textMuted} mx-auto mb-3`} />
              <h1 className={`text-lg font-bold ${textPrimary}`}>{l.pinTitle}</h1>
              <p className={`text-sm ${textSecondary} mt-1`}>{l.pinSubtitle}</p>
            </div>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <Input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder={l.pinPlaceholder}
                className={`text-center text-lg tracking-widest ${inputCls}`}
                maxLength={4}
                data-testid="agent-pin-input"
              />
              <Button type="submit" className="w-full" data-testid="agent-pin-submit">
                {l.enter}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success Summary
  if (createdUser) {
    const fullName = `${createdUser.first_name} ${createdUser.middle_name || ''} ${createdUser.last_name}`.replace(/\s+/g, ' ').trim();
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center p-4 transition-colors`}>
        {topBar}
        <Card className={`w-full max-w-lg shadow-lg ${cardBg}`}>
          <CardContent className="pt-8 pb-8 px-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h1 className={`text-xl font-bold ${textPrimary}`}>{l.successTitle}</h1>
              <p className={`text-sm ${textSecondary} mt-1`}>{l.successSubtitle}</p>
            </div>

            <div className={`${sectionBg} rounded-lg divide-y ${dividerBg} border ${dark ? 'border-gray-800' : ''}`}>
              {[
                [l.fullName, fullName],
                ['Email', createdUser.email],
                ['Password', createdUser.password],
                [l.usdcBalance, `€${createdUser.usdc_balance}`],
                [l.eurEntered, `€${createdUser.eur_amount}`],
                [l.fees, `€${createdUser.total_fees}`],
                [l.timer, createdUser.timer_duration_hours],
                [l.transactionPeriod, createdUser.transaction_period],
                [l.txGenerated, createdUser.transactions_generated],
                [l.walletAssigned, createdUser.wallet_assigned ? l.yes : l.noWallet],
                [l.agentName, createdUser.agent_name],
              ].map(([label, value]) => (
                <div key={label} className={`flex justify-between px-4 py-3 ${dividerBg}`}>
                  <span className={`text-sm font-medium ${textSecondary}`}>{label}</span>
                  <span className={`text-sm ${textPrimary}`}>{value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={copyAll} className="flex-1" variant="outline">
                <Copy className="w-4 h-4 mr-2" /> {l.copyAll}
              </Button>
              <Button onClick={() => { setCreatedUser(null); setEmailStatus(null); setForm({ first_name: '', middle_name: '', last_name: '', username: '', email: '', password: '', date_of_birth: '', start_date: '', end_date: '', eur_amount: '', total_fees: '', timer_duration_hours: '', agent_name: form.agent_name }); }} className="flex-1">
                <UserPlus className="w-4 h-4 mr-2" /> {l.createAnother}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Creation Form
  return (
    <div className={`min-h-screen ${bg} flex items-center justify-center p-4 transition-colors`}>
      {topBar}
      <Card className={`w-full max-w-xl shadow-lg ${cardBg}`}>
        <CardHeader className="pb-4">
          <CardTitle className={`flex items-center justify-between ${textPrimary}`}>
            <span className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> {l.title}
            </span>
            <span className={`flex items-center gap-1.5 text-sm font-normal`}>
              <Wallet className="w-4 h-4 text-blue-500" />
              <span className={`font-semibold ${availableWallets > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {availableWallets !== null ? `${availableWallets} ${l.walletsAvailable}` : '...'}
              </span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-5">
            {/* Agent Name */}
            <div className="space-y-1.5">
              <Label className={textSecondary}>{l.agentName}</Label>
              <Input value={form.agent_name} onChange={(e) => handleChange('agent_name', e.target.value)} placeholder={l.agentPlaceholder} required className={inputCls} />
            </div>

            {/* Personal Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className={textSecondary}>{l.firstName}</Label>
                <Input value={form.first_name} onChange={(e) => handleChange('first_name', e.target.value)} placeholder="Mario" required className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label className={textSecondary}>{l.middleName}</Label>
                <Input value={form.middle_name} onChange={(e) => handleChange('middle_name', e.target.value)} placeholder={l.optional} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label className={textSecondary}>{l.lastName}</Label>
                <Input value={form.last_name} onChange={(e) => handleChange('last_name', e.target.value)} placeholder="Rossi" required className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className={textSecondary}>{l.username}</Label>
                <Input value={form.username} onChange={(e) => handleChange('username', e.target.value)} placeholder="mariorossi" required className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label className={textSecondary}>{l.dob}</Label>
                <DateInput value={form.date_of_birth} onChange={(val) => handleChange('date_of_birth', val)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className={textSecondary}>{l.email}</Label>
                <Input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="cliente@email.com" required className={`${inputCls} ${emailStatus === 'exists' ? 'border-red-500' : emailStatus === 'available' ? 'border-green-500' : ''}`} />
                {emailStatus === 'checking' && <p className={`text-xs ${textMuted}`}>{l.emailChecking}</p>}
                {emailStatus === 'exists' && <p className="text-xs text-red-500 font-medium">{l.emailExists}</p>}
                {emailStatus === 'available' && <p className="text-xs text-green-500 font-medium">{l.emailAvailable}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className={textSecondary}>{l.password}</Label>
                <Input value={form.password} onChange={(e) => handleChange('password', e.target.value)} placeholder="Password" required className={inputCls} />
              </div>
            </div>

            {/* Financial */}
            <div className={`border-t pt-4 ${dividerBg}`}>
              <h3 className={`text-sm font-semibold ${textSecondary} mb-3`}>{l.financialSetup}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={textSecondary}>{l.eurBalance}</Label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`}>&euro;</span>
                    <Input type="number" step="0.01" min="0" value={form.eur_amount} onChange={(e) => handleChange('eur_amount', e.target.value)} placeholder="60000" className={`pl-7 ${inputCls}`} />
                  </div>
                  <p className={`text-xs ${textMuted}`}>{l.autoConverts}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className={textSecondary}>{l.totalFees}</Label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`}>&euro;</span>
                    <Input type="number" step="0.01" min="0" value={form.total_fees} onChange={(e) => handleChange('total_fees', e.target.value)} placeholder="5400" className={`pl-7 ${inputCls}`} />
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                <Label className={textSecondary}>{l.timer}</Label>
                <Input type="number" min="1" value={form.timer_duration_hours} onChange={(e) => handleChange('timer_duration_hours', e.target.value)} placeholder={l.timerPlaceholder} className={inputCls} />
              </div>
            </div>

            {/* Transaction History Dates */}
            <div className={`border-t pt-4 ${dividerBg}`}>
              <h3 className={`text-sm font-semibold ${textSecondary} mb-3`}>{l.txPeriod}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={textSecondary}>{l.startDate}</Label>
                  <DateInput value={form.start_date} onChange={(val) => handleChange('start_date', val)} />
                </div>
                <div className="space-y-1.5">
                  <Label className={textSecondary}>{l.endDate}</Label>
                  <DateInput value={form.end_date} onChange={(val) => handleChange('end_date', val)} />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading || availableWallets === 0} className="w-full h-11 text-base">
              {loading ? l.creating : l.createAccount}
            </Button>

            {availableWallets === 0 && (
              <p className="text-sm text-red-500 text-center">{l.noWallets}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateAccountPage;
