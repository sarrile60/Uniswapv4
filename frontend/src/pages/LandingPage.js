import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [activeCoinTab, setActiveCoinTab] = useState(0);

  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("is_dark");
    } else {
      document.body.classList.remove("is_dark");
    }
    return () => document.body.classList.remove("is_dark");
  }, [darkMode]);

  // SVG coin icons as inline components
  const CoinIcon = ({ symbol, size = 32 }) => {
    const colors = { BTC: '#f7931a', ETH: '#627eea', BNB: '#f3ba2f', USDT: '#26a17b', ADA: '#0033ad', SOL: '#9945ff', XRP: '#23292f', DOT: '#e6007a' };
    const bg = colors[symbol] || '#3772ff';
    return (
      <span className="coin-icon-circle" style={{ width: size, height: size, background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: '#fff', fontSize: size * 0.4, fontWeight: 800, flexShrink: 0 }}>
        {symbol.charAt(0)}
      </span>
    );
  };

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

  const cryptoData = [
    { symbol: "BTC", name: "Bitcoin", pair: "BTC", price: "USD 53,260.20", change: "+7.2%", up: true },
    { symbol: "ETH", name: "Ethereum", pair: "ETH", price: "USD 53,260.20", change: "-1.8%", up: false },
    { symbol: "USDT", name: "Tether", pair: "USDT", price: "USD 53,260.20", change: "+3.54%", up: true },
    { symbol: "BNB", name: "Binance", pair: "BNB", price: "USD 53,260.20", change: "+3.24%", up: true },
  ];

  const coinListData = [
    { rank: 1, symbol: "BTC", name: "Bitcoin", pair: "BTC", lastTraded: "2.236", change: "-3.33%", up: false, high: "62,749.00", low: "57,600.00", turnover: "5.04B(USD)" },
    { rank: 2, symbol: "ETH", name: "Ethereum", pair: "ETH", lastTraded: "2.236", change: "-3.33%", up: false, high: "62,749.00", low: "57,600.00", turnover: "5.04B(USD)" },
    { rank: 3, symbol: "BNB", name: "BNB", pair: "BNB/USD", lastTraded: "2.236", change: "-3.33%", up: false, high: "62,749.00", low: "57,600.00", turnover: "5.04B(USD)" },
    { rank: 4, symbol: "USDT", name: "Tether", pair: "USDT/USD", lastTraded: "2.236", change: "-3.33%", up: false, high: "62,749.00", low: "57,600.00", turnover: "5.04B(USD)" },
    { rank: 5, symbol: "ADA", name: "Cardano", pair: "ADA", lastTraded: "2.236", change: "-3.33%", up: false, high: "62,749.00", low: "57,600.00", turnover: "5.04B(USD)" },
    { rank: 6, symbol: "SOL", name: "Solana", pair: "SOL", lastTraded: "2.236", change: "+5.31%", up: true, high: "62,749.00", low: "57,600.00", turnover: "5.04B(USD)" },
    { rank: 7, symbol: "XRP", name: "XRP", pair: "XRP", lastTraded: "2.236", change: "+2.10%", up: true, high: "62,749.00", low: "57,600.00", turnover: "5.04B(USD)" },
    { rank: 8, symbol: "DOT", name: "Polkadot", pair: "DOT", lastTraded: "2.236", change: "-1.85%", up: false, high: "62,749.00", low: "57,600.00", turnover: "5.04B(USD)" },
  ];

  const tabs = ["Crypto", "DeFi", "BSC", "NFT", "Metaverse", "Polkadot", "Solana", "Opensea", "Makersplace"];
  const marketMainTabs = ["Favorites", "Derivatives", "Spot"];
  const marketSubTabs = ["All", "Inverse Perpetual", "USDT Perpetual", "Inverse Futures"];
  const marketFilterTabs = ["Hot", "New", "DeFi", "NFT"];
  const [activeMarketMain, setActiveMarketMain] = useState(1); // Derivatives active
  const [activeMarketSub, setActiveMarketSub] = useState(0);
  const [activeMarketFilter, setActiveMarketFilter] = useState(0);

  const testimonials = [
    { text: "This platform has completely transformed how I manage my crypto portfolio. The interface is clean and transactions are lightning fast.", name: "Alex Johnson", position: "Crypto Trader", avatar: null, initials: "AJ", color: "#3772ff" },
    { text: "I've tried dozens of exchanges and this is by far the most user-friendly. Customer support is exceptional and security features give me peace of mind.", name: "Sarah Williams", position: "Investor", avatar: null, initials: "SW", color: "#58bd7d" },
    { text: "The trading tools are professional-grade yet accessible to beginners. I've recommended this platform to everyone I know in the crypto space.", name: "Michael Chen", position: "Fund Manager", avatar: null, initials: "MC", color: "#f7931a" },
  ];

  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <div className={`body-rockie ${darkMode ? "is_dark" : ""}`}>
      {/* Header */}
      <header id="header_main" className="header">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="header__body d-flex justify-content-between">
                <div className="header__left">
                  <div className="logo">
                    <Link className="light" to="/">
                      <span className="logo-text" style={{fontSize: '24px', fontWeight: 800, color: '#3772ff', letterSpacing: '-0.5px'}}>
                        <span style={{color: '#3772ff'}}>🦄</span> Uniswap V4
                      </span>
                    </Link>
                    <Link className="dark" to="/">
                      <span className="logo-text" style={{fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px'}}>
                        <span style={{color: '#3772ff'}}>🦄</span> Uniswap V4
                      </span>
                    </Link>
                  </div>
                  <div className="left__main">
                    <nav id="main-nav" className={`main-nav ${mobileMenuOpen ? "active" : ""}`}>
                      <ul id="menu-primary-menu" className="menu">
                        {/* Buy Crypto Dropdown */}
                        <li className="menu-item menu-item-has-children" onClick={(e) => { e.stopPropagation(); toggleDropdown('buy'); }}>
                          <a href="#!">Buy Crypto</a>
                          <ul className={`sub-menu ${activeDropdown === 'buy' ? 'show' : ''}`}>
                            <li className="menu-item"><Link to="/register">Buy Crypto Select</Link></li>
                            <li className="menu-item"><Link to="/register">Buy Crypto Confirm</Link></li>
                            <li className="menu-item"><Link to="/register">Buy Crypto Details</Link></li>
                          </ul>
                        </li>

                        {/* Markets */}
                        <li className="menu-item">
                          <a href="#crypto-section">Markets</a>
                        </li>

                        {/* Sell Crypto Dropdown */}
                        <li className="menu-item menu-item-has-children" onClick={(e) => { e.stopPropagation(); toggleDropdown('sell'); }}>
                          <a href="#!">Sell Crypto</a>
                          <ul className={`sub-menu ${activeDropdown === 'sell' ? 'show' : ''}`}>
                            <li className="menu-item"><Link to="/register">Sell Crypto Select</Link></li>
                            <li className="menu-item"><Link to="/register">Sell Crypto Confirm</Link></li>
                            <li className="menu-item"><Link to="/register">Sell Crypto Details</Link></li>
                          </ul>
                        </li>

                        {/* Blog */}
                        <li className="menu-item">
                          <a href="#about-section">Blog</a>
                        </li>

                        {/* BITUSDT Hot Pair */}
                        <li className="menu-item bitusdt-item">
                          <Link to="/register">
                            BITUSDT
                            <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginLeft: '4px', verticalAlign: 'middle', marginBottom: '2px'}}>
                              <path d="M6.76 3.2C6.69 3.14 6.6 3.11 6.51 3.12C6.42 3.14 6.34 3.19 6.3 3.28C6.15 3.56 5.96 3.82 5.74 4.05C5.77 3.89 5.78 3.72 5.78 3.55C5.78 3.23 5.73 2.9 5.65 2.56C5.37 1.47 4.63 0.55 3.63 0.03C3.54-0.01 3.44-0.01 3.35 0.04C3.27 0.08 3.21 0.17 3.2 0.27C3.13 1.26 2.62 2.16 1.8 2.75L1.71 2.81C1.19 3.19 0.77 3.67 0.48 4.23C0.19 4.8 0.04 5.41 0.04 6.04C0.04 6.36 0.08 6.69 0.17 7.03C0.62 8.78 2.19 10 4 10C6.18 10 7.96 8.22 7.96 6.04C7.96 4.96 7.53 3.95 6.76 3.2Z" fill="#3772FF"/>
                            </svg>
                          </Link>
                        </li>

                        {/* Pages Dropdown */}
                        <li className="menu-item menu-item-has-children" onClick={(e) => { e.stopPropagation(); toggleDropdown('pages'); }}>
                          <a href="#!">Pages</a>
                          <ul className={`sub-menu ${activeDropdown === 'pages' ? 'show' : ''}`}>
                            <li className="menu-item"><Link to="/about">About</Link></li>
                            <li className="menu-item"><Link to="/login">Login</Link></li>
                            <li className="menu-item"><Link to="/register">Register</Link></li>
                            <li className="menu-item"><a href="mailto:info@uniswapv4.com">Contact</a></li>
                            <li className="menu-item"><Link to="/terms">FAQ</Link></li>
                          </ul>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>

                <div className="header__right">
                  {/* Assets Dropdown */}
                  <div className="header-dropdown" onClick={(e) => { e.stopPropagation(); toggleDropdown('assets'); }}>
                    <button className="header-dropdown-btn">Assets</button>
                    <div className={`header-dropdown-menu ${activeDropdown === 'assets' ? 'show' : ''}`}>
                      <Link to="/register" className="dropdown-item">Visa Card</Link>
                      <Link to="/register" className="dropdown-item">Crypto Loans</Link>
                      <Link to="/register" className="dropdown-item">Pay</Link>
                    </div>
                  </div>

                  {/* Orders & Trades Dropdown */}
                  <div className="header-dropdown" onClick={(e) => { e.stopPropagation(); toggleDropdown('orders'); }}>
                    <button className="header-dropdown-btn">Orders & Trades</button>
                    <div className={`header-dropdown-menu ${activeDropdown === 'orders' ? 'show' : ''}`}>
                      <Link to="/register" className="dropdown-item">Convert</Link>
                      <Link to="/register" className="dropdown-item">Spot</Link>
                      <Link to="/register" className="dropdown-item">Margin</Link>
                      <Link to="/register" className="dropdown-item">P2P</Link>
                    </div>
                  </div>

                  {/* EN/USD Selector */}
                  <div className="header-dropdown" onClick={(e) => { e.stopPropagation(); toggleDropdown('lang'); }}>
                    <button className="header-dropdown-btn">EN/USD</button>
                    <div className={`header-dropdown-menu ${activeDropdown === 'lang' ? 'show' : ''}`}>
                      <span className="dropdown-item">English / USD</span>
                      <span className="dropdown-item">Italiano / EUR</span>
                    </div>
                  </div>

                  {/* Dark/Light Mode Toggle */}
                  <div className="mode-switcher" onClick={() => setDarkMode(!darkMode)}>
                    {darkMode ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 15C12.7614 15 15 12.7614 15 10C15 7.23858 12.7614 5 10 5C7.23858 5 5 7.23858 5 10C5 12.7614 7.23858 15 10 15Z" stroke="currentColor" strokeWidth="2"/>
                        <path d="M10 1V3M10 17V19M1 10H3M17 10H19M3.93 3.93L5.34 5.34M14.66 14.66L16.07 16.07M3.93 16.07L5.34 14.66M14.66 5.34L16.07 3.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  {/* Notification Bell */}
                  <Link to="/login" className="header-icon-btn" title="Notifications">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                  </Link>

                  {/* Wallet Button */}
                  <Link to="/login" className="header-wallet-btn">Wallet</Link>

                  {/* User Avatar */}
                  <Link to="/login" className="header-avatar" title="Profile">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </Link>

                  {/* Mobile Hamburger */}
                  <div className={`mobile-button ${mobileMenuOpen ? "active" : ""}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Banner */}
      <section className="banner">
        <div className="container">
          <div className="row">
            <div className="col-xl-6 col-md-12">
              <div className="banner__content">
                <h2 className="title">Buy & Sell Digital Assets In The Uniswap V4</h2>
                <p className="fs-20 desc">
                  The easiest, safest, and fastest way to buy & sell crypto assets on a trusted exchange platform.
                </p>
                <Link to="/register" className="btn-action"><span>Get started now</span></Link>
                <div className="stats-row">
                  <div className="stat-item">
                    <h4 className="stat-number">$30B+</h4>
                    <p className="stat-label">Trading Volume</p>
                  </div>
                  <div className="stat-item">
                    <h4 className="stat-number">100+</h4>
                    <p className="stat-label">Countries</p>
                  </div>
                  <div className="stat-item">
                    <h4 className="stat-number">10M+</h4>
                    <p className="stat-label">Verified Users</p>
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

      {/* Crypto Section - Top Cards */}
      <section className="crypto" id="crypto-section">
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
                                <CoinIcon symbol={coin.symbol} size={40} />
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
      <section className="coin-list" id="coin-list">
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

              {/* Sub Tabs: All / Inverse Perpetual / etc. */}
              <div className="market-sub-tabs">
                {marketSubTabs.map((tab, i) => (
                  <button key={tab} className={`market-sub-tab ${activeMarketSub === i ? "active" : ""}`} onClick={() => setActiveMarketSub(i)}>
                    {tab}
                  </button>
                ))}
              </div>

              {/* Filter Tabs: Hot / New / DeFi / NFT */}
              <div className="market-filter-tabs">
                {marketFilterTabs.map((tab, i) => (
                  <button key={tab} className={`market-filter-tab ${activeMarketFilter === i ? "active" : ""}`} onClick={() => setActiveMarketFilter(i)}>
                    {tab}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="coin-list__main">
                <table className="table market-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>#</th>
                      <th>Trading Pairs</th>
                      <th>Last Traded</th>
                      <th>24H Change%</th>
                      <th>24H High</th>
                      <th>24H Low</th>
                      <th>24H Turnover</th>
                      <th>Chart</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {coinListData.map((coin) => (
                      <tr key={coin.rank}>
                        <td><span className="star-icon">☆</span></td>
                        <td>{coin.rank}</td>
                        <td className="td-pair">
                          <CoinIcon symbol={coin.symbol} size={28} />
                          <span className="coin-name">{coin.name}</span>
                          <span className="coin-symbol">{coin.pair}</span>
                        </td>
                        <td>{coin.lastTraded}</td>
                        <td className={coin.up ? "color-success" : "color-critical"}>{coin.change}</td>
                        <td>{coin.high}</td>
                        <td>{coin.low}</td>
                        <td>{coin.turnover}</td>
                        <td><Sparkline up={coin.up} /></td>
                        <td><Link to="/register" className="btn-trade">Trade</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="work" id="how-it-works">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="block-text center">
                <h3 className="heading">How It Works</h3>
                <p className="fs-20 desc">
                  Get started in just a few simple steps and begin trading cryptocurrency today.
                </p>
              </div>
              <div className="work__main">
                <div className="work-box">
                  <div className="image">
                    <span className="work-icon">☁️</span>
                  </div>
                  <div className="content">
                    <p className="step">Step 1</p>
                    <span className="title">Create Account</span>
                    <p className="text">Sign up with your email and verify your identity to get started.</p>
                  </div>
                  <div className="connect-line"></div>
                </div>
                <div className="work-box">
                  <div className="image">
                    <span className="work-icon">👛</span>
                  </div>
                  <div className="content">
                    <p className="step">Step 2</p>
                    <span className="title">Connect Wallet</span>
                    <p className="text">Link your wallet to securely manage and store your digital assets.</p>
                  </div>
                  <div className="connect-line"></div>
                </div>
                <div className="work-box">
                  <div className="image">
                    <span className="work-icon">⛏️</span>
                  </div>
                  <div className="content">
                    <p className="step">Step 3</p>
                    <span className="title">Start Trading</span>
                    <p className="text">Buy, sell, and trade cryptocurrencies with competitive fees.</p>
                  </div>
                  <div className="connect-line"></div>
                </div>
                <div className="work-box">
                  <div className="image">
                    <span className="work-icon">📊</span>
                  </div>
                  <div className="content">
                    <p className="step">Step 4</p>
                    <span className="title">Earn Money</span>
                    <p className="text">Grow your portfolio with smart trades and market insights.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about" id="about-section">
        <div className="container">
          <div className="row">
            <div className="col-xl-6 col-md-12">
              <div className="about_image">
                <img className="img-main" src="/assets/images/layout/about-h1.png" alt="About Uniswap V4" />
              </div>
            </div>
            <div className="col-xl-6 col-md-12">
              <div className="about__content">
                <h3 className="heading">What Is Uniswap V4</h3>
                <p className="fs-20 decs">
                  Experience a variety of trading on our platform. You can use various types of coin transactions including Spot Trade, Futures Trade, P2P, Staking, and more.
                </p>
                <ul className="list">
                  <li>
                    <h6 className="title">
                      <span className="icon-check-mark">✓</span> View real-time cryptocurrency prices
                    </h6>
                    <p className="text">
                      Track live prices and market movements across hundreds of cryptocurrency pairs with professional charting tools.
                    </p>
                  </li>
                  <li>
                    <h6 className="title">
                      <span className="icon-check-mark">✓</span> Buy and sell BTC, ETH, USDC, and more
                    </h6>
                    <p className="text">
                      Trade the most popular digital assets with competitive fees, deep liquidity, and instant execution.
                    </p>
                  </li>
                </ul>
                <Link to="/register" className="btn-action">Explore More</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials" id="testimonials">
        <div className="container">
          <div className="row">
            <div className="col-xl-6 col-md-12">
              <div className="block-text">
                <h3 className="heading">Our customers love what we do</h3>
                <h6 className="fs-20">Transform your portfolio with Uniswap V4</h6>
                <p>Trusted by thousands of traders worldwide. Here's what our users have to say about their experience.</p>
                <div className="testimonial-avatars">
                  {testimonials.map((t, i) => (
                    <div key={i} className={`testimonial-avatar ${activeTestimonial === i ? "active" : ""}`} onClick={() => setActiveTestimonial(i)}>
                      <div className="avatar-initials" style={{background: t.color}}>{t.initials}</div>
                    </div>
                  ))}
                </div>
                <div className="couter">
                  <h6>30+</h6>
                  <p className="title">Customer Reviews</p>
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
      <section className="section-sale">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-7">
              <div className="block-text">
                <h4 className="heading">Earn up to $25 worth of crypto</h4>
                <p className="desc">Discover how specific cryptocurrencies work — and get a bit of each crypto to try out for yourself.</p>
              </div>
            </div>
            <div className="col-md-5">
              <div className="sale-button">
                <Link to="/register">Create Account</Link>
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
                  <h6>Let's talk! 🤙</h6>
                  <ul className="list">
                    <li><p>info@uniswapv4.com</p></li>
                    <li><p>Secure Digital Asset Exchange</p></li>
                  </ul>
                </div>
              </div>
              <div className="col-xl-2 col-md-4">
                <div className="widget-link s1">
                  <h6 className="title">PRODUCTS</h6>
                  <ul>
                    <li><a href="#crypto-section">Spot Trading</a></li>
                    <li><a href="#crypto-section">Markets</a></li>
                    <li><a href="#crypto-section">Exchange</a></li>
                  </ul>
                </div>
              </div>
              <div className="col-xl-2 col-md-4">
                <div className="widget-link s2">
                  <h6 className="title">SERVICES</h6>
                  <ul>
                    <li><Link to="/register">Buy Crypto</Link></li>
                    <li><a href="#crypto-section">Markets</a></li>
                    <li><Link to="/register">Trading</Link></li>
                  </ul>
                </div>
              </div>
              <div className="col-xl-2 col-md-4">
                <div className="widget-link s3">
                  <h6 className="title">SUPPORT</h6>
                  <ul>
                    <li><a href="mailto:info@uniswapv4.com">Help Center</a></li>
                    <li><Link to="/about">About Us</Link></li>
                    <li><Link to="/privacy">Privacy Policy</Link></li>
                  </ul>
                </div>
              </div>
              <div className="col-xl-2 col-md-4">
                <div className="widget-link s4">
                  <h6 className="title">ABOUT US</h6>
                  <ul>
                    <li><Link to="/about">About</Link></li>
                    <li><Link to="/terms">Terms of Service</Link></li>
                    <li><a href="mailto:info@uniswapv4.com">Contact</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom-bg">
          <div className="footer__bottom">
            <p>© {new Date().getFullYear()} Uniswap V4. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
