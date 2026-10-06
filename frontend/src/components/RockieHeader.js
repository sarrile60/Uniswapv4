import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_BACKEND_URL;

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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch notifications when logged in
  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const [nRes, cRes] = await Promise.all([
        fetch(`${API}/api/notifications?page_size=5`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API}/api/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      if (nRes.ok) {
        const nData = await nRes.json();
        if (nData.ok) setNotifications(nData.data?.notifications || []);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        if (cData.ok) setUnreadCount(cData.data?.unread_count || 0);
      }
    } catch (e) {
      // Silently fail - notifications are non-critical
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchNotifications();
    if (isLoggedIn) {
      const interval = setInterval(fetchNotifications, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, isLoggedIn]);

  // Mark notification as read
  const markAsRead = async (notifId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API}/api/notifications/${notifId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) { /* ignore */ }
  };

  const handleLogout = () => {
    setActiveDropdown(null);
    if (onLogout) onLogout();
    navigate('/login');
  };

  // Format time ago
  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
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

                {/* Notification Bell with Dropdown */}
                <div className="header-dropdown notification-dropdown" onClick={(e) => { e.stopPropagation(); toggleDropdown('notif'); }} style={{position: 'relative'}}>
                  <div className="header-icon-btn" title="Notifications" style={{cursor: 'pointer', position: 'relative'}} data-testid="notification-bell">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    {unreadCount > 0 && (
                      <span data-testid="notification-badge" style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        background: '#d33535',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 700,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid var(--r-bg, #141416)',
                      }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <div className={`header-dropdown-menu notification-menu ${activeDropdown === 'notif' ? 'show' : ''}`} style={{right: 0, minWidth: 320, maxHeight: 400, overflowY: 'auto', padding: 0}}>
                    <div style={{padding: '14px 16px', borderBottom: '1px solid var(--r-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span style={{fontWeight: 700, fontSize: 15, color: 'var(--r-onsurface)'}}>Notifications</span>
                      {unreadCount > 0 && (
                        <span style={{fontSize: 12, color: '#3772ff', fontWeight: 600}}>{unreadCount} new</span>
                      )}
                    </div>
                    {!isLoggedIn ? (
                      <div style={{padding: '24px 16px', textAlign: 'center', color: 'var(--r-text)', fontSize: 14}}>
                        <Link to="/login" style={{color: '#3772ff', fontWeight: 600}}>Log in</Link> to see notifications
                      </div>
                    ) : notifications.length === 0 ? (
                      <div style={{padding: '32px 16px', textAlign: 'center', color: 'var(--r-text)', fontSize: 14}}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--r-text)" strokeWidth="1.5" style={{margin: '0 auto 8px', display: 'block', opacity: 0.5}}>
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                        No notifications yet
                      </div>
                    ) : (
                      <>
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => !notif.read && markAsRead(notif.id)}
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid var(--r-line)',
                              background: notif.read ? 'transparent' : 'rgba(55, 114, 255, 0.05)',
                              cursor: 'pointer',
                              transition: 'background 0.2s',
                            }}
                          >
                            <div style={{display: 'flex', alignItems: 'flex-start', gap: 10}}>
                              <div style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: notif.read ? 'transparent' : '#3772ff',
                                marginTop: 6,
                                flexShrink: 0,
                              }}/>
                              <div style={{flex: 1, minWidth: 0}}>
                                <div style={{fontSize: 13, fontWeight: 600, color: 'var(--r-onsurface)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                  {notif.title || notif.message?.slice(0, 50) || 'Notification'}
                                </div>
                                <div style={{fontSize: 12, color: 'var(--r-text)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                                  {notif.message}
                                </div>
                                <div style={{fontSize: 11, color: 'var(--r-text)', opacity: 0.7, marginTop: 4}}>
                                  {timeAgo(notif.created_at)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Link
                          to="/wallet"
                          style={{
                            display: 'block',
                            padding: '12px 16px',
                            textAlign: 'center',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#3772ff',
                          }}
                        >
                          View All
                        </Link>
                      </>
                    )}
                  </div>
                </div>

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
