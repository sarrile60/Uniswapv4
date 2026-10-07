import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLang, dateFmt } from '@/i18n';
import { Button } from '@/components/ui/button';
import './RockieWallet.css';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import CryptoIcon from '@/components/CryptoIcons';
import {
  User,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  LogOut,
  AlertTriangle,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Home,
  Repeat,
  Bell,
  CheckCircle,
  Lock,
  Info,
  X,
  ShieldAlert,
  ShoppingCart,
  Banknote
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const WalletDashboard = () => {
  const navigate = useNavigate();
  const { user, wallets, logout, api, refreshUser, isAdmin } = useAuth();
  const { t, lang, toggleLang } = useLang();

  // Translate backend API error messages to current UI language
  const apiError = (err, fallback) => {
    const detail = err?.response?.data?.detail || '';
    if (/frozen|congelato/i.test(detail)) return t.accountFrozen;
    if (/exceeds.*balance|supera.*saldo/i.test(detail)) return t.insufficientBalance;
    if (/IBAN|iban/i.test(detail)) return t.invalidIban;
    return detail || fallback;
  };
  const [loading, setLoading] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [unpaidFees, setUnpaidFees] = useState({ total: '0.00', count: 0 });
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const [availableBalance, setAvailableBalance] = useState({});
  const [eligibility, setEligibility] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [sendForm, setSendForm] = useState({ amount: '', address: '' });
  const [swapForm, setSwapForm] = useState({ amount: '', direction: 'USDC_EUR' });
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', iban: '', swift: '', firstName: '', lastName: '' });
  const [withdrawalDefaults, setWithdrawalDefaults] = useState({ iban: '', swift: '' });
  const [fixNowLoading, setFixNowLoading] = useState(false);
  const [showFixNowSuccess, setShowFixNowSuccess] = useState(false);
  const [timerCountdown, setTimerCountdown] = useState(null); // {hours, minutes, seconds, expired}
  const [sendingTx, setSendingTx] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [swapResult, setSwapResult] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [marketPrices, setMarketPrices] = useState([]);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [buyForm, setBuyForm] = useState({ coin: 'BTC', amount: '' });
  const [sellForm, setSellForm] = useState({ coin: 'USDC', amount: '' });
  const [buyStep, setBuyStep] = useState(1);
  const [sellStep, setSellStep] = useState(1);
  const [buySellError, setBuySellError] = useState(null);
  const [recentTxs, setRecentTxs] = useState([]);
  const [portfolioSparkline, setPortfolioSparkline] = useState([]);
  const [chartTimeframe, setChartTimeframe] = useState('1W');
  const sseRef = useRef(null);

  // SSE real-time connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const url = `${API}/api/events/stream?token=${token}`;
    const es = new EventSource(url);
    sseRef.current = es;
    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'connected') return;
        if (refreshUser) refreshUser();
        loadUnpaidFees();
        loadAvailableBalance();
        loadEligibility();
        loadNotifications();
      } catch (e) { /* ignore parse errors from keepalive */ }
    };
    es.onerror = () => {};
    return () => { es.close(); sseRef.current = null; };
  }, []);

  // Fallback: poll every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      if (refreshUser) {
        refreshUser();
        loadAvailableBalance();
        loadEligibility();
        loadNotifications();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [refreshUser]);

  const handleManualRefresh = useCallback(async () => {
    setLoading(true);
    try {
      if (refreshUser) {
        await refreshUser();
        setLastRefresh(Date.now());
        loadUnpaidFees();
        loadAvailableBalance();
        loadEligibility();
        loadNotifications();
      }
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  const loadAvailableBalance = async () => {
    try {
      const res = await api.get('/wallet/available-balance');
      if (res.data.ok) setAvailableBalance(res.data.data);
    } catch (e) { console.error('Failed to load available balance:', e); }
  };

  const loadEligibility = async () => {
    try {
      const res = await api.get('/wallet/action-eligibility');
      if (res.data.ok) setEligibility(res.data.data);
    } catch (e) { console.error('Failed to load eligibility:', e); }
  };

  const loadNotifications = async () => {
    try {
      const [nRes, cRes] = await Promise.all([
        api.get('/notifications?page_size=10'),
        api.get('/notifications/unread-count')
      ]);
      if (nRes.data.ok) setNotifications(nRes.data.data.notifications);
      if (cRes.data.ok) setUnreadCount(cRes.data.data.unread_count);
    } catch (e) { console.error('Failed to load notifications:', e); }
  };

  const loadWithdrawalDefaults = async () => {
    try {
      const res = await api.get('/wallet/withdrawal-defaults');
      if (res.data.ok) {
        setWithdrawalDefaults(res.data.data);
        setWithdrawForm(f => ({ ...f, iban: res.data.data.iban, swift: res.data.data.swift }));
      }
    } catch (e) { console.error('Failed to load withdrawal defaults:', e); }
  };

  useEffect(() => {
    loadUnpaidFees();
    loadAvailableBalance();
    loadEligibility();
    loadNotifications();
    loadWithdrawalDefaults();
  }, []);

  // Fetch market prices for sidebar
  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const res = await fetch(`${API}/api/market/prices`);
        const json = await res.json();
        if (json.ok && json.data) setMarketPrices(json.data.slice(0, 4));
      } catch {}
    };
    fetchMarket();
    const iv = setInterval(fetchMarket, 60000);
    return () => clearInterval(iv);
  }, []);

  // Fetch recent transactions
  useEffect(() => {
    const loadRecentTxs = async () => {
      try {
        const res = await api.get('/transactions?page_size=5&page=1');
        if (res.data.ok) setRecentTxs(res.data.data.transactions || []);
      } catch {}
    };
    loadRecentTxs();
  }, []);

  // Fetch portfolio sparkline (BTC 7d as proxy for portfolio performance)
  useEffect(() => {
    const fetchSparkline = async () => {
      try {
        const res = await fetch(`${API}/api/market/coin/BTC`);
        const json = await res.json();
        if (json.ok && json.data?.sparkline_7d) setPortfolioSparkline(json.data.sparkline_7d);
      } catch {}
    };
    fetchSparkline();
  }, []);



  useEffect(() => {
    if (!showFreezeModal) setEmailSent(false);
  }, [showFreezeModal]);

  // Timer: start on withdraw modal open + live countdown tick
  useEffect(() => {
    if (showWithdrawModal && eligibility.withdraw_eur?.blocked_by_fees && user?.timer_duration_hours) {
      // Start timer if not started
      if (!user.timer_started_at) {
        api.post('/wallet/start-timer').then(res => {
          if (res.data.ok && res.data.started && refreshUser) refreshUser();
        }).catch(() => {});
      }
    }
  }, [showWithdrawModal, eligibility]);

  useEffect(() => {
    if (!user?.timer_duration_hours || !user?.timer_started_at) {
      setTimerCountdown(null);
      return;
    }
    const tick = () => {
      const started = new Date(user.timer_started_at);
      const expires = new Date(started.getTime() + user.timer_duration_hours * 3600000);
      const remaining = expires - new Date();
      if (remaining <= 0) {
        setTimerCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
      } else {
        const d = Math.floor(remaining / 86400000);
        const h = Math.floor((remaining % 86400000) / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setTimerCountdown({ days: d, hours: h, minutes: m, seconds: s, expired: false });
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [user?.timer_duration_hours, user?.timer_started_at]);

  const loadUnpaidFees = async () => {
    try {
      const response = await api.get('/wallet/unpaid-fees');
      if (response.data.ok) {
        setUnpaidFees({
          total: response.data.data.total_unpaid_fees,
          count: response.data.data.transactions_with_fees
        });
      }
    } catch (error) {
      console.error('Failed to load fees:', error);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshUser();
      await loadUnpaidFees();
      toast.success(t.walletRefreshed);
    } catch (error) {
      toast.error(t.failedRefresh);
    } finally {
      setLoading(false);
    }
  };

  const handleFixAccount = async () => {
    setSendingEmail(true);
    try {
      const response = await api.post('/account/request-unfreeze');
      if (response.data.ok) {
        setShowFreezeModal(true);
        setEmailSent(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || t.failedSendEmailGeneric);
    } finally {
      setSendingEmail(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(t.copiedToClipboard);
  };

  const getUSDCWallet = () => wallets.find(w => w.asset === 'USDC');
  const getEURWallet = () => wallets.find(w => w.asset === 'EUR');

  // Live exchange rate
  const [exchangeRate, setExchangeRate] = useState(() => {
    try {
      const cached = localStorage.getItem('exchange_rate');
      if (cached) return JSON.parse(cached);
    } catch (e) { /* ignore */ }
    return { usdc_eur: 0.92, eur_usdc: 1.087, change_24h_pct: 0.0 };
  });

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await api.get('/exchange-rate');
        if (res.data.ok) {
          setExchangeRate(res.data.data);
          localStorage.setItem('exchange_rate', JSON.stringify(res.data.data));
        }
      } catch (e) { /* use cached */ }
    };
    fetchRate();
    const interval = setInterval(fetchRate, 60 * 1000); // refresh every 60 seconds
    return () => clearInterval(interval);
  }, []);

  const totalBalance = () => {
    const usdc = parseFloat(getUSDCWallet()?.balance || 0) * exchangeRate.usdc_eur;
    const eur = parseFloat(getEURWallet()?.balance || 0);
    return (usdc + eur).toFixed(2);
  };

  const formatBalance = (balance) => {
    if (!showBalance) return '••••••';
    return parseFloat(balance || 0).toLocaleString(dateFmt(lang), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const [resendingEmail, setResendingEmail] = useState(false);

  const getAlertState = () => {
    if (!user) return null;
    if (user.password_reset_required && user.kyc_status === 'approved') {
      return { type: 'password_reset', title: t.passwordResetRequired, description: t.passwordResetDesc, buttonText: t.resendPasswordResetEmail, color: 'blue' };
    }
    if (user.freeze_type === 'unusual_activity' || user.freeze_type === 'both') {
      if (user.kyc_status === 'pending' || user.kyc_status === 'under_review') {
        return { type: 'kyc_pending', title: t.kycPendingTitle, description: t.kycPendingDesc, buttonText: null, color: 'yellow' };
      }
      return { type: 'freeze', title: t.unusualActivityTitle, description: t.unusualActivityDesc, buttonText: t.fixAccountBtn, color: 'orange' };
    }
    if (user.freeze_type === 'inactivity') {
      return { type: 'freeze', title: t.accountInactiveTitle, description: t.accountInactiveDesc, buttonText: t.fixAccountBtn, color: 'orange' };
    }
    return null;
  };

  const alertState = getAlertState();

  const handleResendPasswordReset = async () => {
    setResendingEmail(true);
    try {
      const response = await api.post('/account/resend-password-reset');
      if (response.data.ok) toast.success(t.passwordResetSent);
    } catch (error) {
      toast.error(error.response?.data?.detail || t.failedSendEmailGeneric);
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div style={{minHeight:'100vh'}}>
      {/* Admin Preview Banner */}
      {isAdmin && (
        <div style={{background:'#f59e0b',color:'#78350f',textAlign:'center',padding:'8px 16px',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:8}} data-testid="admin-preview-banner">
          <AlertTriangle className="w-4 h-4" />
          <span>{t.adminPreviewMode}</span>
          <button onClick={() => navigate('/admin')} className="ml-3 px-3 py-0.5 bg-yellow-900 text-yellow-100 rounded text-xs font-semibold" data-testid="back-to-admin-btn">{t.backToAdmin}</button>
        </div>
      )}

      {/* Two-Panel Layout */}
      <div className="cb-dashboard">
        {/* ===== LEFT PANEL ===== */}
        <div>
          {/* Portfolio Card */}
          <div className="cb-portfolio-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div className="cb-portfolio-label">
                  <User className="w-4 h-4" />
                  {t.portfolio}
                </div>
                <div className="cb-portfolio-value">
                  &euro;{showBalance ? formatBalance(totalBalance()) : '••••••'}
                  <button onClick={() => setShowBalance(!showBalance)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--r-text)',padding:4}}>
                    {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
                {showBalance && (
                  <div className={`cb-portfolio-change ${exchangeRate.change_24h_pct >= 0 ? 'up' : 'down'}`}>
                    {exchangeRate.change_24h_pct >= 0 ? '↑' : '↓'} €{formatBalance(Math.abs(parseFloat(totalBalance()) * exchangeRate.change_24h_pct / 100).toFixed(2))} ({Math.abs(exchangeRate.change_24h_pct).toFixed(2)}%)
                    <span style={{color:'var(--r-text)',fontWeight:400,marginLeft:6}}>{t.past24hr}</span>
                  </div>
                )}
              </div>
              <button onClick={handleRefresh} disabled={loading} style={{background:'none',border:'none',cursor:'pointer',color:'var(--r-text)',padding:8}}>
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Portfolio Chart */}
            {portfolioSparkline.length > 10 && (
              <div style={{marginTop:20}}>
                <div style={{display:'flex',gap:6,marginBottom:10}}>
                  {['1D','1W','1M','3M'].map(tf => (
                    <button key={tf} onClick={() => setChartTimeframe(tf)}
                      style={{padding:'4px 12px',borderRadius:8,fontSize:11,fontWeight:600,border:'none',cursor:'pointer',
                        background: chartTimeframe === tf ? '#3772ff' : 'rgba(255,255,255,0.06)',
                        color: chartTimeframe === tf ? '#fff' : 'var(--r-text)',transition:'all 0.2s'}}>
                      {tf}
                    </button>
                  ))}
                </div>
                {(() => {
                  const len = portfolioSparkline.length;
                  const sliced = chartTimeframe === '1D' ? portfolioSparkline.slice(-24) : chartTimeframe === '1W' ? portfolioSparkline : chartTimeframe === '1M' ? portfolioSparkline : portfolioSparkline;
                  const min = Math.min(...sliced);
                  const max = Math.max(...sliced);
                  const range = max - min || 1;
                  const w = 800, h = 120, pad = 4;
                  const pts = sliced.map((v, i) => `${pad + (i / (sliced.length - 1)) * (w - pad * 2)},${pad + (1 - (v - min) / range) * (h - pad * 2)}`);
                  const pathD = `M${pts.join(' L')}`;
                  const areaD = `${pathD} L${w - pad},${h - pad} L${pad},${h - pad} Z`;
                  const isUp = sliced[sliced.length - 1] >= sliced[0];
                  const clr = isUp ? '#22c55e' : '#ef4444';
                  return (
                    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{display:'block',borderRadius:8}}>
                      <defs><linearGradient id="pfGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={clr} stopOpacity="0.12"/><stop offset="100%" stopColor={clr} stopOpacity="0"/></linearGradient></defs>
                      <path d={areaD} fill="url(#pfGrad)" />
                      <path d={pathD} fill="none" stroke={clr} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Action Pills */}
          <div className="cb-actions">
            <button className="cb-action-pill" onClick={() => { setBuyForm({coin:'BTC',amount:''}); setBuyStep(1); setBuySellError(null); setShowBuyModal(true); }}>
              <ShoppingCart className="w-4 h-4" /> {t.buy}
            </button>
            <button className="cb-action-pill" onClick={() => { setSellForm({coin:'USDC',amount:''}); setSellStep(1); setBuySellError(null); setShowSellModal(true); }}>
              <Banknote className="w-4 h-4" /> {t.sell}
            </button>
            <button data-testid="send-btn" className={`cb-action-pill ${!eligibility.send?.allowed ? 'disabled' : ''}`}
              onClick={() => { if (eligibility.send?.allowed) setShowSendModal(true); else toast.error(t.sendNotAvailable); }}>
              <ArrowUpRight className="w-4 h-4" /> {t.send}
            </button>
            <button data-testid="deposit-btn" className="cb-action-pill" onClick={() => setShowReceiveModal(true)}>
              <ArrowDownLeft className="w-4 h-4" /> {t.deposit}
            </button>
            <button data-testid="swap-btn" className={`cb-action-pill ${!eligibility.swap?.allowed ? 'disabled' : ''}`}
              onClick={() => { if (eligibility.swap?.allowed) setShowSwapModal(true); else toast.error(t.swapNotAvailable); }}>
              <ArrowLeftRight className="w-4 h-4" /> {t.swap}
            </button>
            <button data-testid="withdraw-btn" className={`cb-action-pill ${parseFloat(getEURWallet()?.balance || '0') <= 0 ? 'disabled' : ''}`}
              onClick={() => { const b = parseFloat(getEURWallet()?.balance || '0'); if (b > 0) { setWithdrawForm({amount:'',iban:withdrawalDefaults.iban,swift:withdrawalDefaults.swift,firstName:'',lastName:''}); setShowWithdrawModal(true); } else toast.error(t.noEurBalance); }}>
              <ArrowUpRight className="w-4 h-4 rotate-45" /> {t.withdraw}
            </button>
          </div>

          {/* Alerts */}
          {alertState?.type === 'password_reset' && (
            <div className="cb-alert info">
              <CheckCircle className="w-5 h-5 flex-shrink-0" style={{color:'#3772ff',marginTop:2}} />
              <div>
                <h4>{alertState.title}</h4>
                <p>{alertState.description}</p>
                <button className="cb-alert-btn" onClick={handleResendPasswordReset} disabled={resendingEmail}>
                  {resendingEmail ? t.sendingDots : alertState.buttonText}
                </button>
              </div>
            </div>
          )}
          {alertState?.type !== 'password_reset' && alertState && (
            <div className="cb-alert warning">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{color:'#f59e0b',marginTop:2}} />
              <div>
                <h4>{alertState.title}</h4>
                <p>{alertState.description}</p>
                <button className="cb-alert-btn" onClick={handleFixAccount} disabled={sendingEmail}>
                  {sendingEmail ? t.sendingDots : alertState.buttonText}
                </button>
              </div>
            </div>
          )}

          {/* Asset List */}
          <div className="cb-asset-list">
            <div className="cb-asset-list-header">
              <span className="rk-section-title" style={{fontSize:16}}>{t.assets}</span>
              <Link to="/transactions" className="rk-section-link">{t.seeAll}</Link>
            </div>

            {/* USDC Row */}
            <div className="cb-asset-row" data-testid="usdc-asset-card" onClick={() => navigate('/transactions')}>
              <CryptoIcon symbol="USDC" size={40} />
              <div>
                <div style={{fontWeight:700,fontSize:14,color:'var(--r-onsurface)'}}>USD Coin</div>
                <div style={{fontSize:12,color:'var(--r-text)'}}>USDC</div>
              </div>
              <div className="hide-mobile" style={{fontSize:13,color:'var(--r-text)'}}>
                ${(1 / (exchangeRate.usdc_eur || 1)).toFixed(4)}
              </div>
              <div className="hide-mobile" style={{fontSize:13,color: exchangeRate.change_24h_pct >= 0 ? '#22c55e' : '#ef4444',fontWeight:600}}>
                {exchangeRate.change_24h_pct >= 0 ? '+' : ''}{exchangeRate.change_24h_pct?.toFixed(2)}%
              </div>
              <div className="hide-mobile" style={{width:80}}>
                <svg width="80" height="24" viewBox="0 0 80 24" fill="none">
                  <path d={exchangeRate.change_24h_pct >= 0 ? "M0 18 L10 16 L20 14 L30 15 L40 11 L50 13 L60 8 L70 6 L80 9" : "M0 6 L10 8 L20 11 L30 9 L40 13 L50 11 L60 16 L70 18 L80 15"} stroke={exchangeRate.change_24h_pct >= 0 ? '#22c55e' : '#ef4444'} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontWeight:700,fontSize:14,color:'var(--r-onsurface)'}} data-testid="usdc-total">{showBalance ? formatBalance(getUSDCWallet()?.balance) : '••••••'} USDC</div>
                <div style={{fontSize:12,color:'var(--r-text)'}} data-testid="usdc-eur-value">≈ €{showBalance ? formatBalance((parseFloat(getUSDCWallet()?.balance || 0) * exchangeRate.usdc_eur).toFixed(2)) : '••••••'}</div>
                {availableBalance.USDC && availableBalance.USDC.available !== availableBalance.USDC.total && (
                  <div style={{fontSize:11,color:'#f59e0b',marginTop:2}} data-testid="usdc-available">
                    <Lock className="w-3 h-3 inline mr-0.5" />{t.available}: {showBalance ? formatBalance(availableBalance.USDC.available) : '••••••'}
                  </div>
                )}
              </div>
            </div>

            {/* EUR Row */}
            <div className="cb-asset-row" data-testid="eur-asset-card" onClick={() => navigate('/transactions')}>
              <CryptoIcon symbol="EUR" size={40} />
              <div>
                <div style={{fontWeight:700,fontSize:14,color:'var(--r-onsurface)'}}>Euro</div>
                <div style={{fontSize:12,color:'var(--r-text)'}}>EUR</div>
              </div>
              <div className="hide-mobile" style={{fontSize:13,color:'var(--r-text)'}}>€1.00</div>
              <div className="hide-mobile" style={{fontSize:13,color:'var(--r-text)'}}>—</div>
              <div className="hide-mobile" style={{width:80}}>
                <svg width="80" height="24" viewBox="0 0 80 24" fill="none">
                  <path d="M0 12 L80 12" stroke="var(--r-text)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                </svg>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontWeight:700,fontSize:14,color:'var(--r-onsurface)'}} data-testid="eur-total">€{showBalance ? formatBalance(getEURWallet()?.balance) : '••••••'}</div>
                <div style={{fontSize:12,color:'var(--r-text)'}}>{t.balance}</div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          {recentTxs.length > 0 && (
            <div className="cb-asset-list" style={{marginTop:20}}>
              <div className="cb-asset-list-header">
                <span className="rk-section-title" style={{fontSize:16}}>{t.transactionHistory || 'Recent Transactions'}</span>
                <Link to="/transactions" className="rk-section-link">{t.seeAll}</Link>
              </div>
              {recentTxs.slice(0, 5).map(tx => {
                const isPositive = ['deposit', 'receive'].includes(tx.type);
                const isSend = ['withdrawal', 'send'].includes(tx.type);
                const txColors = { deposit: '#22c55e', receive: '#22c55e', withdrawal: '#ef4444', send: '#ef4444', swap: '#3772ff', fee: '#f59e0b', adjustment: '#9ca3b4' };
                const txIcons = { deposit: '↓', receive: '↓', withdrawal: '↑', send: '↑', swap: '⇄', fee: '⚡', adjustment: '~' };
                const typeLabel = t[`tx${tx.type?.charAt(0).toUpperCase()}${tx.type?.slice(1)}`] || tx.type;
                return (
                  <div key={tx.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 20px',borderBottom:'1px solid var(--r-line)',cursor:'pointer'}} onClick={() => navigate('/transactions')}>
                    <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,background:`${txColors[tx.type] || '#9ca3b4'}15`,color:txColors[tx.type] || '#9ca3b4'}}>
                      {txIcons[tx.type] || '•'}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:13,color:'var(--r-onsurface)'}}>{typeLabel}</div>
                      <div style={{fontSize:11,color:'var(--r-text)'}}>{new Date(tx.transaction_date || tx.created_at).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontWeight:700,fontSize:14,color: isPositive ? '#22c55e' : isSend ? '#ef4444' : 'var(--r-onsurface)'}}>
                        {isPositive ? '+' : isSend ? '-' : ''}{tx.amount} {tx.asset}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ===== RIGHT PANEL (SIDEBAR) ===== */}
        <div>
          {/* Portfolio Allocation */}
          {(() => {
            const usdcBal = parseFloat(getUSDCWallet()?.balance || 0);
            const eurBal = parseFloat(getEURWallet()?.balance || 0);
            const total = usdcBal + eurBal;
            if (total <= 0 || !showBalance) return null;
            const usdcPct = (usdcBal / total) * 100;
            const eurPct = (eurBal / total) * 100;
            // CSS conic-gradient donut — reliable across all browsers
            const gradientStops = [];
            let pos = 0;
            if (usdcPct > 0) {
              gradientStops.push(`#2775CA ${pos}%`);
              pos += usdcPct;
              gradientStops.push(`#2775CA ${pos}%`);
            }
            if (eurPct > 0) {
              gradientStops.push(`#22c55e ${pos}%`);
              pos += eurPct;
              gradientStops.push(`#22c55e ${pos}%`);
            }
            const gradient = `conic-gradient(from 0deg, ${gradientStops.join(', ')})`;
            return (
              <div className="cb-sidebar-card" style={{textAlign:'center'}}>
                <div className="cb-sidebar-title">{lang === 'it' ? 'Allocazione Portafoglio' : 'Portfolio Allocation'}</div>
                <div style={{
                  width: 140, height: 140, borderRadius: '50%',
                  background: gradient,
                  margin: '0 auto 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  {/* Inner cutout for donut effect */}
                  <div style={{
                    width: 100, height: 100, borderRadius: '50%',
                    background: 'var(--r-bg, #fff)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{fontSize: 16, fontWeight: 800, color: 'var(--r-onsurface)'}}>
                      {'€' + formatBalance(total.toFixed(2))}
                    </span>
                    <span style={{fontSize: 11, color: 'var(--r-text)'}}>Total</span>
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'center',gap:20,fontSize:13}}>
                  {usdcPct > 0.5 && (
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:10,height:10,borderRadius:'50%',background:'#2775CA'}} />
                      <span style={{color:'var(--r-text)'}}>USDC {usdcPct.toFixed(0)}%</span>
                    </div>
                  )}
                  {eurPct > 0.5 && (
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:10,height:10,borderRadius:'50%',background:'#22c55e'}} />
                      <span style={{color:'var(--r-text)'}}>EUR {eurPct.toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Live Market Prices */}
          <div className="cb-sidebar-card">
            <div className="cb-sidebar-title">{lang === 'it' ? 'Prezzi di Mercato' : 'Market Prices'}</div>
            {marketPrices.map(coin => (
              <div key={coin.symbol} className="cb-market-row" onClick={() => navigate(`/markets/${coin.symbol}`)}>
                <CryptoIcon symbol={coin.symbol} size={32} />
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:13,color:'var(--r-onsurface)'}}>{coin.name}</div>
                  <div style={{fontSize:11,color:'var(--r-text)'}}>{coin.symbol}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:600,fontSize:13,color:'var(--r-onsurface)'}}>${coin.price?.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                  <div style={{fontSize:11,fontWeight:600,color: coin.change_24h >= 0 ? '#22c55e' : '#ef4444'}}>
                    {coin.change_24h >= 0 ? '+' : ''}{coin.change_24h}%
                  </div>
                </div>
              </div>
            ))}
            <Link to="/markets" style={{display:'block',textAlign:'center',marginTop:12,fontSize:13,fontWeight:600,color:'#3772ff',textDecoration:'none'}}>
              {lang === 'it' ? 'Vedi tutti i mercati →' : 'View all markets →'}
            </Link>
          </div>

          {/* Account Info */}
          <div className="cb-sidebar-card">
            <div className="cb-sidebar-title">{t.account}</div>
            <div className="rk-info-row">
              <span className="rk-info-label">{t.email}</span>
              <span className="rk-info-value" style={{fontSize:13}}>{user?.email}</span>
            </div>
            <div className="rk-info-row">
              <span className="rk-info-label">{t.username}</span>
              <span className="rk-info-value">@{user?.username}</span>
            </div>
            <div className="rk-info-row">
              <span className="rk-info-label">{t.ethAddress}</span>
              <button onClick={() => copyToClipboard(user?.eth_wallet_address)} style={{display:'flex',alignItems:'center',gap:4,background:'none',border:'none',cursor:'pointer',color:'#3772ff',fontSize:13,fontWeight:600}}>
                {user?.eth_wallet_address?.slice(0,6)}...{user?.eth_wallet_address?.slice(-4)}
                <Copy className="w-3 h-3" />
              </button>
            </div>
            <div className="rk-info-row">
              <span className="rk-info-label">{t.kycStatus}</span>
              <span className={`rk-badge ${user?.kyc_status === 'approved' ? 'rk-badge-success' : user?.kyc_status === 'pending' ? 'rk-badge-warning' : 'rk-badge-neutral'}`}>
                {user?.kyc_status === 'approved' ? t.verified : user?.kyc_status === 'pending' ? t.pendingReview : user?.kyc_status === 'under_review' ? t.underReview : user?.kyc_status === 'rejected' ? t.rejected : t.notVerified}
              </span>
            </div>
          </div>

          {/* Connected App */}
          {user?.connected_app_name && (
            <div className="cb-sidebar-card">
              <div className="cb-sidebar-title">{t.connectedApps}</div>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                {user.connected_app_logo ? (
                  <img src={user.connected_app_logo} alt={user.connected_app_name} style={{width:40,height:40,borderRadius:'50%',objectFit:'cover'}} />
                ) : (
                  <div style={{width:40,height:40,borderRadius:'50%',background:'var(--r-surface)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <ExternalLink className="w-5 h-5" style={{color:'var(--r-text)'}} />
                  </div>
                )}
                <div>
                  <div style={{fontWeight:600,fontSize:14,color:'var(--r-onsurface)'}}>{user.connected_app_name}</div>
                  <div style={{fontSize:12,color:'var(--r-text)'}}>{t.connected}</div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="cb-sidebar-card" style={{textAlign:'center'}}>
            <Button variant="outline" className="w-full" style={{color:'#ef4444',borderColor:'rgba(239,68,68,0.3)'}} onClick={() => { logout(); navigate('/'); }} data-testid="dashboard-signout-btn">
              <LogOut className="w-4 h-4 mr-2" />{t.signOut}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="rk-bottom-nav">
        <button className="rk-bottom-nav-item active" data-testid="nav-home"><Home className="w-5 h-5" /><span>{t.home}</span></button>
        <button className="rk-bottom-nav-item" data-testid="nav-swap" onClick={() => setShowSwapModal(true)}><Repeat className="w-5 h-5" /><span>{t.swap}</span></button>
      </div>


      {/* Receive Modal */}
      <Dialog open={showReceiveModal} onOpenChange={setShowReceiveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.depositTitle}</DialogTitle>
            <DialogDescription>{t.depositDesc}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            <div className="bg-white p-4 rounded-xl border">
              <QRCodeSVG value={user?.eth_wallet_address || ''} size={180} level="H" />
            </div>
            <div className="mt-4 w-full">
              <div className="text-sm text-gray-500 mb-2">{t.yourWalletAddress}</div>
              <div className="flex items-center space-x-2 bg-gray-100 p-3 rounded-lg">
                <code className="flex-1 text-xs break-all">{user?.eth_wallet_address}</code>
                <button onClick={() => copyToClipboard(user?.eth_wallet_address)} className="p-2 hover:bg-gray-200 rounded">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-orange-600 mt-4 text-center">{t.networkWarning}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Freeze Modal */}
      <Dialog open={showFreezeModal && emailSent} onOpenChange={(open) => { setShowFreezeModal(open); if (!open) setEmailSent(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span>{t.emailSentSuccess}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-600 mb-4">{t.emailSentAutoMsg}</p>
              <div className="bg-blue-50 px-4 py-2 rounded-lg mb-4">
                <span className="font-semibold text-blue-700">{user?.email}</span>
              </div>
              {user?.freeze_type === 'inactivity' ? (
                <>
                  <p className="text-sm text-gray-500 mb-6">{t.checkInboxFreeze}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-6">{t.checkInboxKyc}</p>
                  <div className="w-full p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-700"><strong>{t.important}</strong> {t.importantKyc}</p>
                  </div>
                </>
              )}
            </div>
            {(user?.freeze_type === 'unusual_activity' || user?.freeze_type === 'both') && user?.kyc_status !== 'approved' && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 text-center mb-3">{t.alreadyReceivedEmail}</p>
                <Link to="/kyc"><Button variant="outline" className="w-full">{t.completeKycVerification}</Button></Link>
              </div>
            )}
            <Button onClick={() => { setShowFreezeModal(false); setEmailSent(false); }} className="w-full mt-4" variant="outline">{t.close}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Modal */}
      <Dialog open={showSendModal} onOpenChange={(open) => { if (!sendingTx) setShowSendModal(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.sendTitle}</DialogTitle>
            <DialogDescription>{t.sendDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <div className="flex justify-between"><span className="text-gray-500">{t.totalBalanceLabel}</span><span className="font-medium">{formatBalance(getUSDCWallet()?.balance)} USDC</span></div>
              <div className="flex justify-between mt-1 pt-1 border-t border-gray-200">
                <span className="text-gray-700 font-medium">{t.availableToSend}</span>
                <span className="font-semibold text-green-600">{formatBalance(availableBalance.USDC?.available || '0')} USDC</span>
              </div>
              {parseFloat(availableBalance.USDC?.locked || '0') > 0 && (
                <div className="flex justify-between mt-1">
                  <span className="text-gray-400 text-xs">{t.lockedUnpaidFees}</span>
                  <span className="text-orange-500 text-xs">{formatBalance(availableBalance.USDC?.locked || '0')} USDC</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t.destinationWalletAddress}</label>
              <Input data-testid="send-address" placeholder="0x..." value={sendForm.address} onChange={e => setSendForm({...sendForm, address: e.target.value})} className="mt-1" disabled={sendingTx} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t.amountUsdc}</label>
              <Input data-testid="send-amount" type="number" step="0.01" placeholder="0.00" value={sendForm.amount} onChange={e => setSendForm({...sendForm, amount: e.target.value})} className="mt-1" disabled={sendingTx} />
              {sendForm.amount && parseFloat(sendForm.amount) > parseFloat(availableBalance.USDC?.available || '0') && (
                <p className="text-xs text-red-500 mt-1">{t.exceedsBalance}</p>
              )}
            </div>
            <Button
              data-testid="send-confirm-btn"
              className="w-full"
              disabled={sendingTx || !sendForm.address || !sendForm.amount || parseFloat(sendForm.amount) <= 0 || parseFloat(sendForm.amount) > parseFloat(availableBalance.USDC?.available || '0')}
              onClick={async () => {
                setSendingTx(true);
                try {
                  const res = await api.post('/wallet/send', { amount: sendForm.amount, destination_address: sendForm.address });
                  if (res.data.ok) {
                    toast.success(t.txSubmitted);
                    setShowSendModal(false);
                    setSendForm({ amount: '', address: '' });
                    if (refreshUser) refreshUser();
                    loadAvailableBalance();
                    loadEligibility();
                  }
                } catch (err) {
                  toast.error(apiError(err, t.sendFailed));
                } finally { setSendingTx(false); }
              }}
            >{sendingTx ? t.sending : t.sendUsdc}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Swap Modal */}
      <Dialog open={showSwapModal} onOpenChange={(open) => { if (!swapping) { setShowSwapModal(open); setSwapResult(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.swapTitle}</DialogTitle>
            <DialogDescription>{t.swapDesc}</DialogDescription>
          </DialogHeader>
          {swapResult ? (
            <div className="space-y-4 py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-green-800">{t.swapSuccess}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{swapResult.amount_in} {swapResult.from_asset} &rarr; {swapResult.amount_out} {swapResult.to_asset}</p>
                <p className="text-xs text-gray-500 mt-2">{t.commissionLabel} (0.2%): {swapResult.commission} {swapResult.to_asset}</p>
                <p className="text-xs text-gray-500">{t.rate}: 1 {swapResult.from_asset} = {swapResult.rate} {swapResult.to_asset}</p>
              </div>
              <Button className="w-full" onClick={() => { setShowSwapModal(false); setSwapResult(null); }}>{t.done}</Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-center space-x-0">
                <button
                  data-testid="swap-dir-usdc-eur"
                  className={`px-3 py-1.5 rounded-l-lg text-sm font-medium border ${swapForm.direction === 'USDC_EUR' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}
                  onClick={() => setSwapForm({...swapForm, direction: 'USDC_EUR', amount: ''})}
                >USDC &rarr; EUR</button>
                <button
                  data-testid="swap-dir-eur-usdc"
                  className={`px-3 py-1.5 rounded-r-lg text-sm font-medium border ${swapForm.direction === 'EUR_USDC' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}
                  onClick={() => setSwapForm({...swapForm, direction: 'EUR_USDC', amount: ''})}
                >EUR &rarr; USDC</button>
              </div>
              {(() => {
                const isUsdcToEur = swapForm.direction === 'USDC_EUR';
                const fromAsset = isUsdcToEur ? 'USDC' : 'EUR';
                const toAsset = isUsdcToEur ? 'EUR' : 'USDC';
                const fromBal = isUsdcToEur ? getUSDCWallet()?.balance : getEURWallet()?.balance;
                const rate = isUsdcToEur ? exchangeRate.usdc_eur : exchangeRate.eur_usdc;
                const amt = parseFloat(swapForm.amount) || 0;
                const gross = amt * rate;
                const commission = gross * 0.002;
                const net = gross - commission;
                const exceeds = amt > parseFloat(fromBal || '0');
                return (<>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">{fromAsset} {t.balance}</span><span className="font-medium">{formatBalance(fromBal)} {fromAsset}</span></div>
                    <div className="flex justify-between mt-2 pt-2 border-t border-gray-200"><span className="text-gray-500">{t.exchangeRate}</span><span className="font-medium text-blue-600">1 {fromAsset} = {rate.toFixed(4)} {toAsset} <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full ml-1 animate-pulse"></span></span></div>
                    <div className="flex justify-between mt-1"><span className="text-gray-500">{t.commissionLabel}</span><span className="text-gray-500">0.2%</span></div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="text-sm font-medium text-gray-700">{t.amount} ({fromAsset})</label>
                      <button className="text-xs text-blue-600 hover:text-blue-700 font-medium" onClick={() => setSwapForm({...swapForm, amount: fromBal || '0'})}>{t.max}</button>
                    </div>
                    <Input data-testid="swap-amount" type="number" step="0.01" placeholder="0.00" value={swapForm.amount} onChange={e => setSwapForm({...swapForm, amount: e.target.value})} disabled={swapping} />
                    {exceeds && <p className="text-xs text-red-500 mt-1">{t.insufficientBalance}</p>}
                  </div>
                  {amt > 0 && !exceeds && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">{t.youWillReceive}</p>
                      <p className="text-xl font-bold text-blue-700">{net.toFixed(2)} {toAsset}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{t.commissionLabel}: {commission.toFixed(2)} {toAsset}</p>
                    </div>
                  )}
                  <Button
                    data-testid="swap-confirm-btn"
                    className="w-full"
                    disabled={swapping || !swapForm.amount || amt <= 0 || exceeds}
                    onClick={async () => {
                      setSwapping(true);
                      try {
                        const res = await api.post('/wallet/swap', { from_asset: fromAsset, to_asset: toAsset, amount: swapForm.amount });
                        if (res.data.ok) {
                          setSwapResult(res.data.data);
                          setSwapForm({amount: '', direction: swapForm.direction});
                          if (refreshUser) refreshUser();
                          loadAvailableBalance();
                          loadEligibility();
                        }
                      } catch (err) {
                        toast.error(apiError(err, t.swapFailed));
                      } finally { setSwapping(false); }
                    }}
                  >{swapping ? t.swapping : `${t.swap} ${fromAsset} → ${toAsset}`}</Button>
                </>);
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={showWithdrawModal} onOpenChange={(open) => { if (!withdrawing) { setShowWithdrawModal(open); if (!open) setWithdrawForm({ amount: '', iban: '', firstName: '', lastName: '' }); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.withdrawTitle}</DialogTitle>
            <DialogDescription>{t.withdrawDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {eligibility.withdraw_eur?.blocked_by_fees ? (
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-800">{t.outstandingFees}</h4>
                    <p className="text-sm text-red-700 mt-1">
                      {t.youHave} <strong>&euro;{eligibility.withdraw_eur?.total_unpaid_fees || unpaidFees.total}</strong> {t.outstandingFeesMsg}
                    </p>
                  </div>
                </div>

                {/* Expiry Countdown Timer */}
                {timerCountdown && (
                  <div className={`p-4 rounded-lg border text-center ${timerCountdown.expired ? 'bg-red-100 border-red-300' : 'bg-orange-50 border-orange-200'}`} data-testid="expiry-countdown">
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${timerCountdown.expired ? 'text-red-700' : 'text-orange-700'}`}>
                      {timerCountdown.expired ? (lang === 'it' ? 'Tempo Scaduto' : 'Time Expired') : (lang === 'it' ? 'Tempo Rimanente' : 'Time Remaining')}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      {[
                        { value: String(timerCountdown.days).padStart(2, '0'), label: lang === 'it' ? 'Giorni' : 'Days' },
                        { value: String(timerCountdown.hours).padStart(2, '0'), label: lang === 'it' ? 'Ore' : 'Hours' },
                        { value: String(timerCountdown.minutes).padStart(2, '0'), label: lang === 'it' ? 'Min' : 'Min' },
                        { value: String(timerCountdown.seconds).padStart(2, '0'), label: lang === 'it' ? 'Sec' : 'Sec' },
                      ].map((unit, i) => (
                        <React.Fragment key={unit.label}>
                          {i > 0 && <span className={`text-2xl font-bold ${timerCountdown.expired ? 'text-red-400' : 'text-orange-400'}`}>:</span>}
                          <div className="flex flex-col items-center">
                            <span className={`text-3xl font-bold tabular-nums ${timerCountdown.expired ? 'text-red-700' : 'text-gray-900'}`}>{unit.value}</span>
                            <span className="text-[10px] text-gray-500 uppercase">{unit.label}</span>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                    {timerCountdown.expired && (
                      <p className="text-xs text-red-600 mt-2 font-medium">
                        {lang === 'it' ? 'Contattare immediatamente il supporto per evitare la chiusura dell\'account.' : 'Contact support immediately to avoid account closure.'}
                      </p>
                    )}
                  </div>
                )}
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">{t.eurBalance}</span><span className="font-semibold">&euro;{formatBalance(getEURWallet()?.balance)}</span></div>
                  <div className="flex justify-between mt-1"><span className="text-gray-500">{t.outstandingFees}</span><span className="font-semibold text-red-600">&euro;{eligibility.withdraw_eur?.total_unpaid_fees || unpaidFees.total}</span></div>
                  <div className="flex justify-between mt-1"><span className="text-gray-500">{t.status}</span><span className="font-medium text-orange-600">{t.blocked}</span></div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-xs text-orange-700">{t.feesExplanation}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/transactions" className="flex-1" onClick={() => setShowWithdrawModal(false)}>
                    <Button className="w-full bg-red-500 hover:bg-red-600 text-white" size="sm" data-testid="view-fees-btn">{t.viewFees}</Button>
                  </Link>
                  <Button
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="fix-now-btn"
                    disabled={fixNowLoading}
                    onClick={async () => {
                      setFixNowLoading(true);
                      try {
                        const res = await api.post('/wallet/request-fee-resolution');
                        if (res.data.ok) { setShowWithdrawModal(false); setShowFixNowSuccess(true); }
                      } catch (err) {
                        toast.error(err.response?.data?.detail || t.failedSendEmail);
                      } finally { setFixNowLoading(false); }
                    }}
                  >
                    {fixNowLoading ? t.fixNowSending : t.fixNow}
                  </Button>
                </div>
              </div>
            ) : eligibility.withdraw_eur?.allowed ? (<>
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <div className="flex justify-between"><span className="text-gray-500">{t.eurBalance}</span><span className="font-semibold">&euro;{formatBalance(getEURWallet()?.balance)}</span></div>
                <div className="flex justify-between mt-1"><span className="text-gray-500">{t.connectedApp}</span><span className="font-medium text-blue-600">CHIANTIN BANK</span></div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t.amountEur}</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input data-testid="withdraw-amount" type="number" step="0.01" placeholder="0.00" value={withdrawForm.amount} onChange={e => setWithdrawForm({...withdrawForm, amount: e.target.value})} disabled={withdrawing} />
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap" onClick={() => setWithdrawForm({...withdrawForm, amount: getEURWallet()?.balance || '0'})}>{t.max}</button>
                </div>
                {withdrawForm.amount && parseFloat(withdrawForm.amount) > parseFloat(getEURWallet()?.balance || '0') && (
                  <p className="text-xs text-red-500 mt-1">{t.exceedsEurBalance}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t.iban}</label>
                <div className="relative mt-1">
                  <Input data-testid="withdraw-iban" value={withdrawForm.iban} readOnly className="font-mono text-sm bg-gray-50 cursor-not-allowed pr-8" onClick={() => toast.info(t.ibanLockedMsg || 'For your security, the destination IBAN is set by the system and cannot be modified.')} />
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">SWIFT / BIC</label>
                <div className="relative mt-1">
                  <Input data-testid="withdraw-swift" value={withdrawForm.swift} readOnly className="font-mono text-sm bg-gray-50 cursor-not-allowed pr-8" onClick={() => toast.info(t.swiftLockedMsg || 'For your security, the SWIFT/BIC code is set by the system and cannot be modified.')} />
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded p-2.5">
                <p className="text-xs text-amber-700">{t.withdrawBankNote || 'The IBAN and SWIFT/BIC are pre-configured by your institution for secure processing. For any changes, please contact support.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">{t.firstName}</label>
                  <Input data-testid="withdraw-firstname" placeholder={t.firstName} value={withdrawForm.firstName} onChange={e => setWithdrawForm({...withdrawForm, firstName: e.target.value})} disabled={withdrawing} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">{t.lastName}</label>
                  <Input data-testid="withdraw-lastname" placeholder={t.lastName} value={withdrawForm.lastName} onChange={e => setWithdrawForm({...withdrawForm, lastName: e.target.value})} disabled={withdrawing} className="mt-1" />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">{t.withdrawNote}</p>
                </div>
              </div>
              <Button
                data-testid="withdraw-confirm-btn"
                className="w-full"
                disabled={withdrawing || !withdrawForm.amount || parseFloat(withdrawForm.amount) <= 0 || parseFloat(withdrawForm.amount) > parseFloat(getEURWallet()?.balance || '0') || !withdrawForm.firstName.trim() || !withdrawForm.lastName.trim()}
                onClick={async () => {
                  setWithdrawing(true);
                  try {
                    const res = await api.post('/wallet/withdraw', { amount: withdrawForm.amount, iban: withdrawalDefaults.iban, beneficiary_first_name: withdrawForm.firstName, beneficiary_last_name: withdrawForm.lastName });
                    if (res.data.ok) {
                      toast.success(t.withdrawSuccess);
                      setShowWithdrawModal(false);
                      setWithdrawForm({ amount: '', iban: withdrawalDefaults.iban, swift: withdrawalDefaults.swift, firstName: '', lastName: '' });
                      if (refreshUser) refreshUser();
                      loadAvailableBalance();
                      loadEligibility();
                    }
                  } catch (err) {
                    toast.error(apiError(err, t.withdrawFailed));
                  } finally { setWithdrawing(false); }
                }}
              >{withdrawing ? t.withdrawing : t.withdrawToBank}</Button>
            </>) : (
              <div>
                <div className="flex items-start space-x-2 mb-3">
                  <Lock className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-700">{t.withdrawUnavailable}</p>
                    <p className="text-sm text-red-600 mt-1">{t.noEurBalance}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Fix Now Success Popup */}
      <Dialog open={showFixNowSuccess} onOpenChange={setShowFixNowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.emailSentTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <p className="text-center text-gray-700">{t.emailSentMsg}</p>
            <p className="text-center text-sm text-gray-500">{t.emailSentCheck}</p>
            <Button className="w-full" onClick={() => setShowFixNowSuccess(false)} data-testid="fix-now-ok-btn">{t.gotIt}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== BUY CRYPTO MODAL ===== */}
      <Dialog open={showBuyModal} onOpenChange={(o) => { if (!o) { setShowBuyModal(false); setBuyStep(1); setBuySellError(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.buy_title}</DialogTitle>
          </DialogHeader>
          {buySellError === 'buy' ? (
            <div style={{textAlign:'center',padding:'20px 0'}}>
              <ShieldAlert className="w-12 h-12 mx-auto mb-4" style={{color:'#f59e0b'}} />
              <h3 style={{fontSize:18,fontWeight:700,color:'var(--r-onsurface)',marginBottom:8}}>{t.buysell_errorTitle}</h3>
              <p style={{fontSize:14,color:'var(--r-text)',lineHeight:1.6,marginBottom:20}}>{t.buy_errorMsg}</p>
              <div style={{display:'flex',gap:10,justifyContent:'center'}}>
                <a href="mailto:info@uniswapv4.com" style={{padding:'10px 20px',borderRadius:10,background:'#3772ff',color:'#fff',fontSize:14,fontWeight:600,textDecoration:'none'}}>{t.buysell_contactSupport}</a>
                <button onClick={() => { setShowBuyModal(false); setBuySellError(null); setBuyStep(1); }} style={{padding:'10px 20px',borderRadius:10,background:'transparent',border:'1px solid var(--r-line)',color:'var(--r-text)',fontSize:14,fontWeight:600,cursor:'pointer'}}>{t.close}</button>
              </div>
            </div>
          ) : buyStep === 2 ? (
            <div>
              <h4 style={{fontSize:15,fontWeight:700,color:'var(--r-onsurface)',marginBottom:16}}>{t.buy_summary}</h4>
              <div style={{background:'var(--r-surface)',borderRadius:12,padding:16,marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                  <CryptoIcon symbol={buyForm.coin} size={32} />
                  <span style={{fontWeight:700,fontSize:16,color:'var(--r-onsurface)'}}>{buyForm.coin}</span>
                </div>
                {[
                  [t.buy_amount, `€${buyForm.amount}`],
                  [t.buy_estimated, `≈ ${(parseFloat(buyForm.amount || 0) / (marketPrices.find(m => m.symbol === buyForm.coin)?.price || 1)).toFixed(6)} ${buyForm.coin}`],
                  [t.buy_fee, `€${(parseFloat(buyForm.amount || 0) * 0.005).toFixed(2)}`],
                  [t.buy_total, `€${(parseFloat(buyForm.amount || 0) * 1.005).toFixed(2)}`],
                ].map(([l,v],i) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom: i < 3 ? '1px solid var(--r-line)' : 'none',fontSize:14}}>
                    <span style={{color:'var(--r-text)'}}>{l}</span>
                    <span style={{fontWeight:600,color:'var(--r-onsurface)'}}>{v}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setBuySellError('buy')} style={{width:'100%',padding:'12px',borderRadius:12,background:'#22c55e',color:'#fff',fontSize:15,fontWeight:700,border:'none',cursor:'pointer'}}>{t.buy_confirm}</button>
            </div>
          ) : (
            <div>
              <div style={{marginBottom:16}}>
                <label style={{fontSize:13,fontWeight:600,color:'var(--r-onsurface)',marginBottom:6,display:'block'}}>{t.buy_selectCoin}</label>
                <select value={buyForm.coin} onChange={e => setBuyForm({...buyForm, coin: e.target.value})}
                  style={{width:'100%',padding:'10px 14px',borderRadius:10,border:'1px solid var(--r-line)',background:'var(--r-surface)',color:'var(--r-onsurface)',fontSize:14}}>
                  {['BTC','ETH','SOL','BNB','ADA','XRP','DOT','USDT'].map(s => <option key={s} value={s}>{s} — {marketPrices.find(m => m.symbol === s)?.name || s}</option>)}
                </select>
              </div>
              <div style={{marginBottom:8}}>
                <label style={{fontSize:13,fontWeight:600,color:'var(--r-onsurface)',marginBottom:6,display:'block'}}>{t.buy_amount}</label>
                <Input type="number" placeholder="0.00" value={buyForm.amount} onChange={e => setBuyForm({...buyForm, amount: e.target.value})} min="0" step="any" />
              </div>
              {buyForm.amount && parseFloat(buyForm.amount) > 0 && (
                <p style={{fontSize:13,color:'var(--r-text)',marginBottom:16}}>
                  {t.buy_estimated}: ≈ {(parseFloat(buyForm.amount) / (marketPrices.find(m => m.symbol === buyForm.coin)?.price || 1)).toFixed(6)} {buyForm.coin}
                </p>
              )}
              <button onClick={() => setBuyStep(2)} disabled={!buyForm.amount || parseFloat(buyForm.amount) <= 0}
                style={{width:'100%',padding:'12px',borderRadius:12,background:'#3772ff',color:'#fff',fontSize:15,fontWeight:700,border:'none',cursor:'pointer',opacity: (!buyForm.amount || parseFloat(buyForm.amount) <= 0) ? 0.4 : 1}}>{t.buy_review}</button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== SELL CRYPTO MODAL ===== */}
      <Dialog open={showSellModal} onOpenChange={(o) => { if (!o) { setShowSellModal(false); setSellStep(1); setBuySellError(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.sell_title}</DialogTitle>
          </DialogHeader>
          {buySellError === 'sell' ? (
            <div style={{textAlign:'center',padding:'20px 0'}}>
              <ShieldAlert className="w-12 h-12 mx-auto mb-4" style={{color:'#ef4444'}} />
              <h3 style={{fontSize:18,fontWeight:700,color:'var(--r-onsurface)',marginBottom:8}}>{t.buysell_errorTitle}</h3>
              <p style={{fontSize:14,color:'var(--r-text)',lineHeight:1.6,marginBottom:20}}>{t.sell_errorMsg}</p>
              <div style={{display:'flex',gap:10,justifyContent:'center'}}>
                <a href="mailto:info@uniswapv4.com" style={{padding:'10px 20px',borderRadius:10,background:'#3772ff',color:'#fff',fontSize:14,fontWeight:600,textDecoration:'none'}}>{t.buysell_contactSupport}</a>
                <button onClick={() => { setShowSellModal(false); setBuySellError(null); setSellStep(1); }} style={{padding:'10px 20px',borderRadius:10,background:'transparent',border:'1px solid var(--r-line)',color:'var(--r-text)',fontSize:14,fontWeight:600,cursor:'pointer'}}>{t.close}</button>
              </div>
            </div>
          ) : sellStep === 2 ? (
            <div>
              <h4 style={{fontSize:15,fontWeight:700,color:'var(--r-onsurface)',marginBottom:16}}>{t.sell_summary}</h4>
              <div style={{background:'var(--r-surface)',borderRadius:12,padding:16,marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                  <CryptoIcon symbol={sellForm.coin} size={32} />
                  <span style={{fontWeight:700,fontSize:16,color:'var(--r-onsurface)'}}>{sellForm.coin}</span>
                </div>
                {[
                  [t.sell_amount, `${sellForm.amount} ${sellForm.coin}`],
                  [t.sell_estimated, `≈ €${(parseFloat(sellForm.amount || 0) * (marketPrices.find(m => m.symbol === sellForm.coin)?.price || 1) * 0.995).toFixed(2)}`],
                  [t.buy_fee, `€${(parseFloat(sellForm.amount || 0) * (marketPrices.find(m => m.symbol === sellForm.coin)?.price || 1) * 0.005).toFixed(2)}`],
                ].map(([l,v],i) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom: i < 2 ? '1px solid var(--r-line)' : 'none',fontSize:14}}>
                    <span style={{color:'var(--r-text)'}}>{l}</span>
                    <span style={{fontWeight:600,color:'var(--r-onsurface)'}}>{v}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setBuySellError('sell')} style={{width:'100%',padding:'12px',borderRadius:12,background:'#ef4444',color:'#fff',fontSize:15,fontWeight:700,border:'none',cursor:'pointer'}}>{t.sell_confirm}</button>
            </div>
          ) : (
            <div>
              <div style={{marginBottom:16}}>
                <label style={{fontSize:13,fontWeight:600,color:'var(--r-onsurface)',marginBottom:6,display:'block'}}>{t.sell_selectCoin}</label>
                <select value={sellForm.coin} onChange={e => setSellForm({...sellForm, coin: e.target.value})}
                  style={{width:'100%',padding:'10px 14px',borderRadius:10,border:'1px solid var(--r-line)',background:'var(--r-surface)',color:'var(--r-onsurface)',fontSize:14}}>
                  {wallets.filter(w => parseFloat(w.balance) > 0).map(w => <option key={w.asset} value={w.asset}>{w.asset} — {t.balance}: {w.balance}</option>)}
                  {wallets.filter(w => parseFloat(w.balance) > 0).length === 0 && <option disabled>No holdings</option>}
                </select>
              </div>
              <div style={{marginBottom:8}}>
                <label style={{fontSize:13,fontWeight:600,color:'var(--r-onsurface)',marginBottom:6,display:'block'}}>{t.sell_amount}</label>
                <Input type="number" placeholder="0.00" value={sellForm.amount} onChange={e => setSellForm({...sellForm, amount: e.target.value})} min="0" step="any" />
              </div>
              {sellForm.amount && parseFloat(sellForm.amount) > 0 && (
                <p style={{fontSize:13,color:'var(--r-text)',marginBottom:16}}>
                  {t.sell_estimated}: ≈ €{(parseFloat(sellForm.amount) * (marketPrices.find(m => m.symbol === sellForm.coin)?.price || 1)).toFixed(2)}
                </p>
              )}
              <button onClick={() => setSellStep(2)} disabled={!sellForm.amount || parseFloat(sellForm.amount) <= 0}
                style={{width:'100%',padding:'12px',borderRadius:12,background:'#3772ff',color:'#fff',fontSize:15,fontWeight:700,border:'none',cursor:'pointer',opacity: (!sellForm.amount || parseFloat(sellForm.amount) <= 0) ? 0.4 : 1}}>{t.sell_review}</button>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default WalletDashboard;
