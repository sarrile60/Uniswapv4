import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/i18n';
import CryptoIcon from '@/components/CryptoIcons';
import { TrendingUp, Lock, Clock, Gift } from 'lucide-react';
import './RockieWallet.css';

const stakingData = [
  { symbol: 'ETH', name: 'Ethereum', apy: 4.1, minStake: '0.01 ETH', lockPeriod: 'Flexible', color: '#627eea' },
  { symbol: 'SOL', name: 'Solana', apy: 6.8, minStake: '0.1 SOL', lockPeriod: '30 days', color: '#9945ff' },
  { symbol: 'ADA', name: 'Cardano', apy: 3.5, minStake: '10 ADA', lockPeriod: 'Flexible', color: '#0033ad' },
  { symbol: 'DOT', name: 'Polkadot', apy: 12.0, minStake: '1 DOT', lockPeriod: '28 days', color: '#e6007a' },
  { symbol: 'BNB', name: 'BNB', apy: 2.9, minStake: '0.01 BNB', lockPeriod: 'Flexible', color: '#f3ba2f' },
  { symbol: 'XRP', name: 'XRP', apy: 4.5, minStake: '10 XRP', lockPeriod: '14 days', color: '#23292f' },
];

const EarnPage = () => {
  const { lang } = useLang();
  const { isAuthenticated } = useAuth();

  const txt = {
    en: {
      title: 'Earn Crypto Rewards', subtitle: 'Stake your crypto and earn passive income with competitive APY rates.',
      apy: 'APY', minStake: 'Min. Stake', lockPeriod: 'Lock Period', flexible: 'Flexible',
      stakeNow: 'Stake Now', totalEarnings: 'Total Potential Earnings',
      howItWorks: 'How Staking Works',
      step1: 'Choose a coin', step1d: 'Select which cryptocurrency you want to stake from the options above.',
      step2: 'Lock your tokens', step2d: 'Your tokens are locked for the staking period to help secure the network.',
      step3: 'Earn rewards', step3d: 'Receive staking rewards automatically deposited to your wallet.',
      disclaimer: 'Staking rewards are variable and subject to network conditions. Past performance does not guarantee future results.',
    },
    it: {
      title: 'Guadagna Ricompense Crypto', subtitle: 'Metti in staking le tue crypto e guadagna un reddito passivo con tassi APY competitivi.',
      apy: 'APY', minStake: 'Stake Min.', lockPeriod: 'Periodo di Blocco', flexible: 'Flessibile',
      stakeNow: 'Metti in Staking', totalEarnings: 'Guadagni Potenziali Totali',
      howItWorks: 'Come Funziona lo Staking',
      step1: 'Scegli una moneta', step1d: 'Seleziona quale criptovaluta vuoi mettere in staking dalle opzioni sopra.',
      step2: 'Blocca i tuoi token', step2d: 'I tuoi token vengono bloccati per il periodo di staking per proteggere la rete.',
      step3: 'Guadagna ricompense', step3d: 'Ricevi le ricompense di staking depositate automaticamente nel tuo portafoglio.',
      disclaimer: 'Le ricompense di staking sono variabili e soggette alle condizioni della rete. I rendimenti passati non garantiscono risultati futuri.',
    },
  };
  const t = txt[lang] || txt.en;

  return (
    <div style={{minHeight:'100vh'}}>
      <div className="rk-content" style={{maxWidth:1100,margin:'0 auto'}}>
        {/* Header */}
        <div style={{marginBottom:32,textAlign:'center'}}>
          <div style={{width:56,height:56,borderRadius:'50%',background:'rgba(55,114,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
            <Gift style={{width:28,height:28,color:'#3772ff'}} />
          </div>
          <h1 className="rk-section-title" style={{fontSize:32,marginBottom:8}}>{t.title}</h1>
          <p style={{fontSize:16,color:'var(--r-text)',maxWidth:500,margin:'0 auto'}}>{t.subtitle}</p>
        </div>

        {/* Staking Cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))',gap:16,marginBottom:40}}>
          {stakingData.map(coin => (
            <div key={coin.symbol} className="rk-card" style={{padding:24}}>
              <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
                <CryptoIcon symbol={coin.symbol} size={44} />
                <div>
                  <div style={{fontWeight:700,fontSize:16,color:'var(--r-onsurface)'}}>{coin.name}</div>
                  <div style={{fontSize:13,color:'var(--r-text)'}}>{coin.symbol}</div>
                </div>
                <div style={{marginLeft:'auto',textAlign:'right'}}>
                  <div style={{fontSize:28,fontWeight:800,color:'#22c55e'}}>{coin.apy}%</div>
                  <div style={{fontSize:11,color:'var(--r-text)',textTransform:'uppercase',fontWeight:600}}>{t.apy}</div>
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13}}>
                <span style={{color:'var(--r-text)'}}>{t.minStake}</span>
                <span style={{color:'var(--r-onsurface)',fontWeight:600}}>{coin.minStake}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:16,fontSize:13}}>
                <span style={{color:'var(--r-text)'}}>{t.lockPeriod}</span>
                <span style={{color:'var(--r-onsurface)',fontWeight:600}}>{coin.lockPeriod === 'Flexible' ? t.flexible : coin.lockPeriod}</span>
              </div>
              <Link to={isAuthenticated ? '/wallet' : '/register'}
                style={{display:'block',textAlign:'center',padding:'10px',borderRadius:10,background:'#3772ff',color:'#fff',fontSize:14,fontWeight:700,textDecoration:'none'}}>
                {t.stakeNow}
              </Link>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <h2 className="rk-section-title" style={{textAlign:'center',marginBottom:24}}>{t.howItWorks}</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:20,marginBottom:40}}>
          {[
            { icon: TrendingUp, title: t.step1, desc: t.step1d, color: '#3772ff' },
            { icon: Lock, title: t.step2, desc: t.step2d, color: '#f59e0b' },
            { icon: Gift, title: t.step3, desc: t.step3d, color: '#22c55e' },
          ].map((step, i) => (
            <div key={i} className="rk-card" style={{textAlign:'center',padding:24}}>
              <div style={{width:48,height:48,borderRadius:'50%',background:`${step.color}15`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}>
                <step.icon style={{width:24,height:24,color:step.color}} />
              </div>
              <h4 style={{fontSize:16,fontWeight:700,color:'var(--r-onsurface)',marginBottom:8}}>{step.title}</h4>
              <p style={{fontSize:13,color:'var(--r-text)',lineHeight:1.5}}>{step.desc}</p>
            </div>
          ))}
        </div>

        <p style={{textAlign:'center',fontSize:12,color:'var(--r-text)',opacity:0.6}}>{t.disclaimer}</p>
      </div>
    </div>
  );
};

export default EarnPage;
