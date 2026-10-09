import React from 'react';

/**
 * Real cryptocurrency SVG icons.
 * Usage: <CryptoIcon symbol="BTC" size={32} />
 */

const icons = {
  BTC: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#F7931A"/>
      <path d="M22.5 14.1c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.7 2.6c-.4-.1-.8-.2-1.3-.3l.7-2.7-1.6-.4-.7 2.7c-.3-.1-.7-.2-1-.3v-.01l-2.3-.6-.4 1.7s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.1c0 0 .1 0 .1 0l-.1 0-1.1 4.4c-.1.2-.3.5-.7.4 0 0-1.2-.3-1.2-.3l-.8 1.8 2.1.5c.4.1.8.2 1.2.3l-.7 2.8 1.6.4.7-2.7c.4.1.9.2 1.3.3l-.7 2.7 1.6.4.7-2.8c2.9.6 5.1.3 6-2.3.7-2.1 0-3.3-1.5-4 1.1-.3 1.9-1 2.1-2.5zM19.4 18c-.5 2.1-4 1-5.1.7l.9-3.7c1.1.3 4.8.8 4.2 3zM19.9 14.1c-.5 1.9-3.4.9-4.3.7l.8-3.3c.9.2 4 .6 3.5 2.6z" fill="white"/>
    </svg>
  ),
  ETH: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#627EEA"/>
      <path d="M16.5 4v8.87l7.5 3.35L16.5 4z" fill="white" fillOpacity="0.6"/>
      <path d="M16.5 4L9 16.22l7.5-3.35V4z" fill="white"/>
      <path d="M16.5 21.97v6.03L24 17.62l-7.5 4.35z" fill="white" fillOpacity="0.6"/>
      <path d="M16.5 28V21.97L9 17.62 16.5 28z" fill="white"/>
      <path d="M16.5 20.57l7.5-4.35-7.5-3.35v7.7z" fill="white" fillOpacity="0.2"/>
      <path d="M9 16.22l7.5 4.35v-7.7L9 16.22z" fill="white" fillOpacity="0.6"/>
    </svg>
  ),
  BNB: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#F3BA2F"/>
      <path d="M12.1 14.3L16 10.4l3.9 3.9 2.3-2.3L16 5.8 9.8 12l2.3 2.3zm-6.3 1.7l2.3-2.3 2.3 2.3-2.3 2.3-2.3-2.3zm6.3 1.7L16 21.6l3.9-3.9 2.3 2.3L16 26.2 9.8 20l2.3-2.3zm10.2-1.7l2.3-2.3 2.3 2.3-2.3 2.3-2.3-2.3zM18.9 16L16 13.1 13.7 15.4l-.3.3-.3.3L16 18.9l2.9-2.9z" fill="white"/>
    </svg>
  ),
  USDT: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#26A17B"/>
      <path d="M17.9 17.1v0c-.1 0-.7.1-2 .1-1 0-1.7 0-1.9-.1v0c-3.7-.2-6.5-.8-6.5-1.6s2.8-1.5 6.5-1.6v2.6c.2 0 .9.1 2 .1 1.3 0 1.8-.1 1.9-.1v-2.6c3.7.2 6.5.8 6.5 1.6s-2.8 1.4-6.5 1.6zm0-3.5V11h5.3V8h-14.4v3h5.3v2.6c-4.2.2-7.3 1-7.3 2s3.1 1.8 7.3 2v7.2h3.8v-7.2c4.2-.2 7.3-1 7.3-2s-3.1-1.8-7.3-2z" fill="white"/>
    </svg>
  ),
  USDC: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#2775CA"/>
      <path d="M20.2 18.4c0-2-1.2-2.7-3.5-3-.7-.1-1.5-.2-2.2-.5-.5-.2-.8-.5-.8-1 0-.6.5-1 1.3-1.1.7 0 1.4.2 2 .6l.1.1.8-1.2-.1-.1c-.8-.6-1.7-.8-2.6-.9v-1.5h-1.4v1.5c-1.6.2-2.7 1.2-2.7 2.6 0 1.8 1.2 2.5 3.4 2.8.8.1 1.5.3 2.1.6.5.2.7.6.7 1.1 0 .8-.6 1.2-1.6 1.3-.9 0-1.8-.3-2.5-.9l-.1-.1-.9 1.1.1.1c.9.8 2 1.2 3.1 1.2v1.6h1.4v-1.6c1.8-.2 2.9-1.3 2.9-2.7z" fill="white"/>
      <path d="M19 24.2c-1.7.7-3.6.7-5.4.1l-.4 1.2c2.1.8 4.4.7 6.3-.1L19 24.2zM13.2 7.6c1.7-.7 3.6-.7 5.4-.1l.4-1.2c-2.1-.8-4.4-.7-6.3.1l.5 1.2z" fill="white"/>
    </svg>
  ),
  ADA: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#0033AD"/>
      <path d="M16 7l.4.2c.2.1.3.3.3.5v.5l-.3.5-.4.2-.4-.2-.3-.5V7.7c0-.2.1-.4.3-.5L16 7zm-4.2 2.4l.4.2c.2.1.3.3.3.5v.5l-.3.5-.4.2-.4-.2-.3-.5V10c0-.2.1-.4.3-.5l.4-.2zm8.4 0l.4.2c.2.1.3.3.3.5v.5l-.3.5-.4.2-.4-.2-.3-.5V10c0-.2.1-.4.3-.5l.4-.2zM16 11l.4.2c.2.1.3.3.3.5v.5l-.3.5-.4.2-.4-.2-.3-.5v-.5c0-.2.1-.4.3-.5l.4-.2zm-2.4 1.5l.4.2c.2.1.3.3.3.5v.5l-.3.5-.4.2-.4-.2-.3-.5v-.5c0-.2.1-.4.3-.5l.4-.2zm4.8 0l.4.2c.2.1.3.3.3.5v.5l-.3.5-.4.2-.4-.2-.3-.5v-.5c0-.2.1-.4.3-.5l.4-.2zM16 14.5l.4.2c.2.1.3.3.3.5v.5l-.3.5-.4.2-.4-.2-.3-.5v-.5c0-.2.1-.4.3-.5l.4-.2zm-4.8 1l.4.2c.2.1.3.3.3.5v.5l-.3.5-.4.2-.4-.2-.3-.5v-.5c0-.2.1-.4.3-.5l.4-.2zm9.6 0l.4.2c.2.1.3.3.3.5v.5l-.3.5-.4.2-.4-.2-.3-.5v-.5c0-.2.1-.4.3-.5l.4-.2zm-7.2 2l.4.2c.2.1.3.3.3.5v.5l-.3.5-.4.2-.4-.2-.3-.5v-.5c0-.2.1-.4.3-.5l.4-.2zm4.8 0l.4.2c.2.1.3.3.3.5v.5l-.3.5-.4.2-.4-.2-.3-.5v-.5c0-.2.1-.4.3-.5l.4-.2zM16 19l.4.2c.2.1.3.3.3.5v.5l-.3.5-.4.2-.4-.2-.3-.5v-.5c0-.2.1-.4.3-.5l.4-.2zm-2.4 1.5l.4.2c.2.1.3.3.3.5v.5l-.3.5-.4.2-.4-.2-.3-.5v-.5c0-.2.1-.4.3-.5l.4-.2zm4.8 0l.4.2c.2.1.3.3.3.5v.5l-.3.5-.4.2-.4-.2-.3-.5v-.5c0-.2.1-.4.3-.5l.4-.2zM16 22.5l.4.2c.2.1.3.3.3.5v.5l-.3.5-.4.2-.4-.2-.3-.5v-.5c0-.2.1-.4.3-.5l.4-.2zm-4.2.5l.4.2c.2.1.3.3.3.5v.5l-.3.5-.4.2-.4-.2-.3-.5v-.5c0-.2.1-.4.3-.5l.4-.2zm8.4 0l.4.2c.2.1.3.3.3.5v.5l-.3.5-.4.2-.4-.2-.3-.5v-.5c0-.2.1-.4.3-.5l.4-.2z" fill="white"/>
    </svg>
  ),
  SOL: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#9945FF"/>
      <path d="M10.2 20.5c.1-.1.3-.2.5-.2h13c.2 0 .3.2.2.4l-2.2 2.2c-.1.1-.3.2-.5.2h-13c-.2 0-.3-.2-.2-.4l2.2-2.2z" fill="url(#sol_grad1)"/>
      <path d="M10.2 9.1c.1-.1.3-.2.5-.2h13c.2 0 .3.2.2.4l-2.2 2.2c-.1.1-.3.2-.5.2h-13c-.2 0-.3-.2-.2-.4l2.2-2.2z" fill="url(#sol_grad2)"/>
      <path d="M21.7 14.7c-.1-.1-.3-.2-.5-.2h-13c-.2 0-.3.2-.2.4l2.2 2.2c.1.1.3.2.5.2h13c.2 0 .3-.2.2-.4l-2.2-2.2z" fill="url(#sol_grad3)"/>
      <defs>
        <linearGradient id="sol_grad1" x1="8" y1="23" x2="24" y2="9" gradientUnits="userSpaceOnUse"><stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/></linearGradient>
        <linearGradient id="sol_grad2" x1="8" y1="23" x2="24" y2="9" gradientUnits="userSpaceOnUse"><stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/></linearGradient>
        <linearGradient id="sol_grad3" x1="8" y1="23" x2="24" y2="9" gradientUnits="userSpaceOnUse"><stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/></linearGradient>
      </defs>
    </svg>
  ),
  XRP: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#23292F"/>
      <path d="M22.1 8h2.3l-5.8 5.7c-1.4 1.4-3.8 1.4-5.2 0L7.6 8h2.3l4.7 4.6c.8.8 2 .8 2.8 0L22.1 8zm-14.5 16h-2.3l5.8-5.7c1.4-1.4 3.8-1.4 5.2 0l5.8 5.7h-2.3l-4.7-4.6c-.8-.8-2-.8-2.8 0L7.6 24z" fill="white"/>
    </svg>
  ),
  DOT: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#E6007A"/>
      <circle cx="16" cy="8.5" r="2.5" fill="white"/>
      <circle cx="16" cy="23.5" r="2.5" fill="white"/>
      <ellipse cx="16" cy="16" rx="5" ry="8" stroke="white" strokeWidth="1.5" fill="none"/>
      <ellipse cx="16" cy="16" rx="5" ry="8" stroke="white" strokeWidth="1.5" fill="none" transform="rotate(60 16 16)"/>
      <ellipse cx="16" cy="16" rx="5" ry="8" stroke="white" strokeWidth="1.5" fill="none" transform="rotate(-60 16 16)"/>
    </svg>
  ),
  EUR: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#2E7D32"/>
      <path d="M11 14h8M11 18h8M19.5 10c-1.5-1.5-3.5-2-5.5-1.5-3 .8-5 3.6-5 6.7v1.6c0 3.1 2 5.9 5 6.7 2 .5 4 0 5.5-1.5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  USD: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#2775CA"/>
      <path d="M16 7v1.5M16 23.5V25M20 12.5c0-1.4-1.8-2.5-4-2.5s-4 1.1-4 2.5 1.8 2.5 4 2.5 4 1.1 4 2.5-1.8 2.5-4 2.5-4-1.1-4-2.5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  ),
};

