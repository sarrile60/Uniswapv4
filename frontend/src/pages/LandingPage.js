import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [activeCoinTab, setActiveCoinTab] = useState(0);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("is_dark");
    } else {
      document.body.classList.remove("is_dark");
    }
    return () => document.body.classList.remove("is_dark");
  }, [darkMode]);

  const cryptoData = [
    { icon: "🟡", name: "Bitcoin", symbol: "BTC/USDT", price: "$56,623.54", prev: "$1,285", change: "-0.79%", down: true },
    { icon: "🔵", name: "Ethereum", symbol: "ETH/USDT", price: "$2,146.65", prev: "$1,285", change: "+10.55%", down: false },
    { icon: "🔴", name: "Binance", symbol: "BNB/USDT", price: "$443.56", prev: "$1,285", change: "-0.01%", down: true },
    { icon: "⚪", name: "Tether", symbol: "USDT/USDT", price: "$1.00", prev: "$1,285", change: "-1.24%", down: true },
    { icon: "🟠", name: "Solana", symbol: "SOL/USDT", price: "$150.20", prev: "$1,285", change: "+5.31%", down: false },
  ];

  const coinListData = [
    { rank: 1, icon: "🟡", name: "Bitcoin", symbol: "BTC", price: "$56,623.54", change: "+1.45%", up: true, cap: "$880,423,640,582" },
    { rank: 2, icon: "🔵", name: "Ethereum", symbol: "ETH", price: "$2,146.65", change: "+10.55%", up: true, cap: "$350,123,456,789" },
    { rank: 3, icon: "🔴", name: "Binance Coin", symbol: "BNB", price: "$443.56", change: "-3.75%", up: false, cap: "$68,345,678,901" },
    { rank: 4, icon: "⚪", name: "Tether", symbol: "USDT", price: "$1.00", change: "+0.01%", up: true, cap: "$45,678,901,234" },
    { rank: 5, icon: "🟣", name: "Cardano", symbol: "ADA", price: "$1.48", change: "-2.22%", up: false, cap: "$40,123,456,789" },
    { rank: 6, icon: "🟠", name: "Solana", symbol: "SOL", price: "$150.20", change: "+5.31%", up: true, cap: "$38,987,654,321" },
    { rank: 7, icon: "🔵", name: "XRP", symbol: "XRP", price: "$0.85", change: "+2.10%", up: true, cap: "$35,456,789,012" },
    { rank: 8, icon: "🟡", name: "Polkadot", symbol: "DOT", price: "$28.30", change: "-1.85%", up: false, cap: "$28,123,456,789" },
  ];

  const tabs = ["Crypto", "DeFi", "BSC", "NFT", "Metaverse", "Polkadot", "Solana", "Opensea", "Makersplace"];
  const coinTabs = ["View All", "Metaverse", "Entertainment", "Energy", "NFT", "Gaming", "Music"];

  const testimonials = [
    { text: "This platform has completely transformed how I manage my crypto portfolio. The interface is clean and transactions are lightning fast.", name: "Alex Johnson", position: "Crypto Trader", avatar: "/assets/images/avt/avt-02.png" },
    { text: "I've tried dozens of exchanges and this is by far the most user-friendly. Customer support is exceptional and security features give me peace of mind.", name: "Sarah Williams", position: "Investor", avatar: "/assets/images/avt/avt-03.png" },
    { text: "The trading tools are professional-grade yet accessible to beginners. I've recommended this platform to everyone I know in the crypto space.", name: "Michael Chen", position: "Fund Manager", avatar: "/assets/images/avt/avt-04.png" },
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
                      <img src="/assets/images/logo/logo.png" alt="Uniswap V4" width="118" height="32" />
                    </Link>
                    <Link className="dark" to="/">
                      <img src="/assets/images/logo/logo-dark.png" alt="Uniswap V4" width="118" height="32" />
                    </Link>
                  </div>
                  <div className="left__main">
                    <nav id="main-nav" className={`main-nav ${mobileMenuOpen ? "active" : ""}`}>
                      <ul id="menu-primary-menu" className="menu">
                        <li className="menu-item current-menu-item">
                          <Link to="/">Homepage</Link>
                        </li>
                        <li className="menu-item">
                          <a href="#crypto-section">Markets</a>
                        </li>
                        <li className="menu-item">
                          <a href="#how-it-works">How It Works</a>
                        </li>
                        <li className="menu-item">
                          <a href="#about-section">About</a>
                        </li>
                        <li className="menu-item">
                          <a href="#testimonials">Testimonials</a>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>

                <div className="header__right">
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
                  <div className="header-btns">
                    <Link to="/login" className="btn-login">Login</Link>
                    <Link to="/register" className="btn-register">Register</Link>
                  </div>
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
                <div className="partner">
                  <h6>Our Partners</h6>
                  <div className="partner__list">
                    <div className="partner-scroll">
                      {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="partner-item">
                          <img src={`/assets/images/partner/logo-0${i}.png`} alt={`Partner ${i}`} />
                        </div>
                      ))}
                    </div>
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

      {/* Crypto Section */}
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
                          <div key={i} className={`crypto-box ${i === 1 ? "active" : ""}`}>
                            <div className="top">
                              <span className="crypto-icon">{coin.icon}</span>
                              <div>
                                <h6>{coin.name}</h6>
                                <p className="unit">{coin.symbol}</p>
                              </div>
                            </div>
                            <h6 className="price">{coin.price}</h6>
                            <div className="bottom-info">
                              <p className="prev-price">{coin.prev}</p>
                              <p className={`sale ${coin.down ? "critical" : "success"}`}>{coin.change}</p>
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

      {/* Coin List */}
      <section className="coin-list" id="coin-list">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="block-text center">
                <h3 className="heading">Market Update</h3>
                <p className="fs-20 desc">Cryptocurrency market in real-time</p>
              </div>
              <div className="coin-list__main">
                <div className="flat-tabs">
                  <ul className="menu-tab">
                    {coinTabs.map((tab, i) => (
                      <li key={tab} className={activeCoinTab === i ? "active" : ""} onClick={() => setActiveCoinTab(i)}>
                        <h6 className="fs-16">{tab}</h6>
                      </li>
                    ))}
                  </ul>
                  <div className="content-tab">
                    <div className="content-inner active">
                      <table className="table">
                        <thead>
                          <tr>
                            <th scope="col">#</th>
                            <th scope="col">Name</th>
                            <th scope="col">Last Price</th>
                            <th scope="col">24h %</th>
                            <th scope="col">Market Cap</th>
                            <th scope="col"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {coinListData.map((coin) => (
                            <tr key={coin.rank}>
                              <td>{coin.rank}</td>
                              <td>
                                <span className="crypto-icon">{coin.icon}</span>
                                <span className="coin-name">{coin.name}</span>
                                <span className="coin-symbol">{coin.symbol}</span>
                              </td>
                              <td>{coin.price}</td>
                              <td className={coin.up ? "color-success" : "color-critical"}>{coin.change}</td>
                              <td>{coin.cap}</td>
                              <td><Link to="/register" className="btn-trade">Trade</Link></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
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
                    <img src="/assets/images/icon/Cloud.png" alt="Download" />
                  </div>
                  <div className="content">
                    <p className="step">Step 1</p>
                    <span className="title">Create Account</span>
                    <p className="text">Sign up with your email and verify your identity to get started.</p>
                  </div>
                  <img className="line" src="/assets/images/icon/connect-line.png" alt="" />
                </div>
                <div className="work-box">
                  <div className="image">
                    <img src="/assets/images/icon/Wallet.png" alt="Wallet" />
                  </div>
                  <div className="content">
                    <p className="step">Step 2</p>
                    <span className="title">Connect Wallet</span>
                    <p className="text">Link your wallet to securely manage and store your digital assets.</p>
                  </div>
                  <img className="line" src="/assets/images/icon/connect-line.png" alt="" />
                </div>
                <div className="work-box">
                  <div className="image">
                    <img src="/assets/images/icon/Mining.png" alt="Trading" />
                  </div>
                  <div className="content">
                    <p className="step">Step 3</p>
                    <span className="title">Start Trading</span>
                    <p className="text">Buy, sell, and trade cryptocurrencies with competitive fees.</p>
                  </div>
                  <img className="line" src="/assets/images/icon/connect-line.png" alt="" />
                </div>
                <div className="work-box">
                  <div className="image">
                    <img src="/assets/images/icon/Comparison.png" alt="Earn" />
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
                <img className="icon icon-1" src="/assets/images/icon/icon-01.png" alt="" />
                <img className="icon icon-2" src="/assets/images/icon/icon-02.png" alt="" />
                <img className="icon icon-3" src="/assets/images/icon/icon-03.png" alt="" />
                <img className="icon icon-4" src="/assets/images/icon/icon-04.png" alt="" />
                <img className="icon icon-5" src="/assets/images/icon/icon-05.png" alt="" />
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

      {/* Download Section */}
      <section className="download">
        <div className="container">
          <div className="row">
            <div className="col-xl-6 col-md-12">
              <div className="download__content">
                <h3 className="heading">Free your money & Invest with confidence</h3>
                <p className="fs-20 decs">
                  With Uniswap V4, you can be sure your trading skills are matched with the best tools.
                </p>
                <ul className="list">
                  <li>
                    <h6 className="title">
                      <span className="icon-check-mark">✓</span> Buy, Sell, And Trade On The Go
                    </h6>
                    <p className="text">Manage your holdings from any device</p>
                  </li>
                  <li>
                    <h6 className="title">
                      <span className="icon-check-mark">✓</span> Take Control Of Your Wealth
                    </h6>
                    <p className="text">Rest assured you (and only you) have access to your funds</p>
                  </li>
                </ul>
                <div className="group-button">
                  <a href="#"><img src="/assets/images/icon/googleplay.png" alt="Google Play" /></a>
                  <a href="#"><img src="/assets/images/icon/appstore.png" alt="App Store" /></a>
                </div>
              </div>
            </div>
            <div className="col-xl-6 col-md-12">
              <div className="download__image">
                <div className="button-scan">Scan To Download</div>
                <img src="/assets/images/layout/download.png" alt="Download App" />
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
                      <img src={t.avatar} alt={t.name} />
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
                    <img src={testimonials[activeTestimonial].avatar} alt="" />
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
                    <img src="/assets/images/logo/log-footer.png" alt="Uniswap V4" />
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
