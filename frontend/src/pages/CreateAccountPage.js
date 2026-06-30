import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock, UserPlus, Copy, CheckCircle, Wallet, Moon, Sun, Globe, ArrowLeft, LogIn, User, Search, UserCheck, Users, Edit, Save } from 'lucide-react';
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
    loginTitle: 'Accesso Agente',
    loginSubtitle: 'Inserisci le tue credenziali',
    usernamePlaceholder: 'Nome utente',
    passwordPlaceholder: 'Password',
    login: 'Accedi',
    loggingIn: 'Accesso...',
    loggedAs: 'Connesso come',
    logout: 'Esci',
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
    timerNotSet: 'Non impostato',
    emailExists: 'Questa email è già registrata',
    emailAvailable: 'Email disponibile',
    emailChecking: 'Verifica email...',
    createdBy: 'Creato da',
    menuTitle: 'Cosa vuoi fare?',
    menuCreate: 'Crea Account',
    menuCreateDesc: 'Crea un nuovo account cliente',
    menuCheck: 'Verifica Account',
    menuCheckDesc: 'Cerca e visualizza info di un cliente',
    checkTitle: 'Verifica Account',
    checkSubtitle: 'Cerca per nome, cognome o email',
    searchPlaceholder: 'Nome, cognome o email...',
    search: 'Cerca',
    searching: 'Ricerca...',
    notFound: 'Nessun utente trovato',
    backToMenu: 'Torna al Menu',
    clientInfo: 'Informazioni Cliente',
    birthday: 'Data di Nascita',
    commission: 'Commissione',
    commissionPeriod: 'Periodo Commissioni',
    currentStatus: 'Stato Attuale',
    feesPaid: 'Commissioni Pagate',
    feesPaidYes: 'Sì',
    feesPaidNo: 'No',
    menuMyClients: 'I Miei Clienti',
    menuMyClientsDesc: 'Visualizza e modifica i tuoi clienti',
    myClientsTitle: 'I Miei Clienti',
    noClients: 'Nessun cliente trovato',
    edit: 'Modifica',
    save: 'Salva',
    saving: 'Salvataggio...',
    cancel: 'Annulla',
    updated: 'Cliente aggiornato!',
    createdOn: 'Creato il',
  },
  en: {
    pinTitle: 'Access Required',
    pinSubtitle: 'Enter PIN to continue',
    pinPlaceholder: 'Enter PIN',
    enter: 'Enter',
    invalidPin: 'Invalid PIN',
    loginTitle: 'Agent Login',
    loginSubtitle: 'Enter your credentials',
    usernamePlaceholder: 'Username',
    passwordPlaceholder: 'Password',
    login: 'Login',
    loggingIn: 'Logging in...',
    loggedAs: 'Logged in as',
    logout: 'Logout',
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
    timerNotSet: 'Not set',
    emailExists: 'This email is already registered',
    emailAvailable: 'Email available',
    emailChecking: 'Checking email...',
    createdBy: 'Created by',
    menuTitle: 'What would you like to do?',
    menuCreate: 'Create Account',
    menuCreateDesc: 'Create a new client account',
    menuCheck: 'Check Account',
    menuCheckDesc: 'Search and view client info',
    checkTitle: 'Check Account',
    checkSubtitle: 'Search by name, last name or email',
    searchPlaceholder: 'Name, last name or email...',
    search: 'Search',
    searching: 'Searching...',
    notFound: 'No user found',
    backToMenu: 'Back to Menu',
    clientInfo: 'Client Information',
    birthday: 'Date of Birth',
    commission: 'Commission',
    commissionPeriod: 'Commission Period',
    currentStatus: 'Current Status',
    feesPaid: 'Fees Paid',
    feesPaidYes: 'Yes',
    feesPaidNo: 'No',
    menuMyClients: 'My Clients',
    menuMyClientsDesc: 'View and edit your clients',
    myClientsTitle: 'My Clients',
    noClients: 'No clients found',
    edit: 'Edit',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    updated: 'Client updated!',
    createdOn: 'Created on',
  },
};