const CryptoIcon = ({ symbol, size = 32, className = '', imageUrl = '' }) => {
  const upperSymbol = (symbol || '').toUpperCase();
  const renderIcon = icons[upperSymbol];
  
  if (renderIcon) {
    return (
      <span className={`crypto-icon-wrapper ${className}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, flexShrink: 0 }}>
        {renderIcon(size)}
      </span>
    );
  }
  
  // Use CoinGecko image URL if provided
  if (imageUrl) {
    return (
      <span className={`crypto-icon-wrapper ${className}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, flexShrink: 0 }}>
        <img
          src={imageUrl}
          alt={upperSymbol}
          width={size}
          height={size}
          style={{ borderRadius: '50%', objectFit: 'cover' }}
          onError={(e) => {
            // Fallback to colored circle on load failure
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `<span style="width:${size}px;height:${size}px;background:${fallbackColors[upperSymbol] || '#3772ff'};display:inline-flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;font-size:${size * 0.4}px;font-weight:800;flex-shrink:0">${upperSymbol.charAt(0)}</span>`;
          }}
        />
      </span>
    );
  }
  
  // Fallback for unknown symbols with no image
  const bg = fallbackColors[upperSymbol] || '#3772ff';
  
  return (
    <span 
      className={`crypto-icon-wrapper ${className}`}
      style={{ 
        width: size, 
        height: size, 
        background: bg, 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        borderRadius: '50%', 
        color: '#fff', 
        fontSize: size * 0.4, 
        fontWeight: 800, 
        flexShrink: 0 
      }}
    >
      {upperSymbol.charAt(0)}
    </span>
  );
};

