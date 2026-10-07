import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '@/i18n';
import CryptoIcon from '@/components/CryptoIcons';
import { ShieldAlert, ArrowRight, X, ChevronDown, RefreshCw } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const SUPPORTED_COINS = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOT', 'USDT'];

const COIN_NAMES = {
  BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', BNB: 'BNB',
  ADA: 'Cardano', XRP: 'Ripple', DOT: 'Polkadot', USDT: 'Tether'
};

/* CoinPicker — extracted to avoid nested component renders */
const CoinPicker = ({ selectedCoin, setSelectedCoin, setShowCoinPicker, marketPrices, searchPlaceholder, selectLabel }) => {
  const [search, setSearch] = useState('');
  const filtered = SUPPORTED_COINS.filter(c =>
    c.toLowerCase().includes(search.toLowerCase()) ||
    (COIN_NAMES[c] || '').toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'var(--r-bg, #141416)', zIndex: 10,
      display: 'flex', flexDirection: 'column', borderRadius: 16,
    }}>
      <div style={{ padding: '20px 24px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--r-onsurface)' }}>{selectLabel}</h3>
        <button onClick={() => setShowCoinPicker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--r-text)', padding: 4 }}>
          <X size={20} />
        </button>
      </div>
      <div style={{ padding: '0 24px 12px' }}>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            border: '1px solid var(--r-line)', background: 'var(--r-surface)',
            color: 'var(--r-onsurface)', fontSize: 14, outline: 'none',
          }}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
        {filtered.map(coin => {
          const mp = marketPrices.find(m => m.symbol === coin);
          const price = mp?.price || 0;
          const change = mp?.change_24h || 0;
          return (
            <button
              key={coin}
              onClick={() => { setSelectedCoin(coin); setShowCoinPicker(false); }}
              data-testid={`coin-picker-${coin}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: selectedCoin === coin ? 'rgba(55,114,255,0.08)' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (selectedCoin !== coin) e.currentTarget.style.background = 'var(--r-surface)'; }}
              onMouseLeave={e => { if (selectedCoin !== coin) e.currentTarget.style.background = 'transparent'; }}
            >
              <CryptoIcon symbol={coin} size={36} />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--r-onsurface)' }}>{COIN_NAMES[coin] || coin}</div>
                <div style={{ fontSize: 12, color: 'var(--r-text)' }}>{coin}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--r-onsurface)' }}>
                  ${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: change >= 0 ? '#22c55e' : '#ef4444' }}>
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * TradeModal — Professional Coinbase-style trade modal
 * Supports Buy/Sell tabs, asset selection, amount input, preview, and "under review" block.
 */
const TradeModal = ({ open, onClose }) => {
  const { lang, t } = useLang();
  const [tab, setTab] = useState('buy'); // 'buy' | 'sell'
  const [step, setStep] = useState(1); // 1: form, 2: preview, 3: error/under-review
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [showCoinPicker, setShowCoinPicker] = useState(false);
  const [marketPrices, setMarketPrices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Translations
  const tr = {
    trade: lang === 'it' ? 'Trade' : 'Trade',
    buy: t.buy || 'Buy',
    sell: t.sell || 'Sell',
    selectAsset: lang === 'it' ? 'Seleziona Asset' : 'Select Asset',
    amount: lang === 'it' ? 'Importo' : 'Amount',
    amountEur: lang === 'it' ? 'Importo (EUR)' : 'Amount (EUR)',
    amountCrypto: lang === 'it' ? 'Importo' : 'Amount',
    youPay: lang === 'it' ? 'Paghi' : 'You Pay',
    youReceive: lang === 'it' ? 'Ricevi' : 'You Receive',
    estimated: lang === 'it' ? 'Stimato' : 'Estimated',
    previewOrder: lang === 'it' ? 'Anteprima Ordine' : 'Preview Order',
    confirmPurchase: lang === 'it' ? 'Conferma Acquisto' : 'Confirm Purchase',
    confirmSale: lang === 'it' ? 'Conferma Vendita' : 'Confirm Sale',
    orderSummary: lang === 'it' ? 'Riepilogo Ordine' : 'Order Summary',
    price: lang === 'it' ? 'Prezzo' : 'Price',
    fee: lang === 'it' ? 'Commissione (0,5%)' : 'Fee (0.5%)',
    total: lang === 'it' ? 'Totale' : 'Total',
    back: lang === 'it' ? 'Indietro' : 'Back',
    close: t.close || 'Close',
    searchCoin: lang === 'it' ? 'Cerca moneta...' : 'Search coin...',
    currentPrice: lang === 'it' ? 'Prezzo corrente' : 'Current price',
    errorTitle: t.buysell_errorTitle || 'Transaction Temporarily Unavailable',
    buyErrorMsg: t.buy_errorMsg || 'Your account is currently under enhanced security review.',
    sellErrorMsg: t.sell_errorMsg || 'Your account requires additional verification.',
    contactSupport: t.buysell_contactSupport || 'Contact Support',
    enterAmount: lang === 'it' ? 'Inserisci importo' : 'Enter amount',
    buying: lang === 'it' ? 'Acquisto' : 'Buying',
    selling: lang === 'it' ? 'Vendita' : 'Selling',
  };

  // Fetch market prices
  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/market/prices`);
      const json = await res.json();
      if (json.ok && json.data) setMarketPrices(json.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (open) {
      fetchPrices();
      const iv = setInterval(fetchPrices, 60000);
      return () => clearInterval(iv);
    }
  }, [open, fetchPrices]);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setStep(1);
      setAmount('');
      setShowCoinPicker(false);
    }
  }, [open, tab]);

  if (!open) return null;

  const coinPrice = marketPrices.find(m => m.symbol === selectedCoin)?.price || 0;
  const coinChange = marketPrices.find(m => m.symbol === selectedCoin)?.change_24h || 0;
  const amountNum = parseFloat(amount) || 0;

  // Buy: user pays EUR, receives crypto
  // Sell: user pays crypto, receives EUR
  const isBuy = tab === 'buy';
  const feeRate = 0.005;
  const feeAmount = isBuy ? amountNum * feeRate : amountNum * coinPrice * feeRate;
  const estimatedReceive = isBuy
    ? coinPrice > 0 ? (amountNum / coinPrice) : 0
    : amountNum * coinPrice * (1 - feeRate);
  const totalCost = isBuy ? amountNum * (1 + feeRate) : amountNum;

  const canPreview = amountNum > 0;

  const handleConfirm = () => {
    setStep(3); // Show "under review"
  };

  const handleClose = () => {
    setStep(1);
    setAmount('');
    setSelectedCoin('BTC');
    setTab('buy');
    setShowCoinPicker(false);
    onClose();
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 99998, backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Modal */}
      <div
        data-testid="trade-modal"
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%', maxWidth: 440,
          maxHeight: '90vh',
          background: 'var(--r-bg, #141416)',
          borderRadius: 20,
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          zIndex: 99999,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'tradeModalSlideUp 0.3s ease',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--r-onsurface)', margin: 0 }}>
            {step === 3 ? tr.errorTitle : step === 2 ? tr.orderSummary : tr.trade}
          </h2>
          <button
            onClick={handleClose}
            data-testid="trade-modal-close"
            style={{
              background: 'var(--r-surface)', border: 'none', cursor: 'pointer',
              color: 'var(--r-text)', width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher — only on step 1 */}
        {step === 1 && (
          <div style={{
            display: 'flex', margin: '16px 24px 0', padding: 4,
            background: 'var(--r-surface)', borderRadius: 12,
          }}>
            {['buy', 'sell'].map(t_key => (
              <button
                key={t_key}
                data-testid={`trade-tab-${t_key}`}
                onClick={() => { setTab(t_key); setStep(1); setAmount(''); }}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
                  background: tab === t_key
                    ? (t_key === 'buy' ? '#22c55e' : '#ef4444')
                    : 'transparent',
                  color: tab === t_key ? '#fff' : 'var(--r-text)',
                }}
              >
                {t_key === 'buy' ? tr.buy : tr.sell}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '20px 24px 24px', flex: 1, overflowY: 'auto', position: 'relative' }}>

          {/* === STEP 3: Under Review === */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: isBuy ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <ShieldAlert size={32} style={{ color: isBuy ? '#f59e0b' : '#ef4444' }} />
              </div>
              <p style={{ fontSize: 14, color: 'var(--r-text)', lineHeight: 1.7, marginBottom: 28, maxWidth: 340, margin: '0 auto 28px' }}>
                {isBuy ? tr.buyErrorMsg : tr.sellErrorMsg}
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <a
                  href="mailto:info@uniswapv4.com"
                  data-testid="trade-contact-support"
                  style={{
                    padding: '12px 24px', borderRadius: 12, background: '#3772ff',
                    color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none',
                    transition: 'opacity 0.15s',
                  }}
                >
                  {tr.contactSupport}
                </a>
                <button
                  onClick={handleClose}
                  style={{
                    padding: '12px 24px', borderRadius: 12, background: 'transparent',
                    border: '1px solid var(--r-line)', color: 'var(--r-text)',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {tr.close}
                </button>
              </div>
            </div>
          )}

          {/* === STEP 2: Preview/Confirm === */}
          {step === 2 && (
            <div>
              {/* Order info card */}
              <div style={{
                background: 'var(--r-surface)', borderRadius: 14, padding: 20, marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <CryptoIcon symbol={selectedCoin} size={40} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--r-onsurface)' }}>
                      {isBuy ? tr.buying : tr.selling} {COIN_NAMES[selectedCoin] || selectedCoin}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--r-text)' }}>{selectedCoin}</div>
                  </div>
                </div>

                {/* Summary rows */}
                {(isBuy ? [
                  [tr.youPay, `€${amountNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
                  [tr.price, `$${coinPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}`],
                  [tr.fee, `€${feeAmount.toFixed(2)}`],
                  [tr.youReceive, `≈ ${estimatedReceive.toFixed(6)} ${selectedCoin}`],
                ] : [
                  [tr.selling, `${amountNum} ${selectedCoin}`],
                  [tr.price, `$${coinPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}`],
                  [tr.fee, `€${feeAmount.toFixed(2)}`],
                  [tr.youReceive, `≈ €${estimatedReceive.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
                ]).map(([label, value], i, arr) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--r-line)' : 'none',
                  }}>
                    <span style={{ fontSize: 14, color: 'var(--r-text)' }}>{label}</span>
                    <span style={{
                      fontSize: 14, fontWeight: i === arr.length - 1 ? 700 : 600,
                      color: i === arr.length - 1 ? (isBuy ? '#22c55e' : '#3772ff') : 'var(--r-onsurface)',
                    }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <button
                onClick={handleConfirm}
                data-testid="trade-confirm-btn"
                style={{
                  width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10,
                  background: isBuy ? '#22c55e' : '#ef4444', color: '#fff',
                  transition: 'opacity 0.15s',
                }}
              >
                {isBuy ? tr.confirmPurchase : tr.confirmSale}
              </button>
              <button
                onClick={() => setStep(1)}
                style={{
                  width: '100%', padding: '12px', borderRadius: 14, border: '1px solid var(--r-line)',
                  background: 'transparent', color: 'var(--r-text)', fontSize: 14,
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                {tr.back}
              </button>
            </div>
          )}

          {/* === STEP 1: Form === */}
          {step === 1 && (
            <div>
              {/* Coin Picker Overlay */}
              {showCoinPicker && <CoinPicker selectedCoin={selectedCoin} setSelectedCoin={setSelectedCoin} setShowCoinPicker={setShowCoinPicker} marketPrices={marketPrices} searchPlaceholder={tr.searchCoin} selectLabel={tr.selectAsset} />}

              {/* Asset Selector */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--r-text)', display: 'block', marginBottom: 8 }}>
                  {tr.selectAsset}
                </label>
                <button
                  onClick={() => setShowCoinPicker(true)}
                  data-testid="trade-coin-selector"
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 14,
                    border: '1px solid var(--r-line)', background: 'var(--r-surface)',
                    cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                >
                  <CryptoIcon symbol={selectedCoin} size={36} />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--r-onsurface)' }}>
                      {COIN_NAMES[selectedCoin] || selectedCoin}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--r-text)' }}>
                      {tr.currentPrice}: ${coinPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      <span style={{ marginLeft: 8, color: coinChange >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                        {coinChange >= 0 ? '+' : ''}{coinChange.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <ChevronDown size={18} style={{ color: 'var(--r-text)' }} />
                </button>
              </div>

              {/* Amount Input */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--r-text)', display: 'block', marginBottom: 8 }}>
                  {isBuy ? tr.amountEur : `${tr.amountCrypto} (${selectedCoin})`}
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  border: '1px solid var(--r-line)', borderRadius: 14,
                  background: 'var(--r-surface)', overflow: 'hidden',
                  transition: 'border-color 0.15s',
                }}>
                  <span style={{
                    padding: '0 0 0 16px', fontSize: 20, fontWeight: 700,
                    color: 'var(--r-text)', opacity: 0.5,
                  }}>
                    {isBuy ? '€' : ''}
                  </span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    data-testid="trade-amount-input"
                    min="0"
                    step="any"
                    style={{
                      flex: 1, padding: '14px 16px 14px 8px', border: 'none',
                      background: 'transparent', color: 'var(--r-onsurface)',
                      fontSize: 20, fontWeight: 700, outline: 'none',
                      width: '100%',
                    }}
                  />
                  <span style={{
                    padding: '0 16px 0 0', fontSize: 14, fontWeight: 600,
                    color: 'var(--r-text)',
                  }}>
                    {isBuy ? 'EUR' : selectedCoin}
                  </span>
                </div>
              </div>

              {/* Live Quote */}
              {amountNum > 0 && (
                <div style={{
                  background: 'var(--r-surface)', borderRadius: 14, padding: '14px 16px',
                  marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--r-text)', marginBottom: 4 }}>{tr.estimated}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: isBuy ? '#22c55e' : '#3772ff' }}>
                      {isBuy
                        ? `${estimatedReceive.toFixed(6)} ${selectedCoin}`
                        : `€${estimatedReceive.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      }
                    </div>
                  </div>
                  <button
                    onClick={fetchPrices}
                    title="Refresh"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--r-text)', opacity: 0.6, padding: 4,
                    }}
                  >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>
              )}

              {/* Preview Button */}
              <button
                onClick={() => setStep(2)}
                disabled={!canPreview}
                data-testid="trade-preview-btn"
                style={{
                  width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                  fontSize: 15, fontWeight: 700, cursor: canPreview ? 'pointer' : 'default',
                  background: canPreview ? '#3772ff' : 'var(--r-surface)',
                  color: canPreview ? '#fff' : 'var(--r-text)',
                  opacity: canPreview ? 1 : 0.5,
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {tr.previewOrder} <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes tradeModalSlideUp {
          from { opacity: 0; transform: translate(-50%, -46%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>,
    document.body
  );
};

export default TradeModal;