const CreateAccountPage = () => {
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [agentToken, setAgentToken] = useState(() => localStorage.getItem('agent_token') || '');
  const [agentInfo, setAgentInfo] = useState(() => {
    try { return JSON.parse(localStorage.getItem('agent_info') || 'null'); } catch { return null; }
  });
  const [agentCreds, setAgentCreds] = useState({ username: '', password: '' });
  const [loggingIn, setLoggingIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableWallets, setAvailableWallets] = useState(null);
  const [createdUser, setCreatedUser] = useState(null);
  const [mode, setMode] = useState(null); // null = menu, 'create', 'check'
  const [checkQuery, setCheckQuery] = useState('');
  const [checkResult, setCheckResult] = useState(null); // null | 'not_found' | {data}
  const [checkLoading, setCheckLoading] = useState(false);
  const [myClients, setMyClients] = useState([]);
  const [myClientsSearch, setMyClientsSearch] = useState('');
  const [myClientsLoading, setMyClientsLoading] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [lang, setLang] = useState('it');
  const [dark, setDark] = useState(() => localStorage.getItem('agent_dark_mode') === 'true');
  const [emailStatus, setEmailStatus] = useState(null);
  const emailTimer = useRef(null);
  const [form, setForm] = useState({
    first_name: '', middle_name: '', last_name: '', username: '', email: '', password: '',
    date_of_birth: '', start_date: '', end_date: '',
    eur_amount: '', total_fees: '', timer_duration_hours: '',
  });

  const l = t[lang];

  const loadWalletCount = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/public/wallet-pool-count`);
      setAvailableWallets(res.data.available);
    } catch { setAvailableWallets(0); }
  }, []);

  useEffect(() => {
    if (agentToken && agentInfo) { setPinUnlocked(true); loadWalletCount(); }
  }, [agentToken, agentInfo, loadWalletCount]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pin === '8971') { setPinUnlocked(true); }
    else { toast.error(l.invalidPin); setPin(''); }
  };

  const handleAgentLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const res = await axios.post(`${API_URL}/api/public/agent-login`, {
        pin: '8971', username: agentCreds.username, password: agentCreds.password,
      });
      if (res.data.ok) {
        const { token, ...info } = res.data.data;
        setAgentToken(token);
        setAgentInfo(info);
        localStorage.setItem('agent_token', token);
        localStorage.setItem('agent_info', JSON.stringify(info));
        loadWalletCount();
        toast.success(`${l.loggedAs} ${info.display_name}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally { setLoggingIn(false); }
  };

  const handleAgentLogout = () => {
    setAgentToken(''); setAgentInfo(null); setMode(null);
    localStorage.removeItem('agent_token'); localStorage.removeItem('agent_info');
    setPinUnlocked(false); setPin('');
  };

  const handleCheckAccount = async (e) => {
    e.preventDefault();
    if (!checkQuery.trim()) return;
    setCheckLoading(true);
    setCheckResult(null);
    try {
      const res = await axios.get(`${API_URL}/api/public/agent-check-user`, {
        params: { q: checkQuery.trim() },
        headers: { Authorization: `Bearer ${agentToken}` },
      });
      if (res.data.found) {
        setCheckResult(res.data.data);
      } else {
        setCheckResult('not_found');
      }
    } catch (err) {
      const detail = err.response?.data?.detail || '';
      if (detail.includes('expired') || detail.includes('token')) { handleAgentLogout(); }
      toast.error(detail || 'Search failed');
    } finally { setCheckLoading(false); }
  };

  const loadMyClients = async (search = '') => {
    setMyClientsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/public/agent-my-clients`, {
        params: search ? { q: search } : {},
        headers: { Authorization: `Bearer ${agentToken}` },
      });
      if (res.data.ok) setMyClients(res.data.data.clients);
    } catch (err) {
      const detail = err.response?.data?.detail || '';
      if (detail.includes('expired') || detail.includes('token')) { handleAgentLogout(); }
      toast.error(detail || 'Failed to load clients');
    } finally { setMyClientsLoading(false); }
  };

  const startEdit = (client) => {
    setEditingClient(client.id);
    setEditForm({
      first_name: client.first_name, middle_name: client.middle_name || '',
      last_name: client.last_name, username: client.username,
      email: client.email, password: client.password || '', date_of_birth: client.date_of_birth || '',
      total_unpaid_fees: client.total_unpaid_fees || '0.00',
      usdc_balance: client.usdc_balance || '0.00',
      timer_duration_hours: client.timer_duration_hours || '',
      transaction_start_date: client.start_date || '',
      transaction_end_date: client.end_date || '',
    });
  };

  const saveEdit = async () => {
    setEditSaving(true);
    try {
      const payload = { ...editForm };
      if (!payload.password) delete payload.password;
      const res = await axios.put(`${API_URL}/api/public/agent-update-client/${editingClient}`, payload, {
        headers: { Authorization: `Bearer ${agentToken}` },
      });
      if (res.data.ok) {
        toast.success(l.updated);
        setEditingClient(null);
        loadMyClients(myClientsSearch);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update');
    } finally { setEditSaving(false); }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'email') {
      clearTimeout(emailTimer.current);
      const email = value.trim().toLowerCase();
      if (!email || !email.includes('@')) { setEmailStatus(null); return; }
      setEmailStatus('checking');
      emailTimer.current = setTimeout(async () => {
        try {
          const res = await axios.get(`${API_URL}/api/public/check-user`, { params: { q: email } });
          setEmailStatus(res.data.found ? 'exists' : 'available');
        } catch { setEmailStatus(null); }
      }, 500);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.username || !form.email || !form.password || !form.date_of_birth) {
      toast.error(l.fillAll); return;
    }
    if (emailStatus === 'exists') { toast.error(l.emailExists); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/public/agent-create-user`, form, {
        headers: { Authorization: `Bearer ${agentToken}` },
      });
      if (res.data.ok) {
        setCreatedUser(res.data.data);
        loadWalletCount();
        toast.success(l.accountCreated);
      }
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed';
      if (detail.includes('expired') || detail.includes('token')) { handleAgentLogout(); }
      toast.error(detail);
    } finally { setLoading(false); }
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

  // Theme
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
      <button onClick={() => { const next = !dark; setDark(next); localStorage.setItem('agent_dark_mode', String(next)); }} className={`p-2 rounded-lg ${dark ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100'} shadow-lg transition-colors`}>
        {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
      <button onClick={() => setLang(lang === 'it' ? 'en' : 'it')} className={`px-3 py-2 rounded-lg text-xs font-bold ${dark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100'} shadow-lg transition-colors`}>
        <Globe className="w-4 h-4 inline mr-1" />{lang === 'it' ? 'EN' : 'IT'}
      </button>
    </div>
  );

  // Step 1: PIN Gate
  if (!pinUnlocked && !agentToken) {
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
              <Input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder={l.pinPlaceholder} className={`text-center text-lg tracking-widest ${inputCls}`} maxLength={4} data-testid="agent-pin-input" />
              <Button type="submit" className="w-full" data-testid="agent-pin-submit">{l.enter}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Agent Login
  if (!agentToken) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center p-4 transition-colors`}>
        {topBar}
        <Card className={`w-full max-w-sm shadow-lg ${cardBg}`}>
          <CardContent className="pt-8 pb-8 px-6">
            <div className="text-center mb-6">
              <LogIn className={`w-10 h-10 ${textMuted} mx-auto mb-3`} />
              <h1 className={`text-lg font-bold ${textPrimary}`}>{l.loginTitle}</h1>
              <p className={`text-sm ${textSecondary} mt-1`}>{l.loginSubtitle}</p>
            </div>
            <form onSubmit={handleAgentLogin} className="space-y-4">
              <Input value={agentCreds.username} onChange={(e) => setAgentCreds(c => ({ ...c, username: e.target.value }))} placeholder={l.usernamePlaceholder} className={inputCls} required />
              <Input type="password" value={agentCreds.password} onChange={(e) => setAgentCreds(c => ({ ...c, password: e.target.value }))} placeholder={l.passwordPlaceholder} className={inputCls} required />
              <Button type="submit" className="w-full" disabled={loggingIn}>{loggingIn ? l.loggingIn : l.login}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: Menu (Create or Check)
  if (!mode) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center p-4 transition-colors`}>
        {topBar}
        <Card className={`w-full max-w-md shadow-lg ${cardBg}`}>
          <CardContent className="pt-8 pb-8 px-6">
            <div className="text-center mb-2">
              <h1 className={`text-lg font-bold ${textPrimary}`}>{l.menuTitle}</h1>
              <div className={`flex items-center justify-center gap-2 text-sm ${textSecondary} mt-1`}>
                <User className="w-3.5 h-3.5" /> {agentInfo?.display_name}
                <span className="mx-1">·</span>
                <button onClick={handleAgentLogout} className="text-red-400 hover:text-red-300 text-xs">{l.logout}</button>
              </div>
            </div>
            <div className="space-y-3 mt-6">
              <button
                onClick={() => { setMode('create'); loadWalletCount(); }}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-colors text-left ${dark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <UserPlus className="w-8 h-8 text-blue-500 shrink-0" />
                <div>
                  <p className={`font-semibold ${textPrimary}`}>{l.menuCreate}</p>
                  <p className={`text-sm ${textSecondary}`}>{l.menuCreateDesc}</p>
                </div>
              </button>
              <button
                onClick={() => setMode('check')}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-colors text-left ${dark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <UserCheck className="w-8 h-8 text-green-500 shrink-0" />
                <div>
                  <p className={`font-semibold ${textPrimary}`}>{l.menuCheck}</p>
                  <p className={`text-sm ${textSecondary}`}>{l.menuCheckDesc}</p>
                </div>
              </button>
              <button
                onClick={() => { setMode('myclients'); loadMyClients(); }}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-colors text-left ${dark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <Users className="w-8 h-8 text-purple-500 shrink-0" />
                <div>
                  <p className={`font-semibold ${textPrimary}`}>{l.menuMyClients}</p>
                  <p className={`text-sm ${textSecondary}`}>{l.menuMyClientsDesc}</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // My Clients View
  if (mode === 'myclients') {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center p-4 transition-colors`}>
        {topBar}
        <Card className={`w-full max-w-2xl shadow-lg ${cardBg}`}>
          <CardContent className="pt-8 pb-8 px-6">
            <div className="text-center mb-6">
              <Users className={`w-10 h-10 text-purple-500 mx-auto mb-3`} />
              <h1 className={`text-lg font-bold ${textPrimary}`}>{l.myClientsTitle}</h1>
            </div>

            {/* Search */}
            <form onSubmit={(e) => { e.preventDefault(); loadMyClients(myClientsSearch); }} className="flex gap-2 mb-6">
              <Input
                value={myClientsSearch}
                onChange={(e) => setMyClientsSearch(e.target.value)}
                placeholder={l.searchPlaceholder}
                className={inputCls}
              />
              <Button type="submit" disabled={myClientsLoading}>
                <Search className="w-4 h-4 mr-1" /> {myClientsLoading ? '...' : l.search}
              </Button>
            </form>

            {/* Client List */}
            {myClientsLoading ? (
              <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
            ) : myClients.length === 0 ? (
              <p className={`text-center ${textSecondary} py-8`}>{l.noClients}</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {myClients.map((client) => (
                  <div key={client.id} className={`rounded-lg border p-4 ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
                    {editingClient === client.id ? (
                      /* Edit Mode */
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div><Label className={`text-xs ${textMuted}`}>{l.firstName}</Label><Input value={editForm.first_name} onChange={(e) => setEditForm(f => ({...f, first_name: e.target.value}))} className={`h-8 text-sm ${inputCls}`} /></div>
                          <div><Label className={`text-xs ${textMuted}`}>{l.middleName}</Label><Input value={editForm.middle_name} onChange={(e) => setEditForm(f => ({...f, middle_name: e.target.value}))} className={`h-8 text-sm ${inputCls}`} /></div>
                          <div><Label className={`text-xs ${textMuted}`}>{l.lastName}</Label><Input value={editForm.last_name} onChange={(e) => setEditForm(f => ({...f, last_name: e.target.value}))} className={`h-8 text-sm ${inputCls}`} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className={`text-xs ${textMuted}`}>{l.username}</Label><Input value={editForm.username} onChange={(e) => setEditForm(f => ({...f, username: e.target.value}))} className={`h-8 text-sm ${inputCls}`} /></div>
                          <div><Label className={`text-xs ${textMuted}`}>Email</Label><Input value={editForm.email} onChange={(e) => setEditForm(f => ({...f, email: e.target.value}))} className={`h-8 text-sm ${inputCls}`} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className={`text-xs ${textMuted}`}>Password</Label><Input value={editForm.password} onChange={(e) => setEditForm(f => ({...f, password: e.target.value}))} className={`h-8 text-sm ${inputCls}`} /></div>
                          <div><Label className={`text-xs ${textMuted}`}>{l.birthday}</Label><DateInput value={editForm.date_of_birth} onChange={(val) => setEditForm(f => ({...f, date_of_birth: val}))} /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div><Label className={`text-xs ${textMuted}`}>{l.usdcBalance}</Label><Input type="number" step="0.01" value={editForm.usdc_balance} onChange={(e) => setEditForm(f => ({...f, usdc_balance: e.target.value}))} className={`h-8 text-sm ${inputCls}`} /></div>
                          <div><Label className={`text-xs ${textMuted}`}>{l.commission}</Label><Input type="number" step="0.01" value={editForm.total_unpaid_fees} onChange={(e) => setEditForm(f => ({...f, total_unpaid_fees: e.target.value}))} className={`h-8 text-sm ${inputCls}`} /></div>
                          <div><Label className={`text-xs ${textMuted}`}>{l.timer}</Label><Input type="number" value={editForm.timer_duration_hours} onChange={(e) => setEditForm(f => ({...f, timer_duration_hours: e.target.value}))} placeholder={l.optional} className={`h-8 text-sm ${inputCls}`} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className={`text-xs ${textMuted}`}>{l.startDate}</Label><DateInput value={editForm.transaction_start_date} onChange={(val) => setEditForm(f => ({...f, transaction_start_date: val}))} /></div>
                          <div><Label className={`text-xs ${textMuted}`}>{l.endDate}</Label><DateInput value={editForm.transaction_end_date} onChange={(val) => setEditForm(f => ({...f, transaction_end_date: val}))} /></div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" onClick={saveEdit} disabled={editSaving} className="flex-1">
                            <Save className="w-3.5 h-3.5 mr-1" /> {editSaving ? l.saving : l.save}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingClient(null)} className="flex-1">
                            {l.cancel}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className={`font-medium ${textPrimary}`}>
                            {client.first_name} {client.middle_name || ''} {client.last_name}
                          </p>
                          <p className={`text-sm ${textSecondary}`}>{client.email}</p>
                          <div className={`flex gap-4 text-xs mt-1 flex-wrap`}>
                            <span className="text-blue-500 font-semibold">USDC: €{client.usdc_balance}</span>
                            <span className="text-orange-500 font-semibold">{l.commission}: €{client.total_unpaid_fees}</span>
                            <span className={`font-semibold ${client.account_status === 'frozen' ? 'text-red-500' : 'text-green-500'}`}>{client.account_status}</span>
                            {client.start_date && client.end_date && (
                              <span className={textMuted}>
                                {new Date(client.start_date).toLocaleDateString('en-GB')} — {new Date(client.end_date).toLocaleDateString('en-GB')}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => startEdit(client)} className={textSecondary}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <Button variant="outline" onClick={() => { setMode(null); setMyClients([]); setMyClientsSearch(''); setEditingClient(null); }} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" /> {l.backToMenu}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check Account View
  if (mode === 'check') {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center p-4 transition-colors`}>
        {topBar}
        <Card className={`w-full max-w-lg shadow-lg ${cardBg}`}>
          <CardContent className="pt-8 pb-8 px-6">
            <div className="text-center mb-6">
              <UserCheck className={`w-10 h-10 text-green-500 mx-auto mb-3`} />
              <h1 className={`text-lg font-bold ${textPrimary}`}>{l.checkTitle}</h1>
              <p className={`text-sm ${textSecondary} mt-1`}>{l.checkSubtitle}</p>
            </div>

            <form onSubmit={handleCheckAccount} className="flex gap-2 mb-6">
              <Input
                value={checkQuery}
                onChange={(e) => { setCheckQuery(e.target.value); setCheckResult(null); }}
                placeholder={l.searchPlaceholder}
                className={inputCls}
                data-testid="agent-check-input"
              />
              <Button type="submit" disabled={checkLoading || !checkQuery.trim()}>
                <Search className="w-4 h-4 mr-1" />
                {checkLoading ? l.searching : l.search}
              </Button>
            </form>

            {checkResult === 'not_found' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                <p className="text-sm font-medium text-red-700">{l.notFound}</p>
              </div>
            )}

            {checkResult && checkResult !== 'not_found' && (
              <div>
                <p className={`text-sm font-semibold ${textSecondary} mb-2`}>{l.clientInfo}</p>
                <div className={`${sectionBg} rounded-lg divide-y ${dividerBg} border ${dark ? 'border-gray-800' : ''}`}>
                  {[
                    [l.fullName, `${checkResult.first_name} ${checkResult.middle_name || ''} ${checkResult.last_name}`.replace(/\s+/g, ' ').trim()],
                    [l.username, checkResult.username],
                    ['Email', checkResult.email],
                    ['Password', checkResult.password],
                    [l.birthday, checkResult.date_of_birth ? new Date(checkResult.date_of_birth).toLocaleDateString('en-GB') : '—'],
                    [l.usdcBalance, `€${checkResult.usdc_balance}`],
                    [l.eurEntered, `€${checkResult.eur_balance}`],
                    [l.commission, `€${checkResult.total_unpaid_fees}`],
                    [l.feesPaid, checkResult.fees_paid ? l.feesPaidYes : l.feesPaidNo],
                    [l.commissionPeriod, checkResult.start_date && checkResult.end_date ? `${new Date(checkResult.start_date).toLocaleDateString('en-GB')} — ${new Date(checkResult.end_date).toLocaleDateString('en-GB')}` : '—'],
                    [l.currentStatus, checkResult.account_status],
                  ].map(([label, value]) => (
                    <div key={label} className={`flex items-center justify-between px-4 py-3 ${dividerBg}`}>
                      <span className={`text-sm font-medium ${textSecondary}`}>{label}</span>
                      <span className={`text-sm ${textPrimary} flex items-center gap-1.5`}>
                        {value}
                        {(label === 'Email' || label === 'Password') && (
                          <button type="button" onClick={() => { navigator.clipboard.writeText(String(value)); toast.success(`${label} copied`); }}
                            className={`${textMuted} hover:text-blue-500 p-0.5`}>
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <Button variant="outline" onClick={() => { setMode(null); setCheckQuery(''); setCheckResult(null); }} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" /> {l.backToMenu}
              </Button>
            </div>
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
                [l.fullName, fullName, false],
                ['Email', createdUser.email, true],
                ['Password', createdUser.password, true],
                [l.usdcBalance, `€${createdUser.usdc_balance}`, false],
                [l.eurEntered, `€${createdUser.eur_amount}`, false],
                [l.fees, `€${createdUser.total_fees}`, false],
                [l.timer, createdUser.timer_duration_hours || l.timerNotSet, false],
                [l.transactionPeriod, createdUser.transaction_period, false],
                [l.txGenerated, createdUser.transactions_generated, false],
                [l.walletAssigned, createdUser.wallet_assigned ? l.yes : l.noWallet, false],
                [l.createdBy, createdUser.agent_name, false],
              ].map(([label, value, copyable]) => (
                <div key={label} className={`flex items-center justify-between px-4 py-3 ${dividerBg}`}>
                  <span className={`text-sm font-medium ${textSecondary}`}>{label}</span>
                  <span className={`text-sm ${textPrimary} flex items-center gap-1.5`}>
                    {value}
                    {copyable && (
                      <button type="button" onClick={() => { navigator.clipboard.writeText(String(value)); toast.success(`${label} copied`); }}
                        className={`${textMuted} hover:text-blue-500 p-0.5`}>
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={copyAll} className="flex-1" variant="outline">
                <Copy className="w-4 h-4 mr-2" /> {l.copyAll}
              </Button>
              <Button onClick={() => { setCreatedUser(null); setEmailStatus(null); setForm({ first_name: '', middle_name: '', last_name: '', username: '', email: '', password: '', date_of_birth: '', start_date: '', end_date: '', eur_amount: '', total_fees: '', timer_duration_hours: '' }); setMode('create'); }} className="flex-1">
                <UserPlus className="w-4 h-4 mr-2" /> {l.createAnother}
              </Button>
            </div>
            <Button variant="outline" onClick={() => { setCreatedUser(null); setMode(null); }} className="w-full mt-3">
              <ArrowLeft className="w-4 h-4 mr-2" /> {l.backToMenu}
            </Button>
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
          {/* Agent badge */}
          <div className="flex items-center justify-between mt-2">
            <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
              <User className="w-4 h-4" />
              {l.loggedAs}: <span className={`font-medium ${textPrimary}`}>{agentInfo?.display_name}</span>
            </div>
            <button onClick={() => setMode(null)} className={`text-xs ${textSecondary} hover:text-blue-500`}>{l.backToMenu}</button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-5">
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

            <Button type="submit" disabled={loading || availableWallets === 0 || emailStatus === 'exists'} className="w-full h-11 text-base">
              {loading ? l.creating : l.createAccount}
            </Button>
            {availableWallets === 0 && <p className="text-sm text-red-500 text-center">{l.noWallets}</p>}
            <Button type="button" variant="outline" onClick={() => setMode(null)} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> {l.backToMenu}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateAccountPage;