// Color fallbacks for coins without built-in SVG icons
const fallbackColors = { 
  DOGE: '#C3A634', LINK: '#2A5ADA', UNI: '#FF007A', AVAX: '#E84142', 
  MATIC: '#8247E5', ATOM: '#2E3148', ALGO: '#000', FTM: '#1969FF',
  LTC: '#345D9D', TRX: '#EF0027', LDO: '#00A3FF', ARB: '#213147',
  OP: '#FF0420', NEAR: '#000', VET: '#15BDFF', GRT: '#6747ED',
  AAVE: '#B6509E', MKR: '#1AAB9B', SAND: '#00ADEF', MANA: '#FF2D55',
  AXS: '#0055D5', EOS: '#000', THETA: '#2AB8E6', RNDR: '#000',
  INJ: '#00F2FE', SUI: '#6FBCF0', SEI: '#9B1B30', TIA: '#7B2FBE',
  STX: '#5546FF', IMX: '#17B5CB', PEPE: '#479F53', DAI: '#F5AC37',
  BCH: '#0AC18E', XLM: '#000', XMR: '#FF6600', ETC: '#328332',
  FIL: '#0090FF', ICP: '#29ABE2', HBAR: '#000', WBTC: '#F09242',
  APT: '#000', SHIB: '#FFA409', DOGE: '#C3A634',
};

export default CryptoIcon;
