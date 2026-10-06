import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * RockieHeader — Shared header for landing page and all inside pages.
 * Props:
 *   isLoggedIn: boolean — changes avatar/wallet behavior
 *   user: object|null — user data when logged in
 *   onLogout: function — logout handler
 *   darkMode: boolean
 *   onToggleDarkMode: function
 */
const RockieHeader = ({ isLoggedIn = false, user = null, onLogout, darkMode = true, onToggleDarkMode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navigate = useNavigate();

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setActiveDropdown(null);
    if (onLogout) onLogout();
    navigate('/login');
  };

  return (
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
                      <li className="menu-item menu-item-has-children" onClick={(e) => { e.stopPropagation(); toggleDropdown('buy'); }}>
                        <a href="#!">Buy Crypto</a>
                        <ul className={`sub-menu ${activeDropdown === 'buy' ? 'show' : ''}`}>
                          <li className="menu-item"><Link to={isLoggedIn ? "/wallet" : "/register"}>Buy Crypto Select</Link></li>
                          <li className="menu-item"><Link to={isLoggedIn ? "/wallet" : "/register"}>Buy Crypto Confirm</Link></li>
                          <li className="menu-item"><Link to={isLoggedIn ? "/wallet" : "/register"}>Buy Crypto Details</Link></li>
                        </ul>
                      </li>
                      <li className="menu-item">
                        <Link to={isLoggedIn ? "/wallet" : "/#crypto-section"}>Markets</Link>
                      </li>
                      <li className="menu-item menu-item-has-children" onClick={(e) => { e.stopPropagation(); toggleDropdown('sell'); }}>
                        <a href="#!">Sell Crypto</a>
                        <ul className={`sub-menu ${activeDropdown === 'sell' ? 'show' : ''}`}>
                          <li className="menu-item"><Link to={isLoggedIn ? "/wallet" : "/register"}>Sell Crypto Select</Link></li>
                          <li className="menu-item"><Link to={isLoggedIn ? "/wallet" : "/register"}>Sell Crypto Confirm</Link></li>
                          <li className="menu-item"><Link to={isLoggedIn ? "/wallet" : "/register"}>Sell Crypto Details</Link></li>
                        </ul>
                      </li>
                      <li className="menu-item">
                        <Link to={isLoggedIn ? "/wallet" : "/#about-section"}>Blog</Link>
                      </li>
                      <li className="menu-item bitusdt-item">
                        <Link to={isLoggedIn ? "/wallet" : "/register"}>
                          BITUSDT
                          <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginLeft:'4px',verticalAlign:'middle'}}>
                            <path d="M6.76 3.2C6.69 3.14 6.6 3.11 6.51 3.12C6.42 3.14 6.34 3.19 6.3 3.28C6.15 3.56 5.96 3.82 5.74 4.05C5.77 3.89 5.78 3.72 5.78 3.55C5.78 3.23 5.73 2.9 5.65 2.56C5.37 1.47 4.63 0.55 3.63 0.03C3.54-0.01 3.44-0.01 3.35 0.04C3.27 0.08 3.21 0.17 3.2 0.27C3.13 1.26 2.62 2.16 1.8 2.75L1.71 2.81C1.19 3.19 0.77 3.67 0.48 4.23C0.19 4.8 0.04 5.41 0.04 6.04C0.04 6.36 0.08 6.69 0.17 7.03C0.62 8.78 2.19 10 4 10C6.18 10 7.96 8.22 7.96 6.04C7.96 4.96 7.53 3.95 6.76 3.2Z" fill="#3772FF"/>
                          </svg>
                        </Link>
                      </li>
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
                <div className="header-dropdown" onClick={(e) => { e.stopPropagation(); toggleDropdown('assets'); }}>
                  <button className="header-dropdown-btn">Assets</button>
                  <div className={`header-dropdown-menu ${activeDropdown === 'assets' ? 'show' : ''}`}>
                    <Link to={isLoggedIn ? "/wallet" : "/register"} className="dropdown-item">Visa Card</Link>
                    <Link to={isLoggedIn ? "/wallet" : "/register"} className="dropdown-item">Crypto Loans</Link>
                    <Link to={isLoggedIn ? "/wallet" : "/register"} className="dropdown-item">Pay</Link>
                  </div>
                </div>
                <div className="header-dropdown" onClick={(e) => { e.stopPropagation(); toggleDropdown('orders'); }}>
                  <button className="header-dropdown-btn">Orders & Trades</button>
                  <div className={`header-dropdown-menu ${activeDropdown === 'orders' ? 'show' : ''}`}>
                    <Link to={isLoggedIn ? "/transactions" : "/register"} className="dropdown-item">Convert</Link>
                    <Link to={isLoggedIn ? "/transactions" : "/register"} className="dropdown-item">Spot</Link>
                    <Link to={isLoggedIn ? "/transactions" : "/register"} className="dropdown-item">Margin</Link>
                    <Link to={isLoggedIn ? "/transactions" : "/register"} className="dropdown-item">P2P</Link>
                  </div>
                </div>
                <div className="header-dropdown" onClick={(e) => { e.stopPropagation(); toggleDropdown('lang'); }}>
                  <button className="header-dropdown-btn">EN/USD</button>
                  <div className={`header-dropdown-menu ${activeDropdown === 'lang' ? 'show' : ''}`}>
                    <span className="dropdown-item">English / USD</span>
                    <span className="dropdown-item">Italiano / EUR</span>
                  </div>
                </div>

                {/* Dark/Light Mode */}
                <div className="mode-switcher" onClick={onToggleDarkMode}>
                  {darkMode ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 15C12.7614 15 15 12.7614 15 10C15 7.23858 12.7614 5 10 5C7.23858 5 5 7.23858 5 10C5 12.7614 7.23858 15 10 15Z" stroke="currentColor" strokeWidth="2"/><path d="M10 1V3M10 17V19M1 10H3M17 10H19M3.93 3.93L5.34 5.34M14.66 14.66L16.07 16.07M3.93 16.07L5.34 14.66M14.66 5.34L16.07 3.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </div>

                {/* Notification Bell */}
                <Link to={isLoggedIn ? "/wallet" : "/login"} className="header-icon-btn" title="Notifications">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </Link>

                {/* Wallet Button */}
                <Link to={isLoggedIn ? "/wallet" : "/login"} className="header-wallet-btn">Wallet</Link>

                {/* User Avatar / Profile */}
                {isLoggedIn ? (
                  <div className="header-dropdown" onClick={(e) => { e.stopPropagation(); toggleDropdown('user'); }}>
                    <div className="header-avatar" style={{cursor:'pointer'}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div className={`header-dropdown-menu ${activeDropdown === 'user' ? 'show' : ''}`} style={{right:0, minWidth: '180px'}}>
                      {user && <div className="dropdown-item" style={{fontWeight:700, color:'var(--r-onsurface)', cursor:'default', borderBottom:'1px solid var(--r-line)', paddingBottom:'12px', marginBottom:'4px'}}>{user.first_name} {user.last_name}</div>}
                      <Link to="/wallet" className="dropdown-item">💰 Wallet</Link>
                      <Link to="/transactions" className="dropdown-item">📋 Transactions</Link>
                      <Link to="/profile" className="dropdown-item">👤 Profile</Link>
                      <Link to="/kyc" className="dropdown-item">🔒 KYC Verification</Link>
                      <div className="dropdown-item" onClick={handleLogout} style={{color:'#d33535', cursor:'pointer', borderTop:'1px solid var(--r-line)', marginTop:'4px', paddingTop:'12px'}}>🚪 Logout</div>
                    </div>
                  </div>
                ) : (
                  <Link to="/login" className="header-avatar" title="Profile">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </Link>
                )}

                <div className={`mobile-button ${mobileMenuOpen ? "active" : ""}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default RockieHeader;
