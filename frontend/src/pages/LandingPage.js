import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import RockieHeader from "@/components/RockieHeader";
import CryptoIcon from "@/components/CryptoIcons";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/i18n";
import "./LandingPage.css";

const API = process.env.REACT_APP_BACKEND_URL;

const LandingPage = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme_mode');
    return saved === 'light' ? false : true;
  });
  const [activeTab, setActiveTab] = useState(0);
  const [marketData, setMarketData] = useState([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const { user, logout, isAuthenticated } = useAuth();
  const { t, lang } = useLang();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("is_dark");
    } else {
      document.body.classList.remove("is_dark");
    }
    return () => document.body.classList.remove("is_dark");
  }, [darkMode]);

  // Scroll reveal animation
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    const els = document.querySelectorAll('.reveal');
    els.forEach(el => observer.observe(el));
    return () => els.forEach(el => observer.unobserve(el));
  }, []);


  // Load favorites from localStorage (scoped to user email)
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      const key = `favorites_${user.email}`;
      try { setFavorites(JSON.parse(localStorage.getItem(key)) || []); } catch { setFavorites([]); }
    } else {
      setFavorites([]);
    }
  }, [isAuthenticated, user?.email]);

  const toggleFavorite = (symbol) => {
    if (!isAuthenticated) { alert(t.land_loginToFavorite); return; }
    const key = `favorites_${user.email}`;
    setFavorites(prev => {
      const next = prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol];
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };


  // Fetch live market data
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch(`${API}/api/market/prices`);
        const json = await res.json();
        if (json.ok && json.data && json.data.length > 0) {
          setMarketData(json.data);
        }
      } catch (e) {
        console.error("Failed to fetch market prices:", e);
      } finally {
        setMarketLoading(false);
      }
    };
    fetchPrices();
    // Refresh every 60 seconds
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  // Helper functions for formatting
  const formatPrice = (price) => {
    if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(4);
  };
  
  const formatVolume = (vol) => {
    if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B(USD)`;
    if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M(USD)`;
    return `${vol.toLocaleString()}(USD)`;
  };

  // Category-to-symbols mapping for top card filters
  const tabSymbols = {
    0: ['BTC','ETH','USDT','BNB'],         // Crypto — top 4
    1: ['ETH','ADA','SOL','DOT'],           // DeFi
    2: ['BNB','USDT','ADA','DOT'],          // BSC
    3: ['SOL','ETH','BNB','DOT'],           // NFT
    4: ['ETH','SOL','ADA','DOT'],           // Metaverse
    5: ['DOT','ETH','ADA','SOL'],           // Polkadot ecosystem
    6: ['SOL','ETH','BTC','USDT'],          // Solana ecosystem
    7: ['ETH','SOL','BNB','ADA'],           // Opensea
    8: ['ETH','SOL','BTC','ADA'],           // Makersplace
  };

  // Derive display data from live market data — filtered by active category tab
  const activeSymbols = tabSymbols[activeTab] || tabSymbols[0];
  const cryptoData = (marketData.length > 0
    ? marketData.filter(c => activeSymbols.includes(c.symbol)).slice(0, 4)
    : [
      { symbol: "BTC", name: "Bitcoin", price: 0, change_24h: 0 },
      { symbol: "ETH", name: "Ethereum", price: 0, change_24h: 0 },
      { symbol: "USDT", name: "Tether", price: 0, change_24h: 0 },
      { symbol: "BNB", name: "BNB", price: 0, change_24h: 0 },
    ]
  ).map(coin => ({
    symbol: coin.symbol,
    name: coin.name,
    pair: coin.symbol,
    price: `USD ${formatPrice(coin.price)}`,
    change: `${coin.change_24h >= 0 ? "+" : ""}${coin.change_24h}%`,
    up: coin.change_24h >= 0,
  }));

  const coinListData = (marketData.length > 0 ? marketData : []).map((coin, i) => ({
    rank: i + 1,
    symbol: coin.symbol,
    name: coin.name,
    pair: coin.symbol,
    lastTraded: formatPrice(coin.price),
    change: `${coin.change_24h >= 0 ? "+" : ""}${coin.change_24h}%`,
    up: coin.change_24h >= 0,
    high: formatPrice(coin.high_24h),
    low: formatPrice(coin.low_24h),
    turnover: formatVolume(coin.volume_24h),
  }));

  // Mini sparkline SVG
  const Sparkline = ({ up }) => {
    const color = up ? '#58bd7d' : '#d33535';
    const path = up 
      ? 'M0 20 L5 18 L10 15 L15 17 L20 12 L25 14 L30 10 L35 8 L40 11 L45 6 L50 4 L55 7 L60 3'
      : 'M0 4 L5 6 L10 8 L15 5 L20 10 L25 8 L30 13 L35 15 L40 12 L45 17 L50 19 L55 16 L60 20';
    return (
      <svg width="60" height="24" viewBox="0 0 60 24" fill="none" style={{ display: 'block' }}>
        <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const tabs = ["Crypto", "DeFi", "BSC", "NFT", "Metaverse", "Polkadot", "Solana", "Opensea", "Makersplace"];

  const marketMainTabs = [t.land_favorites, t.land_derivatives, t.land_spot];
  const marketSubTabs = [t.land_all, t.land_inversePerpetual, t.land_usdtPerpetual, t.land_inverseFutures];
  const marketFilterTabs = [t.land_hot, t.land_new, t.land_defi, t.land_nft];
  const [activeMarketMain, setActiveMarketMain] = useState(1); // Derivatives active
  const [activeMarketSub, setActiveMarketSub] = useState(0);
  const [activeMarketFilter, setActiveMarketFilter] = useState(0);

  const testimonials = [
    { text: t.land_testimonial1, name: "Alex Johnson", position: "Crypto Trader", initials: "AJ", color: "#3772ff" },
    { text: t.land_testimonial2, name: "Sarah Williams", position: "Investor", initials: "SW", color: "#58bd7d" },
    { text: t.land_testimonial3, name: "Michael Chen", position: "Fund Manager", initials: "MC", color: "#f7931a" },
  ];

  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <div className={`body-rockie ${darkMode ? "is_dark" : ""}`}>
      <RockieHeader isLoggedIn={!!user} user={user} onLogout={logout} darkMode={darkMode} onToggleDarkMode={() => { setDarkMode(prev => { const next = !prev; localStorage.setItem('theme_mode', next ? 'dark' : 'light'); return next; }); }} />

      {/* Banner */}
      <section className="banner">
        <div className="container">
          <div className="row">
            <div className="col-xl-6 col-md-12">
              <div className="banner__content">
                <h2 className="title">{t.land_bannerTitle}</h2>
                <p className="fs-20 desc">{t.land_bannerDesc}</p>
                <Link to="/register" className="btn-action"><span>{t.land_getStarted}</span></Link>
                <div className="stats-row">
                  <div className="stat-item">
                    <h4 className="stat-number">{t.land_stat1}</h4>
                    <p className="stat-label">{t.land_tradingVolume}</p>
                  </div>
                  <div className="stat-item">
                    <h4 className="stat-number">{t.land_stat2}</h4>
                    <p className="stat-label">{t.land_countries}</p>
                  </div>
                  <div className="stat-item">
                    <h4 className="stat-number">{t.land_stat3}</h4>
                    <p className="stat-label">{t.land_verifiedUsers}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-6 col-md-12">
              <div className="banner__image">
                <img src="/assets/images/layout/banner-01.png" alt="Uniswap V4 Trading" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="partners reveal">
        <div className="container">
          <div className="partners__content">
            <h6 className="partners__title">{lang === 'it' ? 'I Nostri Partner' : 'Our Partners'}</h6>
            <div className="partners__list">
              {[
                { name: 'CoinBase', svg: <svg width="120" height="28" viewBox="0 0 120 28"><circle cx="14" cy="14" r="12" fill="currentColor" opacity="0.15"/><circle cx="14" cy="14" r="7" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5"/><text x="32" y="19" fontSize="15" fontWeight="700" fill="currentColor" opacity="0.6">Coinbase</text></svg> },
                { name: 'Blockchain', svg: <svg width="130" height="28" viewBox="0 0 130 28"><rect x="2" y="6" width="16" height="16" rx="3" fill="currentColor" opacity="0.2"/><rect x="8" y="2" width="16" height="16" rx="3" fill="currentColor" opacity="0.15"/><text x="30" y="19" fontSize="14" fontWeight="700" fill="currentColor" opacity="0.6">Blockchain</text></svg> },
                { name: 'MetaMask', svg: <svg width="120" height="28" viewBox="0 0 120 28"><polygon points="14,2 26,10 22,24 6,24 2,10" fill="currentColor" opacity="0.15"/><text x="32" y="19" fontSize="14" fontWeight="700" fill="currentColor" opacity="0.6">MetaMask</text></svg> },
                { name: 'Ledger', svg: <svg width="100" height="28" viewBox="0 0 100 28"><rect x="2" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3"/><rect x="10" y="12" width="12" height="12" fill="currentColor" opacity="0.15"/><text x="28" y="19" fontSize="14" fontWeight="700" fill="currentColor" opacity="0.6">Ledger</text></svg> },
                { name: 'Chainalysis', svg: <svg width="130" height="28" viewBox="0 0 130 28"><circle cx="14" cy="14" r="10" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3"/><path d="M8 14 L14 8 L20 14 L14 20 Z" fill="currentColor" opacity="0.15"/><text x="30" y="19" fontSize="14" fontWeight="700" fill="currentColor" opacity="0.6">Chainalysis</text></svg> },
              ].map((p, i) => (
                <div key={i} className="partner-logo" title={p.name}>
                  {p.svg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Crypto Section - Top Cards */}
      <section className="crypto reveal" id="crypto-section">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="crypto__main">
                <div className="flat-tabs">
                  <ul className="menu-tab">
                    {tabs.map((tab, i) => (
                      <li key={tab} className={activeTab === i ? "active" : ""} onClick={() => setActiveTab(i)}>
                        <h6 className="fs-16">{tab}</h6>
                      </li>
                    ))}
                  </ul>
                  <div className="content-tab">
                    <div className="content-inner active">
                      <div className="crypto-box-list">
                        {cryptoData.map((coin, i) => (
                          <div key={i} className={`crypto-box ${i === 0 ? "active" : ""}`}>
                            <div className="crypto-box-top">
                              <div className="crypto-box-left">
                                <CryptoIcon symbol={coin.symbol} size={40} />
                                <div className="crypto-box-info">
                                  <h6 className="crypto-box-name">{coin.name}</h6>
                                </div>
                              </div>
                              <Sparkline up={coin.up} />
                              <span className={`crypto-box-badge ${coin.up ? "success" : "critical"}`}>{coin.change}</span>
                            </div>
                            <div className="crypto-box-bottom">
                              <h6 className="crypto-box-price">{coin.price}</h6>
                              <span className="crypto-box-pair">{coin.pair}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coin List - Full Trading Table */}
      <section className="coin-list reveal" id="coin-list">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              {/* Main Tabs: Favorites / Derivatives / Spot */}
              <div className="market-main-tabs">
                {marketMainTabs.map((tab, i) => (
                  <button key={tab} className={`market-main-tab ${activeMarketMain === i ? "active" : ""}`} onClick={() => setActiveMarketMain(i)}>
                    {tab}
                  </button>
                ))}
              </div>

              {/* Sub Tabs — only show for Derivatives (index 1) */}
              {activeMarketMain === 1 && (
                <div className="market-sub-tabs">
                  {marketSubTabs.map((tab, i) => (
                    <button key={tab} className={`market-sub-tab ${activeMarketSub === i ? "active" : ""}`} onClick={() => setActiveMarketSub(i)}>
                      {tab}
                    </button>
                  ))}
                </div>
              )}

              {/* Filter Tabs */}
              <div className="market-filter-tabs">
                {marketFilterTabs.map((tab, i) => (
                  <button key={tab} className={`market-filter-tab ${activeMarketFilter === i ? "active" : ""}`} onClick={() => setActiveMarketFilter(i)}>
                    {tab}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="coin-list__main">
                {(() => {
                  // DeFi coins: ETH, ADA, SOL, DOT; NFT: SOL, ETH; New: SOL, DOT, XRP
                  const defiSymbols = ['ETH','ADA','SOL','DOT'];
                  const nftSymbols = ['SOL','ETH','BNB'];
                  const newSymbols = ['SOL','DOT','XRP','ADA'];

                  let displayData = coinListData;

                  // Favorites tab (index 0)
                  if (activeMarketMain === 0) {
                    displayData = coinListData.filter(c => favorites.includes(c.symbol));
                  }

                  // Apply filter tabs
                  if (activeMarketFilter === 1) displayData = displayData.filter(c => newSymbols.includes(c.symbol));
                  else if (activeMarketFilter === 2) displayData = displayData.filter(c => defiSymbols.includes(c.symbol));
                  else if (activeMarketFilter === 3) displayData = displayData.filter(c => nftSymbols.includes(c.symbol));

                  // Sub-tab filters for Derivatives
                  if (activeMarketMain === 1 && activeMarketSub === 1) displayData = displayData.filter(c => ['BTC','ETH','XRP'].includes(c.symbol));
                  else if (activeMarketMain === 1 && activeMarketSub === 2) displayData = displayData.filter(c => ['BTC','ETH','BNB','SOL','USDT'].includes(c.symbol));
                  else if (activeMarketMain === 1 && activeMarketSub === 3) displayData = displayData.filter(c => ['BTC','ETH','DOT','ADA'].includes(c.symbol));

                  if (activeMarketMain === 0 && displayData.length === 0) {
                    return <div style={{textAlign:'center', padding:'40px 0', color:'var(--r-text)', fontSize:14}}>{t.land_noFavorites}</div>;
                  }

                  return (
                    <table className="table market-table">
                      <thead>
                        <tr>
                          <th style={{width:40}}></th>
                          <th style={{width:40}}>#</th>
                          <th>{t.land_tradingPairs}</th>
                          <th>{t.land_lastTraded}</th>
                          <th>{t.land_24hChange}</th>
                          <th>{t.land_24hHigh}</th>
                          <th>{t.land_24hLow}</th>
                          <th>{t.land_24hTurnover}</th>
                          <th>{t.land_chart}</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayData.map((coin, idx) => (
                          <tr key={coin.symbol}>
                            <td>
                              <span
                                className="star-icon"
                                style={{ cursor:'pointer', color: favorites.includes(coin.symbol) ? '#f7931a' : undefined }}
                                onClick={() => toggleFavorite(coin.symbol)}
                              >
                                {favorites.includes(coin.symbol) ? '★' : '☆'}
                              </span>
                            </td>
                            <td>{idx + 1}</td>
                            <td>
                              <div className="td-pair">
                                <CryptoIcon symbol={coin.symbol} size={28} />
                                <span className="coin-name">{coin.name}</span>
                                <span className="coin-symbol">{coin.pair}</span>
                              </div>
                            </td>
                            <td>{coin.lastTraded}</td>
                            <td className={coin.up ? "color-success" : "color-critical"}>{coin.change}</td>
                            <td>{coin.high}</td>
                            <td>{coin.low}</td>
                            <td>{coin.turnover}</td>
                            <td><Sparkline up={coin.up} /></td>
                            <td><Link to="/register" className="btn-trade">{t.land_trade}</Link></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="work reveal" id="how-it-works">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="block-text center">
                <h3 className="heading">{t.land_howItWorks}</h3>
                <p className="fs-20 desc">{t.land_howItWorksDesc}</p>
              </div>
              <div className="work__main">
                <div className="work-box">
                  <div className="image"><span className="work-icon">☁️</span></div>
                  <div className="content">
                    <p className="step">Step 1</p>
                    <span className="title">{t.land_step1}</span>
                    <p className="text">{t.land_step1Desc}</p>
                  </div>
                  <div className="connect-line"></div>
                </div>
                <div className="work-box">
                  <div className="image"><span className="work-icon">👛</span></div>
                  <div className="content">
                    <p className="step">Step 2</p>
                    <span className="title">{t.land_step2}</span>
                    <p className="text">{t.land_step2Desc}</p>
                  </div>
                  <div className="connect-line"></div>
                </div>
                <div className="work-box">
                  <div className="image"><span className="work-icon">⛏️</span></div>
                  <div className="content">
                    <p className="step">Step 3</p>
                    <span className="title">{t.land_step3}</span>
                    <p className="text">{t.land_step3Desc}</p>
                  </div>
                  <div className="connect-line"></div>
                </div>
                <div className="work-box">
                  <div className="image"><span className="work-icon">📊</span></div>
                  <div className="content">
                    <p className="step">Step 4</p>
                    <span className="title">{t.land_step4}</span>
                    <p className="text">{t.land_step4Desc}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about reveal" id="about-section">
        <div className="container">
          <div className="row">
            <div className="col-xl-6 col-md-12">
              <div className="about_image">
                <img className="img-main" src="/assets/images/layout/about-h1.png" alt="About Uniswap V4" />
              </div>
            </div>
            <div className="col-xl-6 col-md-12">
              <div className="about__content">
                <h3 className="heading">{t.land_whatIs}</h3>
                <p className="fs-20 decs">{t.land_whatIsDesc}</p>
                <ul className="list">
                  <li>
                    <h6 className="title"><span className="icon-check-mark">✓</span> {t.land_feature1}</h6>
                    <p className="text">{t.land_feature1Desc}</p>
                  </li>
                  <li>
                    <h6 className="title"><span className="icon-check-mark">✓</span> {t.land_feature2}</h6>
                    <p className="text">{t.land_feature2Desc}</p>
                  </li>
                </ul>
                <Link to="/register" className="btn-action">{t.land_exploreMore}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials reveal" id="testimonials">
        <div className="container">
          <div className="row">
            <div className="col-xl-6 col-md-12">
              <div className="block-text">
                <h3 className="heading">{t.land_testimonialHeading}</h3>
                <h6 className="fs-20">{t.land_testimonialSub}</h6>
                <p>{t.land_testimonialDesc}</p>
                <div className="testimonial-avatars">
                  {testimonials.map((tm, i) => (
                    <div key={i} className={`testimonial-avatar ${activeTestimonial === i ? "active" : ""}`} onClick={() => setActiveTestimonial(i)}>
                      <div className="avatar-initials" style={{background: tm.color}}>{tm.initials}</div>
                    </div>
                  ))}
                </div>
                <div className="couter">
                  <h6>30+</h6>
                  <p className="title">{t.land_customerReviews}</p>
                </div>
              </div>
            </div>
            <div className="col-xl-6 col-md-12">
              <div className="testimonials-box">
                <span className="icon-quote">"</span>
                <h6 className="text">"{testimonials[activeTestimonial].text}"</h6>
                <div className="bottom">
                  <div className="info">
                    <div className="avatar-initials" style={{background: testimonials[activeTestimonial].color}}>{testimonials[activeTestimonial].initials}</div>
                    <div className="content">
                      <h6 className="name">{testimonials[activeTestimonial].name}</h6>
                      <p className="position">{testimonials[activeTestimonial].position}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-sale reveal">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-7">
              <div className="block-text">
                <h4 className="heading">{t.land_ctaTitle}</h4>
                <p className="desc">{t.land_ctaDesc}</p>
              </div>
            </div>
            <div className="col-md-5">
              <div className="sale-button">
                <Link to="/register">{t.land_createAccount}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer__main">
            <div className="row">
              <div className="col-xl-4 col-md-8">
                <div className="info">
                  <Link to="/" className="logo">
                    <span style={{fontSize: '20px', fontWeight: 800, color: '#fff'}}>🦄 Uniswap V4</span>
                  </Link>
                  <h6>{t.land_footerTalk}</h6>
                  <ul className="list">
                    <li><p>info@uniswapv4.com</p></li>
                    <li><p>{t.land_footerSecure}</p></li>
                  </ul>
                </div>
              </div>
              <div className="col-xl-2 col-md-4">
                <div className="widget-link s1">
                  <h6 className="title">{t.land_products}</h6>
                  <ul>
                    <li><a href="#crypto-section">{t.land_spotTrading}</a></li>
                    <li><a href="#crypto-section">{t.land_markets}</a></li>
                    <li><a href="#crypto-section">{t.land_exchange}</a></li>
                  </ul>
                </div>
              </div>
              <div className="col-xl-2 col-md-4">
                <div className="widget-link s2">
                  <h6 className="title">{t.land_services}</h6>
                  <ul>
                    <li><Link to="/register">{t.land_buyCrypto}</Link></li>
                    <li><a href="#crypto-section">{t.land_markets}</a></li>
                    <li><Link to="/register">{t.land_trading}</Link></li>
                  </ul>
                </div>
              </div>
              <div className="col-xl-2 col-md-4">
                <div className="widget-link s3">
                  <h6 className="title">{t.land_support}</h6>
                  <ul>
                    <li><a href="mailto:info@uniswapv4.com">{t.land_helpCenter}</a></li>
                    <li><Link to="/about">{t.land_about}</Link></li>
                    <li><Link to="/privacy">{t.land_privacyPolicy}</Link></li>
                  </ul>
                </div>
              </div>
              <div className="col-xl-2 col-md-4">
                <div className="widget-link s4">
                  <h6 className="title">{t.land_aboutUs}</h6>
                  <ul>
                    <li><Link to="/about">{t.land_about}</Link></li>
                    <li><Link to="/terms">{t.land_termsOfService}</Link></li>
                    <li><a href="mailto:info@uniswapv4.com">{t.land_contact}</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom-bg">
          <div className="footer__bottom">
            <p>{t.land_footerRights.replace('{year}', new Date().getFullYear())}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
