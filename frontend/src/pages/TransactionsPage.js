import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLang, txTypeLabel, dateFmt } from '@/i18n';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Ban
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const TransactionsPage = () => {
  const { api } = useAuth();
  const { t, lang } = useLang();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const [expandedTx, setExpandedTx] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartTimeframe, setChartTimeframe] = useState('1W');
  const [chartLoading, setChartLoading] = useState(false);
  const [btcPrice, setBtcPrice] = useState(null);

  // Fetch chart data per timeframe
  useEffect(() => {
    const daysMap = { '1D': 1, '1W': 7, '1M': 30, '3M': 90 };
    const days = daysMap[chartTimeframe] || 7;
    const fetchChart = async () => {
      setChartLoading(true);
      try {
        const res = await fetch(`${API}/api/market/chart/BTC?days=${days}`);
        const json = await res.json();
        if (json.ok && json.data?.prices?.length > 0) setChartData(json.data.prices);
      } catch { /* silent */ }
      finally { setChartLoading(false); }
    };
    fetchChart();
  }, [chartTimeframe]);

  // Fetch BTC price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(`${API}/api/market/prices`);
        const json = await res.json();
        if (json.ok && json.data) {
          const btc = json.data.find(c => c.symbol === 'BTC');
          if (btc) setBtcPrice(btc);
        }
      } catch { /* silent */ }
    };
    fetchPrice();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [page, filter]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 20 };
      if (filter !== 'all') params.type = filter;
      const response = await api.get('/wallet/transactions', { params });
      if (response.data.ok) {
        setTransactions(response.data.data.transactions);
        setTotalPages(response.data.data.pages);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type, status) => {
    if (status === 'blocked') {
      return <Ban className="w-4 h-4 text-red-600" />;
    }
    switch (type) {
      case 'deposit': case 'receive':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case 'withdrawal': case 'send':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case 'swap':
        return <ArrowLeftRight className="w-4 h-4 text-blue-600" />;
      default:
        return <ArrowDownLeft className="w-4 h-4 text-gray-600" />;
    }
  };

  const statusLabels = {
    completed: t.completed,
    processing: t.processing,
    pending: t.pending,
    failed: t.failed,
    blocked: lang === 'it' ? 'Bloccato' : 'Blocked',
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-700',
      processing: 'bg-blue-100 text-blue-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
      blocked: 'bg-red-600 text-white',
    };
    return <Badge className={styles[status] || 'bg-gray-100 text-gray-700'}>{statusLabels[status] || status}</Badge>;
  };

  const filterLabels = {
    all: t.all,
    deposit: t.deposits,
    receive: t.receives,
    send: t.sends,
    swap: t.swaps,
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(dateFmt(lang), {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const toggleExpand = (txId) => {
    setExpandedTx(expandedTx === txId ? null : txId);
  };

  return (
    <div className="min-h-screen">
      <main className="max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* Portfolio Chart Section */}
        <div style={{background:'var(--r-surface, #f8f9fa)',borderRadius:16,padding:'24px 24px 20px',marginBottom:24,border:'1px solid var(--r-line, #e6e8ec)'}}>
          {/* Live Price Header */}
          <div style={{display:'flex',alignItems:'baseline',gap:12,marginBottom:4}}>
            <span style={{fontSize:28,fontWeight:800,color:'var(--r-onsurface)'}}>
              ${btcPrice?.price?.toLocaleString('en-US', {maximumFractionDigits: 2}) || '—'}
            </span>
            {btcPrice && (
              <span style={{fontSize:14,fontWeight:600,color: (btcPrice.change_24h || 0) >= 0 ? '#22c55e' : '#ef4444'}}>
                {(btcPrice.change_24h || 0) >= 0 ? '+' : ''}{(btcPrice.change_24h || 0).toFixed(2)}%
              </span>
            )}
          </div>
          <div style={{fontSize:12,color:'var(--r-text)',marginBottom:16}}>
            Bitcoin · {lang === 'it' ? 'Ultime 24 ore' : 'Past 24hr'}
          </div>

          {/* Timeframe Buttons */}
          <div style={{display:'flex',gap:6,marginBottom:12}}>
            {['1D','1W','1M','3M'].map(tf => (
              <button key={tf} onClick={() => setChartTimeframe(tf)}
                style={{padding:'4px 14px',borderRadius:8,fontSize:12,fontWeight:600,border:'none',cursor:'pointer',
                  background: chartTimeframe === tf ? '#3772ff' : 'rgba(55,114,255,0.08)',
                  color: chartTimeframe === tf ? '#fff' : 'var(--r-text)',transition:'all 0.2s'}}>
                {tf}
              </button>
            ))}
          </div>

          {/* Chart */}
          {chartLoading ? (
            <div style={{height:120,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <RefreshCw className="w-5 h-5 animate-spin" style={{color:'var(--r-text)',opacity:0.5}} />
            </div>
          ) : chartData.length > 10 ? (() => {
            const min = Math.min(...chartData);
            const max = Math.max(...chartData);
            const range = max - min || 1;
            const w = 800, h = 120, pad = 4;
            const pts = chartData.map((v, i) => `${pad + (i / (chartData.length - 1)) * (w - pad * 2)},${pad + (1 - (v - min) / range) * (h - pad * 2)}`);
            const pathD = `M${pts.join(' L')}`;
            const areaD = `${pathD} L${w - pad},${h - pad} L${pad},${h - pad} Z`;
            const isUp = chartData[chartData.length - 1] >= chartData[0];
            const clr = isUp ? '#22c55e' : '#ef4444';
            return (
              <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{display:'block',borderRadius:8}}>
                <defs><linearGradient id="txChartGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={clr} stopOpacity="0.12"/><stop offset="100%" stopColor={clr} stopOpacity="0"/></linearGradient></defs>
                <path d={areaD} fill="url(#txChartGrad)" />
                <path d={pathD} fill="none" stroke={clr} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            );
          })() : null}
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-2">
          {['all', 'deposit', 'receive', 'send', 'swap'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              data-testid={`filter-${f}`}
            >
              {filterLabels[f]}
            </Button>
          ))}
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : transactions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">{t.noTransactions}</p>
          </Card>
        ) : (
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {transactions.map((tx) => (
              <Card 
                key={tx.id} 
                className={`p-4 cursor-pointer transition hover:shadow-md ${
                  tx.status === 'blocked' ? 'border-red-300 bg-red-50/30' : ''
                }`}
                onClick={() => tx.description ? toggleExpand(tx.id) : null}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.status === 'blocked' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      {getTransactionIcon(tx.type, tx.status)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{txTypeLabel(t, tx.type)}</div>
                      <div className="text-sm text-gray-500">{tx.asset}</div>
                      <div className="text-xs text-gray-400 mt-1">{formatDate(tx.transaction_date)}</div>
                      {/* Description preview - clickable */}
                      {tx.description && (
                        <div className="flex items-center mt-1 text-xs text-blue-600 hover:text-blue-800">
                          <span className="truncate max-w-[180px]">{tx.description}</span>
                          {expandedTx === tx.id 
                            ? <ChevronUp className="w-3 h-3 ml-1 shrink-0" />
                            : <ChevronDown className="w-3 h-3 ml-1 shrink-0" />
                          }
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      tx.status === 'blocked' ? 'text-red-600' :
                      ['deposit', 'receive'].includes(tx.type) ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {['deposit', 'receive'].includes(tx.type) ? '+' : '-'}
                      &euro;{parseFloat(tx.amount).toLocaleString(dateFmt(lang), { minimumFractionDigits: 2 })}
                    </div>
                    <div className="mt-1">{getStatusBadge(tx.status)}</div>
                  </div>
                </div>

                {/* Expanded description */}
                {expandedTx === tx.id && tx.description && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className={`text-sm p-3 rounded-lg ${
                      tx.status === 'blocked' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-gray-50 text-gray-700'
                    }`}>
                      {tx.status === 'blocked' && (
                        <div className="flex items-center font-semibold mb-1">
                          <Ban className="w-4 h-4 mr-1" />
                          {lang === 'it' ? 'Transazione Bloccata' : 'Transaction Blocked'}
                        </div>
                      )}
                      <p>{tx.description}</p>
                      {tx.counterparty_address && (
                        <p className="mt-1 text-xs font-mono opacity-75">{tx.counterparty_address}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Fee Warning */}
                {parseFloat(tx.fee) > 0 && !tx.fee_paid && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-orange-600">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        <span>{t.unpaidFee}</span>
                      </div>
                      <span className="font-semibold text-orange-600">&euro;{tx.fee}</span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {t.previous}
            </Button>
            <span className="text-sm text-gray-600">
              {t.pageOf.replace('{page}', page).replace('{total}', totalPages)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              {t.next}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default TransactionsPage;
