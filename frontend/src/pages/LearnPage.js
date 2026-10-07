import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/i18n';
import { BookOpen, Shield, TrendingUp, Wallet, Layers, Zap } from 'lucide-react';
import './RockieWallet.css';

const articles = {
  en: [
    { icon: BookOpen, slug: 'what-is-bitcoin', title: 'What is Bitcoin?', desc: 'Bitcoin is the first and most well-known cryptocurrency. Learn how it works, its history, and why it matters for the future of finance.', tag: 'Beginner', color: '#f7931a' },
    { icon: Layers, slug: 'what-is-ethereum', title: 'What is Ethereum?', desc: 'Ethereum is a decentralized platform for smart contracts and dApps. Discover how it differs from Bitcoin and powers the DeFi ecosystem.', tag: 'Beginner', color: '#627eea' },
    { icon: Shield, slug: 'secure-your-crypto', title: 'How to Secure Your Crypto', desc: 'Best practices for protecting your digital assets: hardware wallets, 2FA, seed phrases, and avoiding common scams.', tag: 'Security', color: '#22c55e' },
    { icon: TrendingUp, slug: 'understanding-defi', title: 'Understanding DeFi', desc: 'Decentralized Finance is transforming traditional banking. Learn about lending, borrowing, yield farming, and liquidity pools.', tag: 'Advanced', color: '#3772ff' },
    { icon: Wallet, slug: 'what-is-staking', title: 'What is Staking?', desc: 'Earn passive income by staking your crypto. Understand proof-of-stake, validator nodes, and how APY rewards work.', tag: 'Intermediate', color: '#9945ff' },
    { icon: Zap, slug: 'nfts-explained', title: 'NFTs Explained', desc: 'Non-Fungible Tokens represent unique digital assets. Learn about digital art, gaming NFTs, and the metaverse economy.', tag: 'Beginner', color: '#e6007a' },
  ],
  it: [
    { icon: BookOpen, slug: 'what-is-bitcoin', title: 'Cos\'è Bitcoin?', desc: 'Bitcoin è la prima e più conosciuta criptovaluta. Scopri come funziona, la sua storia e perché è importante per il futuro della finanza.', tag: 'Principiante', color: '#f7931a' },
    { icon: Layers, slug: 'what-is-ethereum', title: 'Cos\'è Ethereum?', desc: 'Ethereum è una piattaforma decentralizzata per smart contract e dApp. Scopri in cosa differisce da Bitcoin e come alimenta l\'ecosistema DeFi.', tag: 'Principiante', color: '#627eea' },
    { icon: Shield, slug: 'secure-your-crypto', title: 'Come Proteggere le Tue Crypto', desc: 'Le migliori pratiche per proteggere i tuoi asset digitali: hardware wallet, 2FA, seed phrase e come evitare le truffe comuni.', tag: 'Sicurezza', color: '#22c55e' },
    { icon: TrendingUp, slug: 'understanding-defi', title: 'Capire la DeFi', desc: 'La Finanza Decentralizzata sta trasformando il sistema bancario tradizionale. Scopri prestiti, yield farming e pool di liquidità.', tag: 'Avanzato', color: '#3772ff' },
    { icon: Wallet, slug: 'what-is-staking', title: 'Cos\'è lo Staking?', desc: 'Guadagna un reddito passivo con lo staking delle tue crypto. Comprendi il proof-of-stake, i nodi validatori e come funzionano i premi APY.', tag: 'Intermedio', color: '#9945ff' },
    { icon: Zap, slug: 'nfts-explained', title: 'NFT Spiegati', desc: 'I Token Non Fungibili rappresentano asset digitali unici. Scopri l\'arte digitale, gli NFT gaming e l\'economia del metaverso.', tag: 'Principiante', color: '#e6007a' },
  ],
};

const LearnPage = () => {
  const { lang } = useLang();
  const items = articles[lang] || articles.en;
  const title = lang === 'it' ? 'Impara' : 'Learn';
  const subtitle = lang === 'it' ? 'Tutto quello che devi sapere sulle criptovalute' : 'Everything you need to know about cryptocurrency';

  return (
    <div style={{minHeight:'100vh'}}>
      <div className="rk-content" style={{maxWidth:1100,margin:'0 auto'}}>
        <div style={{marginBottom:32}}>
          <h1 className="rk-section-title" style={{fontSize:32,marginBottom:8}}>{title}</h1>
          <p style={{fontSize:16,color:'var(--r-text)'}}>{subtitle}</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))',gap:20}}>
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={i}
                to={`/learn/${item.slug}`}
                data-testid={`learn-card-${item.slug}`}
                className="rk-card rk-card-clickable"
                style={{ padding: 24, textDecoration: 'none', display: 'block', transition: 'transform 0.2s, box-shadow 0.2s' }}
              >
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                  <div style={{width:44,height:44,borderRadius:12,background:`${item.color}15`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Icon style={{width:22,height:22,color:item.color}} />
                  </div>
                  <span className="rk-badge" style={{background:`${item.color}15`,color:item.color}}>{item.tag}</span>
                </div>
                <h3 style={{fontSize:18,fontWeight:700,color:'var(--r-onsurface)',marginBottom:8}}>{item.title}</h3>
                <p style={{fontSize:14,color:'var(--r-text)',lineHeight:1.6,marginBottom:12}}>{item.desc}</p>
                <span style={{ fontSize: 13, color: '#3772ff', fontWeight: 600 }}>
                  {lang === 'it' ? 'Leggi articolo →' : 'Read article →'}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LearnPage;
