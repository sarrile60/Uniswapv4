import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/i18n';
import CryptoIcon from '@/components/CryptoIcons';
import { Search, Star, ArrowUpDown } from 'lucide-react';
import './RockieWallet.css';

const API = process.env.REACT_APP_BACKEND_URL;

const CATEGORIES = {
  all: null,
  defi: ['ETH', 'ADA', 'SOL', 'DOT'],
  nft: ['SOL', 'ETH', 'BNB'],
  layer1: ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'BNB'],
  stablecoins: ['USDT'],
};

const MarketsPage = () => {
  const { t, lang } = useLang();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortKey, setSortKey] = useState('market_cap');
  const [sortDir, setSortDir] = useState('desc');
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      try { setFavorites(JSON.parse(localStorage.getItem(`favorites_${user.email}`)) || []); } catch { setFavorites([]); }
    }
  }, [isAuthenticated, user?.email]);

  const toggleFavorite = (symbol) => {
    if (!isAuthenticated) return;
    const key = `favorites_${user.email}`;
    setFavorites(prev => {
      const next = prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol];
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/api/market/prices`);
        const json = await res.json();
        if (json.ok && json.data) setCoins(json.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = coins
    .filter(c => {
      if (search) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.symbol.toLowerCase().includes(q)) return false;
      }
      if (category !== 'all' && CATEGORIES[category]) {
        if (!CATEGORIES[category].includes(c.symbol)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      return ((a[sortKey] || 0) - (b[sortKey] || 0)) * mul;
    });

  const fmt = (n) => {
    if (n >= 1e12) return `$${(n/1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n/1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n/1e6).toFixed(2)}M`;
    return `$${n.toLocaleString()}`;
  };

  const fmtPrice = (p) => {
    if (p >= 1000) return `$${p.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    if (p >= 1) return `$${p.toFixed(2)}`;
    return `$${p.toFixed(4)}`;
  };

  const Sparkline = ({ up }) => {
    const color = up ? '#22c55e' : '#ef4444';
    const path = up
      ? 'M0 18 L8 16 L16 13 L24 15 L32 10 L40 12 L48 7 L56 5 L64 8 L72 3'
      : 'M0 3 L8 5 L16 8 L24 4 L32 9 L40 7 L48 12 L56 14 L64 11 L72 18';
    return <svg width="72" height="20" viewBox="0 0 72 20" fill="none"><path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>;
  };

  const cats = [
    { key: 'all', label: t.mkt_all },
    { key: 'defi', label: t.mkt_defi },
    { key: 'nft', label: t.mkt_nft },
    { key: 'layer1', label: t.mkt_layer1 },
    { key: 'stablecoins', label: t.mkt_stablecoins },
  ];

  const SortHeader = ({ k, children }) => (
    <th onClick={() => handleSort(k)} style={{cursor:'pointer',userSelect:'none'}}>
      <span style={{display:'inline-flex',alignItems:'center',gap:4}}>
        {children}
        {sortKey === k && <ArrowUpDown className="w-3 h-3" style={{opacity:0.5}} />}
      </span>
    </th>
  );

  return (
    <div style={{minHeight:'100vh'}}>
      <div className="rk-content" style={{maxWidth:1200,margin:'0 auto'}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:16}}>
          <h1 className="rk-section-title" style={{fontSize:28,margin:0}}>{t.mkt_title}</h1>
          <div style={{position:'relative',width:280}}>
            <Search style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',width:18,height:18,color:'var(--r-text)',opacity:0.5}} />
            <input
              type="text"
              placeholder={t.mkt_search}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{width:'100%',padding:'10px 14px 10px 42px',borderRadius:12,border:'1px solid var(--r-line)',background:'var(--r-surface)',color:'var(--r-onsurface)',fontSize:14,outline:'none'}}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="rk-tabs">
          {cats.map(c => (
            <button key={c.key} className={`rk-tab ${category === c.key ? 'active' : ''}`} onClick={() => setCategory(c.key)}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Coins Table */}
        <div className="rk-card" style={{padding:0,overflow:'hidden'}}>
          {loading ? (
            <div className="rk-empty"><div className="rk-empty-text">{t.loading}</div></div>
          ) : filtered.length === 0 ? (
            <div className="rk-empty"><div className="rk-empty-text">No coins found</div></div>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{borderBottom:'1px solid var(--r-line)'}}>
                    <th style={{padding:'14px 16px',textAlign:'left',fontSize:13,fontWeight:600,color:'var(--r-text)',width:40}}></th>
                    <th style={{padding:'14px 8px',textAlign:'left',fontSize:13,fontWeight:600,color:'var(--r-text)',width:40}}>{t.mkt_rank}</th>
                    <th style={{padding:'14px 16px',textAlign:'left',fontSize:13,fontWeight:600,color:'var(--r-text)'}}>{t.mkt_name}</th>
                    <SortHeader k="price">{t.mkt_price}</SortHeader>
                    <SortHeader k="change_24h">{t.mkt_24h}</SortHeader>
                    <th style={{padding:'14px 16px',textAlign:'left',fontSize:13,fontWeight:600,color:'var(--r-text)'}}>{t.mkt_7d}</th>
                    <SortHeader k="market_cap">{t.mkt_marketCap}</SortHeader>
                    <SortHeader k="volume_24h">{t.mkt_volume}</SortHeader>
                    <th style={{padding:'14px 16px',width:60}}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((coin, idx) => (
                    <tr key={coin.symbol}
                      style={{borderBottom:'1px solid var(--r-line)',cursor:'pointer',transition:'background 0.15s'}}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(55,114,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                      onClick={() => navigate(`/markets/${coin.symbol}`)}
                    >
                      <td style={{padding:'12px 16px'}} onClick={e => { e.stopPropagation(); toggleFavorite(coin.symbol); }}>
                        <Star className="w-4 h-4" style={{color: favorites.includes(coin.symbol) ? '#f59e0b' : 'var(--r-text)', fill: favorites.includes(coin.symbol) ? '#f59e0b' : 'none', opacity: favorites.includes(coin.symbol) ? 1 : 0.3, cursor:'pointer'}} />
                      </td>
                      <td style={{padding:'12px 8px',fontSize:13,color:'var(--r-text)'}}>{idx+1}</td>
                      <td style={{padding:'12px 16px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:12}}>
                          <CryptoIcon symbol={coin.symbol} size={32} />
                          <div>
                            <div style={{fontWeight:700,fontSize:14,color:'var(--r-onsurface)'}}>{coin.name}</div>
                            <div style={{fontSize:12,color:'var(--r-text)'}}>{coin.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{padding:'12px 16px',fontWeight:600,fontSize:14,color:'var(--r-onsurface)'}}>{fmtPrice(coin.price)}</td>
                      <td style={{padding:'12px 16px',fontWeight:600,fontSize:13,color: coin.change_24h >= 0 ? '#22c55e' : '#ef4444'}}>
                        {coin.change_24h >= 0 ? '+' : ''}{coin.change_24h}%
                      </td>
                      <td style={{padding:'12px 16px'}}><Sparkline up={coin.change_24h >= 0} /></td>
                      <td style={{padding:'12px 16px',fontSize:13,color:'var(--r-text)'}}>{fmt(coin.market_cap)}</td>
                      <td style={{padding:'12px 16px',fontSize:13,color:'var(--r-text)'}}>{fmt(coin.volume_24h)}</td>
                      <td style={{padding:'12px 16px'}}>
                        <Link to={isAuthenticated ? '/wallet' : '/register'}
                          onClick={e => e.stopPropagation()}
                          style={{padding:'6px 16px',borderRadius:8,background:'#3772ff',color:'#fff',fontSize:12,fontWeight:600,textDecoration:'none',display:'inline-block'}}
                        >{t.mkt_trade}</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketsPage;
