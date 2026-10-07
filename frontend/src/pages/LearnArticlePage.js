import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLang } from '@/i18n';
import { BookOpen, Shield, TrendingUp, Wallet, Layers, Zap, ArrowLeft, Clock, ChevronRight } from 'lucide-react';
import './RockieWallet.css';

const SLUGS = ['what-is-bitcoin', 'what-is-ethereum', 'secure-your-crypto', 'understanding-defi', 'what-is-staking', 'nfts-explained'];

const articlesData = {
  en: {
    'what-is-bitcoin': {
      icon: BookOpen,
      title: 'What is Bitcoin?',
      tag: 'Beginner',
      color: '#f7931a',
      readTime: '6 min read',
      content: [
        { type: 'p', text: 'Bitcoin (BTC) is the world\'s first and most widely recognized cryptocurrency. Launched in 2009 by the pseudonymous developer Satoshi Nakamoto, Bitcoin introduced the concept of a decentralized digital currency that operates without central banks or intermediaries.' },
        { type: 'h2', text: 'How Bitcoin Works' },
        { type: 'p', text: 'At its core, Bitcoin uses a technology called blockchain — a distributed ledger that records every transaction across a network of thousands of computers worldwide. When you send Bitcoin to someone, the transaction is broadcast to the network, verified by miners through a process called proof-of-work, and then permanently recorded on the blockchain.' },
        { type: 'p', text: 'Each block in the blockchain contains a group of transactions and is cryptographically linked to the previous block, creating an immutable chain of records. This makes it virtually impossible to alter past transactions, ensuring the integrity of the entire system.' },
        { type: 'h2', text: 'Why Bitcoin Matters' },
        { type: 'p', text: 'Bitcoin was created in response to the 2008 global financial crisis. Its key innovation is removing the need for trusted third parties in financial transactions. This means you can send value to anyone in the world without needing a bank, payment processor, or government approval.' },
        { type: 'list', items: [
          'Decentralized — No single entity controls Bitcoin',
          'Limited supply — Only 21 million BTC will ever exist, making it deflationary',
          'Borderless — Send money anywhere in minutes, not days',
          'Transparent — All transactions are publicly verifiable on the blockchain',
          'Censorship-resistant — No one can freeze or confiscate your Bitcoin',
        ]},
        { type: 'h2', text: 'Bitcoin as Digital Gold' },
        { type: 'p', text: 'Many investors view Bitcoin as "digital gold" — a store of value that protects against inflation and currency devaluation. Like gold, Bitcoin is scarce (capped at 21 million coins), durable, fungible, and divisible (down to 8 decimal places, called "satoshis").' },
        { type: 'p', text: 'Institutional adoption has accelerated dramatically, with major corporations, hedge funds, and even sovereign nations adding Bitcoin to their balance sheets. The approval of Bitcoin ETFs in traditional markets has further legitimized it as an asset class.' },
        { type: 'h2', text: 'Getting Started with Bitcoin' },
        { type: 'p', text: 'To start using Bitcoin, you need a wallet — software that stores your private keys and allows you to send and receive BTC. Wallets come in several forms: mobile apps, desktop software, hardware devices, and web-based platforms like Uniswap V4.' },
        { type: 'p', text: 'When you buy Bitcoin on an exchange, you can hold it in your exchange wallet for convenience or transfer it to a personal wallet for maximum security. Always remember: your private keys are the only way to access your Bitcoin. Lose them, and your funds are gone forever.' },
      ],
      related: ['what-is-ethereum', 'secure-your-crypto'],
    },
    'what-is-ethereum': {
      icon: Layers,
      title: 'What is Ethereum?',
      tag: 'Beginner',
      color: '#627eea',
      readTime: '7 min read',
      content: [
        { type: 'p', text: 'Ethereum is a decentralized, open-source blockchain platform that enables developers to build and deploy smart contracts and decentralized applications (dApps). Created by Vitalik Buterin and launched in 2015, Ethereum goes beyond simple value transfer to become a programmable world computer.' },
        { type: 'h2', text: 'Beyond Digital Currency' },
        { type: 'p', text: 'While Bitcoin was designed primarily as a peer-to-peer electronic cash system, Ethereum was built as a platform for decentralized computation. Its native cryptocurrency, Ether (ETH), is used to pay for transaction fees and computational services on the network, but Ethereum\'s real power lies in its smart contract capability.' },
        { type: 'h2', text: 'Smart Contracts Explained' },
        { type: 'p', text: 'Smart contracts are self-executing programs stored on the blockchain that automatically enforce agreed-upon rules when specific conditions are met. Think of them as digital agreements that run exactly as programmed — no downtime, censorship, fraud, or third-party interference.' },
        { type: 'p', text: 'For example, a smart contract could automatically release funds to a seller once a buyer confirms receipt of goods, or distribute insurance payouts when certain weather conditions are detected by oracles (data feeds that connect the blockchain to real-world information).' },
        { type: 'h2', text: 'The Ethereum Ecosystem' },
        { type: 'p', text: 'Ethereum has spawned an enormous ecosystem of applications and protocols:' },
        { type: 'list', items: [
          'DeFi (Decentralized Finance) — Lending, borrowing, and trading without banks',
          'NFTs (Non-Fungible Tokens) — Unique digital assets for art, gaming, and identity',
          'DAOs (Decentralized Autonomous Organizations) — Community-governed entities',
          'Layer 2 solutions — Scaling technologies like Optimism and Arbitrum',
          'Stablecoins — Dollar-pegged tokens like USDC and DAI',
        ]},
        { type: 'h2', text: 'Ethereum 2.0 and Proof of Stake' },
        { type: 'p', text: 'In September 2022, Ethereum completed "The Merge" — a historic transition from energy-intensive proof-of-work mining to proof-of-stake consensus. This reduced Ethereum\'s energy consumption by approximately 99.95% and laid the groundwork for future scalability improvements.' },
        { type: 'p', text: 'Under proof-of-stake, validators stake their ETH as collateral to participate in block validation. This makes the network more environmentally sustainable while maintaining robust security. Stakers can earn yields on their ETH for helping secure the network.' },
        { type: 'h2', text: 'ETH as an Investment' },
        { type: 'p', text: 'ETH is the second-largest cryptocurrency by market capitalization. Its value proposition comes from its utility as the "fuel" powering the world\'s most active smart contract platform. As more applications build on Ethereum, demand for ETH to pay gas fees increases, potentially driving long-term value appreciation.' },
      ],
      related: ['what-is-bitcoin', 'understanding-defi'],
    },
    'secure-your-crypto': {
      icon: Shield,
      title: 'How to Secure Your Crypto',
      tag: 'Security',
      color: '#22c55e',
      readTime: '8 min read',
      content: [
        { type: 'p', text: 'Cryptocurrency security is your personal responsibility. Unlike traditional banking where institutions protect your deposits, in the crypto world, you are your own bank. This guide covers essential practices to keep your digital assets safe from hackers, scams, and human error.' },
        { type: 'h2', text: 'Understanding Crypto Wallets' },
        { type: 'p', text: 'Your crypto wallet doesn\'t actually store your coins — it stores your private keys, which prove ownership of your funds on the blockchain. There are two main categories of wallets:' },
        { type: 'list', items: [
          'Hot wallets — Connected to the internet (mobile apps, browser extensions, exchange wallets). Convenient but more vulnerable.',
          'Cold wallets — Offline storage (hardware wallets like Ledger or Trezor, paper wallets). Maximum security for long-term holdings.',
        ]},
        { type: 'h2', text: 'Essential Security Practices' },
        { type: 'p', text: '1. Enable Two-Factor Authentication (2FA): Always enable 2FA on every crypto account. Use an authenticator app (Google Authenticator, Authy) instead of SMS-based 2FA, which is vulnerable to SIM-swapping attacks.' },
        { type: 'p', text: '2. Secure Your Seed Phrase: When you create a wallet, you receive a 12 or 24-word seed phrase. This is the master key to all your funds. Write it down on paper (never store it digitally), keep it in a fireproof safe, and never share it with anyone. Consider creating a metal backup for disaster resilience.' },
        { type: 'p', text: '3. Use Hardware Wallets for Large Holdings: If you hold significant value in crypto, invest in a hardware wallet. These devices store your private keys offline, making them immune to online hacking attempts. Only connect them to trusted computers when making transactions.' },
        { type: 'p', text: '4. Verify Everything: Always double-check wallet addresses before sending transactions. Malware can replace clipboard addresses with a hacker\'s address. Verify the first and last few characters manually every time.' },
        { type: 'h2', text: 'Common Scams to Avoid' },
        { type: 'list', items: [
          'Phishing websites — Fake exchange or wallet sites that steal your credentials. Always bookmark official URLs.',
          'Fake customer support — Scammers posing as support staff on social media. Real support never asks for private keys.',
          'Pump and dump schemes — Groups artificially inflate a coin\'s price, then sell en masse. If it sounds too good to be true, it is.',
          'Rug pulls — DeFi projects that vanish with investor funds. Always research team credibility and audit reports.',
          'Giveaway scams — "Send 1 BTC, get 2 back" is always a scam, no exceptions.',
        ]},
        { type: 'h2', text: 'Exchange Security Tips' },
        { type: 'p', text: 'When using centralized exchanges like Uniswap V4, take additional precautions: use a unique, strong password (16+ characters), enable withdrawal address whitelisting, set up anti-phishing codes, and regularly review your active sessions and API keys. Move large amounts to personal cold storage rather than keeping them on the exchange long-term.' },
      ],
      related: ['what-is-bitcoin', 'what-is-staking'],
    },
    'understanding-defi': {
      icon: TrendingUp,
      title: 'Understanding DeFi',
      tag: 'Advanced',
      color: '#3772ff',
      readTime: '8 min read',
      content: [
        { type: 'p', text: 'Decentralized Finance (DeFi) represents one of the most transformative innovations in modern finance. It\'s an ecosystem of financial applications built on blockchain technology that recreates traditional financial services — lending, borrowing, trading, insurance — without centralized intermediaries like banks or brokerages.' },
        { type: 'h2', text: 'How DeFi Works' },
        { type: 'p', text: 'DeFi protocols are powered by smart contracts on blockchains like Ethereum. These self-executing programs handle everything from lending pools to trading pairs automatically. Users interact directly with these protocols through their crypto wallets, maintaining full custody of their assets throughout the process.' },
        { type: 'p', text: 'Unlike traditional finance where a bank holds your money and decides who gets loans, DeFi uses algorithms and community governance to manage risk, set interest rates, and facilitate transactions. This creates a more transparent, accessible, and efficient financial system.' },
        { type: 'h2', text: 'Key DeFi Categories' },
        { type: 'list', items: [
          'Decentralized Exchanges (DEXs) — Platforms like Uniswap and SushiSwap let you trade tokens directly from your wallet, without KYC or account creation.',
          'Lending & Borrowing — Protocols like Aave and Compound allow you to earn interest by lending your crypto or borrow against your holdings as collateral.',
          'Yield Farming — Strategies to maximize returns by moving assets between protocols to capture the highest available yields.',
          'Stablecoins — Tokens pegged to fiat currencies (like USDC or DAI) that provide stability in the volatile crypto market.',
          'Derivatives — Platforms offering futures, options, and synthetic assets that track real-world prices.',
        ]},
        { type: 'h2', text: 'Risks in DeFi' },
        { type: 'p', text: 'While DeFi offers exciting opportunities, it comes with significant risks that every participant should understand:' },
        { type: 'list', items: [
          'Smart contract risk — Bugs in code can lead to loss of funds. Always use audited protocols.',
          'Impermanent loss — Liquidity providers can lose value when token prices change significantly.',
          'Oracle manipulation — Price feeds can be exploited, leading to incorrect liquidations or trades.',
          'Regulatory uncertainty — Governments worldwide are still developing frameworks for DeFi regulation.',
          'Rug pulls — Unaudited projects may be designed to steal user funds.',
        ]},
        { type: 'h2', text: 'The Future of DeFi' },
        { type: 'p', text: 'DeFi is still in its early stages but growing rapidly. Total Value Locked (TVL) in DeFi protocols has reached tens of billions of dollars. As layer 2 scaling solutions reduce transaction costs and improve speed, DeFi is becoming accessible to a much wider audience beyond crypto-native users.' },
        { type: 'p', text: 'The convergence of DeFi with traditional finance (sometimes called "TradFi") through tokenized real-world assets, on-chain credit scoring, and institutional DeFi platforms suggests a future where the boundary between decentralized and traditional finance increasingly blurs.' },
      ],
      related: ['what-is-ethereum', 'what-is-staking'],
    },
    'what-is-staking': {
      icon: Wallet,
      title: 'What is Staking?',
      tag: 'Intermediate',
      color: '#9945ff',
      readTime: '6 min read',
      content: [
        { type: 'p', text: 'Staking is the process of locking up your cryptocurrency to support the operations of a blockchain network. In return for helping secure the network, stakers earn rewards — similar to earning interest on a savings account, but often at much higher rates. It\'s one of the most popular ways to earn passive income in the crypto space.' },
        { type: 'h2', text: 'How Proof-of-Stake Works' },
        { type: 'p', text: 'Proof-of-Stake (PoS) is a consensus mechanism that blockchains use to validate transactions and create new blocks. Unlike Proof-of-Work (used by Bitcoin), which requires energy-intensive mining, PoS selects validators based on how much cryptocurrency they\'ve "staked" as collateral.' },
        { type: 'p', text: 'Validators are chosen to propose and verify new blocks proportionally to their stake. If a validator behaves honestly, they earn rewards. If they act maliciously (like trying to approve fraudulent transactions), their staked assets can be "slashed" — partially or fully confiscated as a penalty.' },
        { type: 'h2', text: 'Ways to Stake' },
        { type: 'list', items: [
          'Solo staking — Running your own validator node (requires technical knowledge and minimum stake, e.g., 32 ETH for Ethereum).',
          'Delegated staking — Delegating your tokens to an existing validator who runs the infrastructure on your behalf.',
          'Liquid staking — Staking through protocols like Lido that give you a liquid token (stETH) representing your staked position, which you can use in DeFi.',
          'Exchange staking — The simplest method: stake directly through platforms like Uniswap V4, which handles the technical details for you.',
        ]},
        { type: 'h2', text: 'Popular Staking Coins' },
        { type: 'p', text: 'Many major cryptocurrencies support staking, each with different reward rates and lock-up periods:' },
        { type: 'list', items: [
          'Ethereum (ETH) — The largest PoS network. Typical APY: 3-5%.',
          'Solana (SOL) — High-performance blockchain. Typical APY: 6-8%.',
          'Cardano (ADA) — Research-driven blockchain. Typical APY: 4-6%.',
          'Polkadot (DOT) — Multi-chain interoperability. Typical APY: 10-14%.',
          'Cosmos (ATOM) — Internet of blockchains. Typical APY: 15-20%.',
        ]},
        { type: 'h2', text: 'Risks and Considerations' },
        { type: 'p', text: 'While staking is generally considered lower-risk than active trading, there are important factors to consider. Lock-up periods mean you may not be able to access your funds immediately. Token price volatility can offset staking rewards — if the price drops 30% while you earn 5% in staking rewards, you\'re still at a net loss in fiat terms.' },
        { type: 'p', text: 'Additionally, validator risks (slashing, downtime), smart contract risks in liquid staking protocols, and potential changes in reward rates should all be factored into your staking strategy. Always diversify and never stake more than you can afford to have locked up.' },
      ],
      related: ['understanding-defi', 'what-is-ethereum'],
    },
    'nfts-explained': {
      icon: Zap,
      title: 'NFTs Explained',
      tag: 'Beginner',
      color: '#e6007a',
      readTime: '7 min read',
      content: [
        { type: 'p', text: 'Non-Fungible Tokens (NFTs) are unique digital assets stored on a blockchain that represent ownership of a specific item — whether that\'s digital art, music, virtual real estate, gaming items, or even real-world assets. Unlike cryptocurrencies such as Bitcoin or Ethereum where each coin is identical and interchangeable, each NFT is one-of-a-kind.' },
        { type: 'h2', text: 'What Makes NFTs Unique?' },
        { type: 'p', text: '"Fungible" means interchangeable — one dollar bill is the same as another. "Non-fungible" means unique and irreplaceable. The Mona Lisa is non-fungible; a print of it is not the same as the original. NFTs bring this concept of provable uniqueness to the digital world.' },
        { type: 'p', text: 'Each NFT has a unique identifier recorded on the blockchain, along with metadata about what it represents, who created it, and its complete ownership history. This creates an immutable record of authenticity and provenance that was previously impossible for digital items.' },
        { type: 'h2', text: 'Popular NFT Use Cases' },
        { type: 'list', items: [
          'Digital Art — Artists like Beeple have sold NFT artworks for millions. NFTs allow digital artists to sell original works with provable scarcity.',
          'Gaming — In-game items, characters, and virtual land can be owned as NFTs, allowing players to truly own and trade their digital possessions.',
          'Music & Entertainment — Musicians can sell limited edition albums, concert tickets, and exclusive content directly to fans.',
          'Virtual Real Estate — Platforms like Decentraland and The Sandbox sell virtual land parcels as NFTs.',
          'Identity & Credentials — NFTs can represent diplomas, certificates, membership passes, and professional credentials.',
          'Real-World Assets — Tokenizing real estate, luxury goods, and collectibles as NFTs for fractional ownership.',
        ]},
        { type: 'h2', text: 'How NFTs Work Technically' },
        { type: 'p', text: 'Most NFTs are created (or "minted") on the Ethereum blockchain using token standards like ERC-721 (for unique items) or ERC-1155 (for semi-fungible items). The minting process creates a smart contract that records the token\'s metadata and ownership on the blockchain.' },
        { type: 'p', text: 'Important note: the NFT itself is typically just a token pointing to the digital asset, which may be stored on decentralized storage (IPFS, Arweave) or centralized servers. The robustness of the storage method matters — if the server hosting the artwork goes down, the NFT might point to nothing.' },
        { type: 'h2', text: 'The NFT Market Today' },
        { type: 'p', text: 'The NFT market experienced explosive growth in 2021-2022, followed by a significant correction. However, the underlying technology continues to evolve with practical applications in gaming, identity verification, ticketing, and supply chain management gaining traction.' },
        { type: 'p', text: 'If you\'re interested in NFTs, start by understanding the ecosystem, researching projects thoroughly, and never invest more than you can afford to lose. The space is highly speculative, and the majority of NFT projects won\'t retain value over time. Focus on utility, community, and the team behind each project.' },
      ],
      related: ['what-is-ethereum', 'understanding-defi'],
    },
  },
  it: {
    'what-is-bitcoin': {
      icon: BookOpen,
      title: "Cos'è Bitcoin?",
      tag: 'Principiante',
      color: '#f7931a',
      readTime: '6 min di lettura',
      content: [
        { type: 'p', text: 'Bitcoin (BTC) è la prima e più conosciuta criptovaluta al mondo. Lanciato nel 2009 dallo sviluppatore pseudonimo Satoshi Nakamoto, Bitcoin ha introdotto il concetto di valuta digitale decentralizzata che opera senza banche centrali o intermediari.' },
        { type: 'h2', text: 'Come funziona Bitcoin' },
        { type: 'p', text: 'Alla base, Bitcoin utilizza una tecnologia chiamata blockchain — un registro distribuito che registra ogni transazione su una rete di migliaia di computer in tutto il mondo. Quando invii Bitcoin a qualcuno, la transazione viene trasmessa alla rete, verificata dai miner attraverso un processo chiamato proof-of-work, e poi registrata permanentemente sulla blockchain.' },
        { type: 'p', text: 'Ogni blocco nella blockchain contiene un gruppo di transazioni ed è collegato crittograficamente al blocco precedente, creando una catena immutabile di registrazioni. Questo rende praticamente impossibile alterare le transazioni passate, garantendo l\'integrità dell\'intero sistema.' },
        { type: 'h2', text: 'Perché Bitcoin è importante' },
        { type: 'p', text: 'Bitcoin è stato creato in risposta alla crisi finanziaria globale del 2008. La sua innovazione chiave è l\'eliminazione della necessità di terze parti fidate nelle transazioni finanziarie. Ciò significa che puoi inviare valore a chiunque nel mondo senza bisogno di una banca, processore di pagamenti o approvazione governativa.' },
        { type: 'list', items: [
          'Decentralizzato — Nessuna entità singola controlla Bitcoin',
          'Offerta limitata — Esisteranno solo 21 milioni di BTC, rendendolo deflazionistico',
          'Senza confini — Invia denaro ovunque in minuti, non giorni',
          'Trasparente — Tutte le transazioni sono verificabili pubblicamente sulla blockchain',
          'Resistente alla censura — Nessuno può congelare o confiscare i tuoi Bitcoin',
        ]},
        { type: 'h2', text: 'Bitcoin come Oro Digitale' },
        { type: 'p', text: 'Molti investitori vedono Bitcoin come "oro digitale" — una riserva di valore che protegge dall\'inflazione e dalla svalutazione della valuta. Come l\'oro, Bitcoin è scarso (limitato a 21 milioni), durevole, fungibile e divisibile (fino a 8 cifre decimali, chiamate "satoshi").' },
        { type: 'p', text: 'L\'adozione istituzionale è accelerata drasticamente, con grandi aziende, hedge fund e persino nazioni sovrane che aggiungono Bitcoin ai loro bilanci. L\'approvazione degli ETF Bitcoin nei mercati tradizionali lo ha ulteriormente legittimato come classe di asset.' },
        { type: 'h2', text: 'Iniziare con Bitcoin' },
        { type: 'p', text: 'Per iniziare a usare Bitcoin, hai bisogno di un portafoglio — un software che memorizza le tue chiavi private e ti permette di inviare e ricevere BTC. I portafogli sono disponibili in diverse forme: app mobili, software desktop, dispositivi hardware e piattaforme web come Uniswap V4.' },
        { type: 'p', text: 'Quando acquisti Bitcoin su un exchange, puoi tenerlo nel portafoglio dell\'exchange per comodità o trasferirlo su un portafoglio personale per la massima sicurezza. Ricorda sempre: le tue chiavi private sono l\'unico modo per accedere ai tuoi Bitcoin. Se le perdi, i tuoi fondi saranno persi per sempre.' },
      ],
      related: ['what-is-ethereum', 'secure-your-crypto'],
    },
    'what-is-ethereum': {
      icon: Layers,
      title: "Cos'è Ethereum?",
      tag: 'Principiante',
      color: '#627eea',
      readTime: '7 min di lettura',
      content: [
        { type: 'p', text: 'Ethereum è una piattaforma blockchain decentralizzata e open-source che consente agli sviluppatori di costruire e distribuire smart contract e applicazioni decentralizzate (dApp). Creato da Vitalik Buterin e lanciato nel 2015, Ethereum va oltre il semplice trasferimento di valore per diventare un computer mondiale programmabile.' },
        { type: 'h2', text: 'Oltre la Valuta Digitale' },
        { type: 'p', text: 'Mentre Bitcoin è stato progettato principalmente come sistema di cassa elettronico peer-to-peer, Ethereum è stato costruito come piattaforma per la computazione decentralizzata. La sua criptovaluta nativa, Ether (ETH), viene utilizzata per pagare le commissioni di transazione e i servizi computazionali sulla rete, ma il vero potere di Ethereum risiede nella sua capacità di smart contract.' },
        { type: 'h2', text: 'Gli Smart Contract Spiegati' },
        { type: 'p', text: 'Gli smart contract sono programmi auto-eseguibili memorizzati sulla blockchain che applicano automaticamente le regole concordate quando vengono soddisfatte condizioni specifiche. Pensali come accordi digitali che funzionano esattamente come programmati — senza interruzioni, censura, frode o interferenza di terze parti.' },
        { type: 'p', text: 'Ad esempio, uno smart contract potrebbe rilasciare automaticamente i fondi a un venditore una volta che l\'acquirente conferma la ricezione della merce, o distribuire pagamenti assicurativi quando determinate condizioni meteorologiche vengono rilevate dagli oracoli.' },
        { type: 'h2', text: 'L\'Ecosistema Ethereum' },
        { type: 'p', text: 'Ethereum ha dato vita a un enorme ecosistema di applicazioni e protocolli:' },
        { type: 'list', items: [
          'DeFi (Finanza Decentralizzata) — Prestiti, prestiti e trading senza banche',
          'NFT (Token Non Fungibili) — Asset digitali unici per arte, gaming e identità',
          'DAO (Organizzazioni Autonome Decentralizzate) — Entità governate dalla comunità',
          'Soluzioni Layer 2 — Tecnologie di scalabilità come Optimism e Arbitrum',
          'Stablecoin — Token ancorati alle valute fiat come USDC e DAI',
        ]},
        { type: 'h2', text: 'Ethereum 2.0 e il Proof of Stake' },
        { type: 'p', text: 'A settembre 2022, Ethereum ha completato "The Merge" — una transizione storica dal mining proof-of-work ad alto consumo energetico al consenso proof-of-stake. Questo ha ridotto il consumo energetico di Ethereum di circa il 99,95% e ha gettato le basi per futuri miglioramenti di scalabilità.' },
        { type: 'p', text: 'Con il proof-of-stake, i validatori mettono in gioco i loro ETH come garanzia per partecipare alla validazione dei blocchi. Questo rende la rete più sostenibile dal punto di vista ambientale mantenendo una sicurezza robusta. Gli staker possono guadagnare rendimenti sui loro ETH contribuendo a proteggere la rete.' },
        { type: 'h2', text: 'ETH come Investimento' },
        { type: 'p', text: 'ETH è la seconda criptovaluta per capitalizzazione di mercato. La sua proposta di valore deriva dalla sua utilità come "carburante" che alimenta la piattaforma di smart contract più attiva al mondo. Man mano che più applicazioni si costruiscono su Ethereum, la domanda di ETH per pagare le commissioni gas aumenta, potenzialmente guidando l\'apprezzamento del valore a lungo termine.' },
      ],
      related: ['what-is-bitcoin', 'understanding-defi'],
    },
    'secure-your-crypto': {
      icon: Shield,
      title: 'Come Proteggere le Tue Crypto',
      tag: 'Sicurezza',
      color: '#22c55e',
      readTime: '8 min di lettura',
      content: [
        { type: 'p', text: 'La sicurezza delle criptovalute è una tua responsabilità personale. A differenza del sistema bancario tradizionale dove le istituzioni proteggono i tuoi depositi, nel mondo crypto sei la tua banca. Questa guida copre le pratiche essenziali per proteggere i tuoi asset digitali da hacker, truffe ed errori umani.' },
        { type: 'h2', text: 'Capire i Portafogli Crypto' },
        { type: 'p', text: 'Il tuo portafoglio crypto in realtà non conserva le tue monete — conserva le tue chiavi private, che dimostrano la proprietà dei tuoi fondi sulla blockchain. Esistono due categorie principali di portafogli:' },
        { type: 'list', items: [
          'Hot wallet — Connessi a internet (app mobili, estensioni browser, portafogli exchange). Comodi ma più vulnerabili.',
          'Cold wallet — Archiviazione offline (hardware wallet come Ledger o Trezor, paper wallet). Massima sicurezza per i tuoi investimenti a lungo termine.',
        ]},
        { type: 'h2', text: 'Pratiche di Sicurezza Essenziali' },
        { type: 'p', text: '1. Attiva l\'Autenticazione a Due Fattori (2FA): Attiva sempre il 2FA su ogni account crypto. Usa un\'app di autenticazione (Google Authenticator, Authy) invece del 2FA basato su SMS, che è vulnerabile agli attacchi di SIM-swapping.' },
        { type: 'p', text: '2. Proteggi la Tua Seed Phrase: Quando crei un portafoglio, ricevi una frase seed di 12 o 24 parole. Questa è la chiave master di tutti i tuoi fondi. Scrivila su carta (mai conservarla digitalmente), tienila in una cassaforte ignifuga e non condividerla mai con nessuno.' },
        { type: 'p', text: '3. Usa Hardware Wallet per Grandi Somme: Se detieni un valore significativo in crypto, investi in un hardware wallet. Questi dispositivi conservano le tue chiavi private offline, rendendole immuni ai tentativi di hacking online.' },
        { type: 'p', text: '4. Verifica Tutto: Controlla sempre due volte gli indirizzi del portafoglio prima di inviare transazioni. Il malware può sostituire gli indirizzi degli appunti con l\'indirizzo di un hacker.' },
        { type: 'h2', text: 'Truffe Comuni da Evitare' },
        { type: 'list', items: [
          'Siti di phishing — Siti falsi di exchange o portafogli che rubano le tue credenziali. Salva sempre gli URL ufficiali nei preferiti.',
          'Assistenza clienti falsa — Truffatori che si spacciano per staff di supporto sui social media. Il vero supporto non chiede mai le chiavi private.',
          'Schemi pump and dump — Gruppi che gonfiano artificialmente il prezzo di una moneta, poi vendono in massa.',
          'Rug pull — Progetti DeFi che scompaiono con i fondi degli investitori.',
          'Truffe giveaway — "Invia 1 BTC, ricevi 2 indietro" è sempre una truffa, senza eccezioni.',
        ]},
        { type: 'h2', text: 'Consigli per la Sicurezza sugli Exchange' },
        { type: 'p', text: 'Quando usi exchange centralizzati come Uniswap V4, prendi precauzioni aggiuntive: usa una password unica e forte (16+ caratteri), attiva la whitelist degli indirizzi di prelievo, imposta codici anti-phishing e rivedi regolarmente le tue sessioni attive.' },
      ],
      related: ['what-is-bitcoin', 'what-is-staking'],
    },
    'understanding-defi': {
      icon: TrendingUp,
      title: 'Capire la DeFi',
      tag: 'Avanzato',
      color: '#3772ff',
      readTime: '8 min di lettura',
      content: [
        { type: 'p', text: 'La Finanza Decentralizzata (DeFi) rappresenta una delle innovazioni più trasformative nella finanza moderna. È un ecosistema di applicazioni finanziarie costruite sulla tecnologia blockchain che ricrea i servizi finanziari tradizionali — prestiti, trading, assicurazioni — senza intermediari centralizzati come banche o broker.' },
        { type: 'h2', text: 'Come Funziona la DeFi' },
        { type: 'p', text: 'I protocolli DeFi sono alimentati da smart contract su blockchain come Ethereum. Questi programmi auto-eseguibili gestiscono tutto, dai pool di prestito alle coppie di trading, automaticamente. Gli utenti interagiscono direttamente con questi protocolli attraverso i loro portafogli crypto, mantenendo la piena custodia dei loro asset durante tutto il processo.' },
        { type: 'p', text: 'A differenza della finanza tradizionale dove una banca detiene il tuo denaro e decide chi ottiene i prestiti, la DeFi utilizza algoritmi e governance comunitaria per gestire il rischio, impostare i tassi di interesse e facilitare le transazioni.' },
        { type: 'h2', text: 'Categorie Chiave della DeFi' },
        { type: 'list', items: [
          'Exchange Decentralizzati (DEX) — Piattaforme come Uniswap e SushiSwap ti permettono di scambiare token direttamente dal tuo portafoglio.',
          'Prestiti — Protocolli come Aave e Compound ti permettono di guadagnare interessi prestando le tue crypto o di prendere in prestito usando le tue partecipazioni come garanzia.',
          'Yield Farming — Strategie per massimizzare i rendimenti spostando asset tra protocolli.',
          'Stablecoin — Token ancorati alle valute fiat (come USDC o DAI) che forniscono stabilità.',
          'Derivati — Piattaforme che offrono futures, opzioni e asset sintetici.',
        ]},
        { type: 'h2', text: 'Rischi nella DeFi' },
        { type: 'list', items: [
          'Rischio smart contract — Bug nel codice possono portare alla perdita di fondi. Usa sempre protocolli verificati.',
          'Impermanent loss — I fornitori di liquidità possono perdere valore quando i prezzi dei token cambiano significativamente.',
          'Manipolazione degli oracoli — I feed di prezzo possono essere sfruttati, portando a liquidazioni o scambi errati.',
          'Incertezza normativa — I governi di tutto il mondo stanno ancora sviluppando quadri normativi per la DeFi.',
          'Rug pull — Progetti non verificati possono essere progettati per rubare i fondi degli utenti.',
        ]},
        { type: 'h2', text: 'Il Futuro della DeFi' },
        { type: 'p', text: 'La DeFi è ancora nelle sue fasi iniziali ma sta crescendo rapidamente. Il Valore Totale Bloccato (TVL) nei protocolli DeFi ha raggiunto decine di miliardi di dollari. Man mano che le soluzioni di scalabilità Layer 2 riducono i costi di transazione e migliorano la velocità, la DeFi diventa accessibile a un pubblico molto più ampio.' },
        { type: 'p', text: 'La convergenza della DeFi con la finanza tradizionale attraverso asset tokenizzati del mondo reale, credit scoring on-chain e piattaforme DeFi istituzionali suggerisce un futuro in cui il confine tra finanza decentralizzata e tradizionale si sfuma sempre più.' },
      ],
      related: ['what-is-ethereum', 'what-is-staking'],
    },
    'what-is-staking': {
      icon: Wallet,
      title: "Cos'è lo Staking?",
      tag: 'Intermedio',
      color: '#9945ff',
      readTime: '6 min di lettura',
      content: [
        { type: 'p', text: 'Lo staking è il processo di bloccare le tue criptovalute per supportare le operazioni di una rete blockchain. In cambio del contributo alla sicurezza della rete, gli staker guadagnano ricompense — simile a guadagnare interessi su un conto di risparmio, ma spesso a tassi molto più alti.' },
        { type: 'h2', text: 'Come Funziona il Proof-of-Stake' },
        { type: 'p', text: 'Il Proof-of-Stake (PoS) è un meccanismo di consenso che le blockchain usano per validare le transazioni e creare nuovi blocchi. A differenza del Proof-of-Work (usato da Bitcoin), che richiede mining ad alto consumo energetico, il PoS seleziona i validatori in base a quanta criptovaluta hanno "messo in gioco" come garanzia.' },
        { type: 'p', text: 'I validatori vengono scelti per proporre e verificare nuovi blocchi in proporzione al loro stake. Se un validatore si comporta onestamente, guadagna ricompense. Se agisce malevolmente, i suoi asset in staking possono essere "tagliati" — parzialmente o completamente confiscati come penalità.' },
        { type: 'h2', text: 'Modi per Fare Staking' },
        { type: 'list', items: [
          'Staking in solitaria — Gestire il proprio nodo validatore (richiede conoscenze tecniche e stake minimo, es. 32 ETH per Ethereum).',
          'Staking delegato — Delegare i tuoi token a un validatore esistente che gestisce l\'infrastruttura per tuo conto.',
          'Liquid staking — Staking attraverso protocolli come Lido che ti danno un token liquido (stETH) rappresentante la tua posizione in staking.',
          'Staking su exchange — Il metodo più semplice: fai staking direttamente attraverso piattaforme come Uniswap V4.',
        ]},
        { type: 'h2', text: 'Monete Popolari per lo Staking' },
        { type: 'list', items: [
          'Ethereum (ETH) — La più grande rete PoS. APY tipico: 3-5%.',
          'Solana (SOL) — Blockchain ad alte prestazioni. APY tipico: 6-8%.',
          'Cardano (ADA) — Blockchain basata sulla ricerca. APY tipico: 4-6%.',
          'Polkadot (DOT) — Interoperabilità multi-chain. APY tipico: 10-14%.',
          'Cosmos (ATOM) — Internet delle blockchain. APY tipico: 15-20%.',
        ]},
        { type: 'h2', text: 'Rischi e Considerazioni' },
        { type: 'p', text: 'Sebbene lo staking sia generalmente considerato a rischio inferiore rispetto al trading attivo, ci sono fattori importanti da considerare. I periodi di blocco significano che potresti non essere in grado di accedere ai tuoi fondi immediatamente. La volatilità del prezzo del token può compensare le ricompense dello staking.' },
        { type: 'p', text: 'Inoltre, i rischi dei validatori (slashing, downtime), i rischi degli smart contract nei protocolli di liquid staking e i potenziali cambiamenti nei tassi di ricompensa dovrebbero essere tutti considerati nella tua strategia. Diversifica sempre e non mettere mai in staking più di quanto puoi permetterti di avere bloccato.' },
      ],
      related: ['understanding-defi', 'what-is-ethereum'],
    },
    'nfts-explained': {
      icon: Zap,
      title: 'NFT Spiegati',
      tag: 'Principiante',
      color: '#e6007a',
      readTime: '7 min di lettura',
      content: [
        { type: 'p', text: 'I Token Non Fungibili (NFT) sono asset digitali unici memorizzati su una blockchain che rappresentano la proprietà di un elemento specifico — che si tratti di arte digitale, musica, immobili virtuali, oggetti di gioco o persino asset del mondo reale. A differenza delle criptovalute come Bitcoin o Ethereum dove ogni moneta è identica e intercambiabile, ogni NFT è unico nel suo genere.' },
        { type: 'h2', text: 'Cosa Rende gli NFT Unici?' },
        { type: 'p', text: '"Fungibile" significa intercambiabile — una banconota da un euro è uguale a un\'altra. "Non fungibile" significa unico e insostituibile. La Monna Lisa è non fungibile; una stampa di essa non è la stessa cosa dell\'originale. Gli NFT portano questo concetto di unicità dimostrabile nel mondo digitale.' },
        { type: 'p', text: 'Ogni NFT ha un identificatore unico registrato sulla blockchain, insieme ai metadati su cosa rappresenta, chi lo ha creato e la sua storia completa di proprietà. Questo crea un registro immutabile di autenticità e provenienza.' },
        { type: 'h2', text: 'Casi d\'Uso Popolari degli NFT' },
        { type: 'list', items: [
          'Arte Digitale — Artisti come Beeple hanno venduto opere NFT per milioni. Gli NFT permettono agli artisti digitali di vendere opere originali con scarsità dimostrabile.',
          'Gaming — Oggetti di gioco, personaggi e terreni virtuali possono essere posseduti come NFT, permettendo ai giocatori di possedere e scambiare veramente i loro beni digitali.',
          'Musica e Intrattenimento — I musicisti possono vendere album in edizione limitata, biglietti per concerti e contenuti esclusivi direttamente ai fan.',
          'Immobili Virtuali — Piattaforme come Decentraland e The Sandbox vendono parcelle di terreno virtuale come NFT.',
          'Identità e Credenziali — Gli NFT possono rappresentare diplomi, certificati e pass di appartenenza.',
          'Asset del Mondo Reale — Tokenizzazione di immobili, beni di lusso e collezionabili come NFT per la proprietà frazionata.',
        ]},
        { type: 'h2', text: 'Come Funzionano Tecnicamente gli NFT' },
        { type: 'p', text: 'La maggior parte degli NFT viene creata (o "mintata") sulla blockchain Ethereum utilizzando standard di token come ERC-721 (per oggetti unici) o ERC-1155 (per oggetti semi-fungibili). Il processo di minting crea uno smart contract che registra i metadati e la proprietà del token sulla blockchain.' },
        { type: 'p', text: 'Nota importante: l\'NFT stesso è tipicamente solo un token che punta all\'asset digitale, che può essere memorizzato su archiviazione decentralizzata (IPFS, Arweave) o server centralizzati. La robustezza del metodo di archiviazione è importante.' },
        { type: 'h2', text: 'Il Mercato NFT Oggi' },
        { type: 'p', text: 'Il mercato NFT ha sperimentato una crescita esplosiva nel 2021-2022, seguita da una correzione significativa. Tuttavia, la tecnologia sottostante continua a evolversi con applicazioni pratiche in gaming, verifica dell\'identità, biglietteria e gestione della supply chain.' },
        { type: 'p', text: 'Se sei interessato agli NFT, inizia capendo l\'ecosistema, ricercando i progetti a fondo e non investire mai più di quanto puoi permetterti di perdere. Lo spazio è altamente speculativo e la maggior parte dei progetti NFT non manterrà valore nel tempo.' },
      ],
      related: ['what-is-ethereum', 'understanding-defi'],
    },
  },
};

