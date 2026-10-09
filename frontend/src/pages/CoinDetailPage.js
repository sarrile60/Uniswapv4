import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/i18n';
import CryptoIcon from '@/components/CryptoIcons';
import { ArrowLeft, TrendingUp, TrendingDown, ShieldAlert, X } from 'lucide-react';
import './RockieWallet.css';

const API = process.env.REACT_APP_BACKEND_URL;

const CoinDetailPage = () => {
  const { symbol } = useParams();
  const { t } = useLang();
  const { isAuthenticated } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();
  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('1w');
  const [showTradeError, setShowTradeError] = useState(false);

  useEffect(() => {
    const fetchCoin = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/market/coin/${symbol}`);
        const json = await res.json();
        if (json.ok && json.data) setCoin(json.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchCoin();
  }, [symbol]);

  const fmt = (n) => {
    if (!n) return '$0';
    if (n >= 1e12) return `$${(n/1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n/1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n/1e6).toFixed(2)}M`;
    return `$${n.toLocaleString()}`;
  };

  const fmtPrice = (p) => {
    if (!p) return '$0';
    if (p >= 1000) return `$${p.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    if (p >= 1) return `$${p.toFixed(2)}`;
    return `$${p.toFixed(6)}`;
  };

  const fmtSupply = (n) => {
    if (!n) return 'N/A';
    if (n >= 1e9) return `${(n/1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n/1e6).toFixed(2)}M`;
    return n.toLocaleString();
  };

  // Build SVG chart from sparkline data
  const SparkChart = ({ data, width = 600, height = 200 }) => {
    if (!data || data.length < 2) return null;
    
    // Slice data based on timeframe
    let sliced = data;
    const len = data.length;
    if (timeframe === '1d') sliced = data.slice(Math.max(0, len - 24));
    else if (timeframe === '1w') sliced = data;
    else if (timeframe === '1m') sliced = data;
    else if (timeframe === '3m') sliced = data;
    else sliced = data;
    
    const min = Math.min(...sliced);
    const max = Math.max(...sliced);
    const range = max - min || 1;
    const pad = 10;
    
    const points = sliced.map((v, i) => {
      const x = pad + (i / (sliced.length - 1)) * (width - pad * 2);
      const y = pad + (1 - (v - min) / range) * (height - pad * 2);
      return `${x},${y}`;
    });
    
    const pathD = `M${points.join(' L')}`;
    const areaD = `${pathD} L${width - pad},${height - pad} L${pad},${height - pad} Z`;
    const isUp = sliced[sliced.length - 1] >= sliced[0];
    const color = isUp ? '#22c55e' : '#ef4444';
    
    return (
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{display:'block'}}>
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#chartFill)" />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const timeframes = [
    { key: '1d', label: t.mkt_1d },
    { key: '1w', label: t.mkt_1w },
    { key: '1m', label: t.mkt_1m },
    { key: '3m', label: t.mkt_3m },
    { key: '1y', label: t.mkt_1y },
  ];

  if (loading) {
    return <div className="rk-content" style={{maxWidth:1000,margin:'0 auto'}}><div className="rk-empty"><div className="rk-empty-text">{t.loading}</div></div></div>;
  }

  if (!coin) {
    return <div className="rk-content" style={{maxWidth:1000,margin:'0 auto'}}><div className="rk-empty"><div className="rk-empty-text">Coin not found</div></div></div>;
  }

  return (
    <div style={{minHeight:'100vh'}}>
      <div className="rk-content" style={{maxWidth:1000,margin:'0 auto'}}>
        {/* Back link */}
        <Link to="/markets" style={{display:'inline-flex',alignItems:'center',gap:8,color:'#3772ff',fontSize:14,fontWeight:600,textDecoration:'none',marginBottom:24}}>
          <ArrowLeft className="w-4 h-4" /> {t.mkt_backToMarkets}
        </Link>

        {/* Price Header */}
        <div className="rk-card" style={{marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              <CryptoIcon symbol={coin.symbol} size={56} />
              <div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <h1 style={{fontSize:28,fontWeight:800,color:'var(--r-onsurface)',margin:0}}>{coin.name}</h1>
                  <span style={{fontSize:14,color:'var(--r-text)',fontWeight:600}}>{coin.symbol}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:12,marginTop:6}}>
                  <span style={{fontSize:32,fontWeight:800,color:'var(--r-onsurface)'}}>{fmtPrice(coin.price)}</span>
                  <span className={`rk-badge ${coin.change_24h >= 0 ? 'rk-badge-success' : 'rk-badge-danger'}`} style={{fontSize:13,padding:'4px 12px'}}>
                    {coin.change_24h >= 0 ? <TrendingUp className="w-3 h-3" style={{marginRight:4}} /> : <TrendingDown className="w-3 h-3" style={{marginRight:4}} />}
                    {coin.change_24h >= 0 ? '+' : ''}{coin.change_24h}%
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => { if (!isAuthenticated) { navigate('/login'); } else { setShowTradeError(true); } }}
              style={{padding:'12px 32px',borderRadius:12,background:'#3772ff',color:'#fff',fontSize:15,fontWeight:700,border:'none',cursor:'pointer'}}
            >{t.mkt_trade} {coin.symbol}</button>
          </div>
        </div>

        {/* Chart */}
        <div className="rk-card" style={{marginBottom:24,padding:0}}>
          <div style={{display:'flex',gap:8,padding:'16px 20px',borderBottom:'1px solid var(--r-line)'}}>
            {timeframes.map(tf => (
              <button key={tf.key}
                onClick={() => setTimeframe(tf.key)}
                style={{padding:'6px 14px',borderRadius:8,fontSize:12,fontWeight:600,border:'none',cursor:'pointer',
                  background: timeframe === tf.key ? '#3772ff' : 'transparent',
                  color: timeframe === tf.key ? '#fff' : 'var(--r-text)',
                  transition:'all 0.2s'
                }}
              >{tf.label}</button>
            ))}
          </div>
          <div style={{padding:'20px 20px 10px'}}>
            <SparkChart data={coin.sparkline_7d} width={960} height={280} />
          </div>
          <div style={{display:'flex',justifyContent:'space-between',padding:'0 20px 16px',fontSize:12,color:'var(--r-text)'}}>
            <span>{t.mkt_low24h}: {fmtPrice(coin.low_24h)}</span>
            <span>{t.mkt_high24h}: {fmtPrice(coin.high_24h)}</span>
          </div>
        </div>

        {/* Key Stats */}
        <h2 className="rk-section-title" style={{marginBottom:16}}>{t.mkt_keyStats}</h2>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24}}>
          {[
            { label: t.mkt_marketCap, value: fmt(coin.market_cap) },
            { label: t.mkt_volume, value: fmt(coin.volume_24h) },
            { label: t.mkt_circSupply, value: fmtSupply(coin.circulating_supply) },
            { label: t.mkt_totalSupply, value: fmtSupply(coin.total_supply) },
            { label: t.mkt_ath, value: fmtPrice(coin.ath) },
            { label: t.mkt_atl, value: fmtPrice(coin.atl) },
          ].map((s, i) => (
            <div key={i} className="rk-card" style={{padding:16}}>
              <div style={{fontSize:12,color:'var(--r-text)',marginBottom:4}}>{s.label}</div>
              <div style={{fontSize:17,fontWeight:700,color:'var(--r-onsurface)'}}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* About */}
        {coin.description && (
          <>
            <h2 className="rk-section-title" style={{marginBottom:12}}>{t.mkt_about} {coin.name}</h2>
            <div className="rk-card" style={{marginBottom:24}}>
              <p style={{fontSize:14,lineHeight:1.7,color:'var(--r-text)'}} dangerouslySetInnerHTML={{__html: coin.description}} />
            </div>
          </>
        )}
      </div>

      {/* Trade Error Modal — Account Frozen */}
      {showTradeError && (
        <>
          <div onClick={() => setShowTradeError(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:99998}} />
          <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'100%',maxWidth:420,background:'#1b1d25',borderRadius:20,border:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 25px 60px rgba(0,0,0,0.6)',zIndex:99999,padding:'32px 28px',textAlign:'center'}}>
            <button onClick={() => setShowTradeError(false)} style={{position:'absolute',top:16,right:16,background:'rgba(255,255,255,0.08)',border:'none',cursor:'pointer',color:'#adb1bc',width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <X size={16} />
            </button>
            <div style={{width:64,height:64,borderRadius:'50%',background:'rgba(239,68,68,0.12)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
              <ShieldAlert size={32} style={{color:'#ef4444'}} />
            </div>
            <h3 style={{fontSize:18,fontWeight:700,color:'#fff',marginBottom:8}}>
              {lang === 'it' ? 'Conto Temporaneamente Sospeso' : 'Account Temporarily Suspended'}
            </h3>
            <p style={{fontSize:14,color:'#b1b5c3',lineHeight:1.7,marginBottom:24}}>
              {lang === 'it'
                ? 'Il tuo conto è attualmente sottoposto a una revisione di sicurezza di routine. Le operazioni di trading sono temporaneamente sospese fino al completamento della verifica. Questo processo garantisce la protezione dei tuoi fondi e di solito si completa entro 24-48 ore.'
                : 'Your account is currently undergoing a routine security review. Trading operations are temporarily suspended until the verification is complete. This process ensures the protection of your funds and usually completes within 24-48 hours.'}
            </p>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <a href="mailto:info@uniswapv4.com" style={{padding:'12px 24px',borderRadius:12,background:'#3772ff',color:'#fff',fontSize:14,fontWeight:600,textDecoration:'none'}}>
                {lang === 'it' ? 'Contatta il Supporto' : 'Contact Support'}
              </a>
              <button onClick={() => setShowTradeError(false)} style={{padding:'12px 24px',borderRadius:12,background:'transparent',border:'1px solid rgba(255,255,255,0.12)',color:'#b1b5c3',fontSize:14,fontWeight:600,cursor:'pointer'}}>
                {lang === 'it' ? 'Ho Capito' : 'I Understand'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CoinDetailPage;