// Title mapping for related articles
const titleMap = {
  en: {
    'what-is-bitcoin': 'What is Bitcoin?',
    'what-is-ethereum': 'What is Ethereum?',
    'secure-your-crypto': 'How to Secure Your Crypto',
    'understanding-defi': 'Understanding DeFi',
    'what-is-staking': 'What is Staking?',
    'nfts-explained': 'NFTs Explained',
  },
  it: {
    'what-is-bitcoin': "Cos'è Bitcoin?",
    'what-is-ethereum': "Cos'è Ethereum?",
    'secure-your-crypto': 'Come Proteggere le Tue Crypto',
    'understanding-defi': 'Capire la DeFi',
    'what-is-staking': "Cos'è lo Staking?",
    'nfts-explained': 'NFT Spiegati',
  },
};

const LearnArticlePage = () => {
  const { slug } = useParams();
  const { lang } = useLang();
  const articles = articlesData[lang] || articlesData.en;
  const article = articles[slug];
  const titles = titleMap[lang] || titleMap.en;

  if (!article) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <div className="rk-content" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--r-onsurface)', marginBottom: 16 }}>
            {lang === 'it' ? 'Articolo non trovato' : 'Article Not Found'}
          </h1>
          <p style={{ fontSize: 16, color: 'var(--r-text)', marginBottom: 24 }}>
            {lang === 'it' ? "L'articolo che cerchi non esiste." : "The article you're looking for doesn't exist."}
          </p>
          <Link to="/learn" style={{ color: '#3772ff', fontWeight: 600, fontSize: 15 }}>
            <ArrowLeft size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            {lang === 'it' ? 'Torna a Impara' : 'Back to Learn'}
          </Link>
        </div>
      </div>
    );
  }

  const Icon = article.icon;

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="rk-content" style={{ maxWidth: 780, margin: '0 auto' }}>

        {/* Back link */}
        <Link
          to="/learn"
          data-testid="learn-back-link"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: '#3772ff', fontWeight: 600, fontSize: 14, marginBottom: 28,
            textDecoration: 'none', transition: 'opacity 0.15s',
          }}
        >
          <ArrowLeft size={16} />
          {lang === 'it' ? 'Torna a Impara' : 'Back to Learn'}
        </Link>

        {/* Hero Section */}
        <div style={{
          background: `linear-gradient(135deg, ${article.color}12, ${article.color}06)`,
          borderRadius: 20, padding: '36px 32px', marginBottom: 36,
          border: `1px solid ${article.color}20`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: `${article.color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon style={{ width: 26, height: 26, color: article.color }} />
            </div>
            <div>
              <span className="rk-badge" style={{ background: `${article.color}15`, color: article.color, marginBottom: 4, display: 'inline-block' }}>
                {article.tag}
              </span>
            </div>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: 'var(--r-onsurface)', lineHeight: 1.3, marginBottom: 12 }}>
            {article.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'var(--r-text)', fontSize: 13 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={14} /> {article.readTime}
            </span>
            <span>Uniswap V4 {lang === 'it' ? 'Accademia' : 'Academy'}</span>
          </div>
        </div>

        {/* Article Body */}
        <div className="learn-article-body" style={{ marginBottom: 48 }}>
          {article.content.map((block, idx) => {
            if (block.type === 'h2') {
              return (
                <h2 key={idx} style={{
                  fontSize: 22, fontWeight: 700, color: 'var(--r-onsurface)',
                  marginTop: 36, marginBottom: 16, lineHeight: 1.3,
                }}>
                  {block.text}
                </h2>
              );
            }
            if (block.type === 'p') {
              return (
                <p key={idx} style={{
                  fontSize: 16, lineHeight: 1.8, color: 'var(--r-text)',
                  marginBottom: 16,
                }}>
                  {block.text}
                </p>
              );
            }
            if (block.type === 'list') {
              return (
                <ul key={idx} style={{
                  margin: '16px 0', paddingLeft: 24,
                  listStyleType: 'none',
                }}>
                  {block.items.map((item, i) => (
                    <li key={i} style={{
                      fontSize: 15, lineHeight: 1.7, color: 'var(--r-text)',
                      marginBottom: 10, paddingLeft: 12,
                      position: 'relative',
                    }}>
                      <span style={{
                        position: 'absolute', left: -12, top: 10,
                        width: 6, height: 6, borderRadius: '50%',
                        background: article.color, display: 'inline-block',
                      }} />
                      {item}
                    </li>
                  ))}
                </ul>
              );
            }
            return null;
          })}
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--r-line)', margin: '36px 0' }} />

        {/* Related Articles */}
        {article.related && article.related.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--r-onsurface)', marginBottom: 20 }}>
              {lang === 'it' ? 'Articoli Correlati' : 'Related Articles'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {article.related.map((relSlug) => {
                const relArticle = articles[relSlug];
                if (!relArticle) return null;
                const RelIcon = relArticle.icon;
                return (
                  <Link
                    key={relSlug}
                    to={`/learn/${relSlug}`}
                    data-testid={`related-${relSlug}`}
                    className="rk-card rk-card-clickable"
                    style={{ padding: 20, textDecoration: 'none', display: 'block', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: `${relArticle.color}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <RelIcon style={{ width: 18, height: 18, color: relArticle.color }} />
                      </div>
                      <span className="rk-badge" style={{ background: `${relArticle.color}15`, color: relArticle.color, fontSize: 11 }}>
                        {relArticle.tag}
                      </span>
                    </div>
                    <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--r-onsurface)', marginBottom: 4 }}>
                      {titles[relSlug] || relArticle.title}
                    </h4>
                    <span style={{ fontSize: 13, color: '#3772ff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {lang === 'it' ? 'Leggi' : 'Read'} <ChevronRight size={14} />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LearnArticlePage;
