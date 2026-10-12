import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/i18n';
import { Shield, Smartphone, Globe, Key, Clock, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import './RockieWallet.css';

const SecurityPage = () => {
  const { user } = useAuth();
  const { lang } = useLang();
  const [twoFA, setTwoFA] = useState(false);

  const t = lang === 'it' ? {
    title: 'Centro Sicurezza',
    subtitle: 'Gestisci la sicurezza del tuo account',
    twoFA: 'Autenticazione a Due Fattori (2FA)',
    twoFADesc: 'Aggiungi un ulteriore livello di sicurezza al tuo account richiedendo un codice di verifica oltre alla password.',
    enabled: 'Attivata', disabled: 'Disattivata', enable: 'Attiva', disable: 'Disattiva',
    loginHistory: 'Cronologia Accessi',
    devices: 'Dispositivi Autorizzati',
    passwordSecurity: 'Sicurezza Password',
    passwordDesc: 'Ultima modifica: oltre 30 giorni fa',
    changePassword: 'Cambia Password',
    antiPhishing: 'Codice Anti-Phishing',
    antiPhishingDesc: 'Imposta un codice unico che apparirà in tutte le nostre email per verificare che provengano da Uniswap V4.',
    notSet: 'Non impostato',
    securityLevel: 'Livello di Sicurezza',
    medium: 'Medio',
    recommendation: 'Consiglio: Attiva il 2FA per proteggere meglio il tuo account.',
  } : {
    title: 'Security Center',
    subtitle: 'Manage your account security',
    twoFA: 'Two-Factor Authentication (2FA)',
    twoFADesc: 'Add an extra layer of security to your account by requiring a verification code in addition to your password.',
    enabled: 'Enabled', disabled: 'Disabled', enable: 'Enable', disable: 'Disable',
    loginHistory: 'Login History',
    devices: 'Authorized Devices',
    passwordSecurity: 'Password Security',
    passwordDesc: 'Last changed: over 30 days ago',
    changePassword: 'Change Password',
    antiPhishing: 'Anti-Phishing Code',
    antiPhishingDesc: 'Set a unique code that will appear in all our emails to verify they come from Uniswap V4.',
    notSet: 'Not set',
    securityLevel: 'Security Level',
    medium: 'Medium',
    recommendation: 'Recommendation: Enable 2FA to better protect your account.',
  };

  const loginHistory = [
    { device: 'Chrome · Windows', ip: '185.xx.xx.42', location: lang === 'it' ? 'Milano, Italia' : 'Milan, Italy', time: '2 min ago', current: true },
    { device: 'Safari · iPhone', ip: '79.xx.xx.18', location: lang === 'it' ? 'Roma, Italia' : 'Rome, Italy', time: lang === 'it' ? '2 giorni fa' : '2 days ago', current: false },
    { device: 'Chrome · MacOS', ip: '93.xx.xx.55', location: lang === 'it' ? 'Londra, UK' : 'London, UK', time: lang === 'it' ? '5 giorni fa' : '5 days ago', current: false },
  ];

  return (
    <div style={{minHeight:'100vh'}}>
      <div className="rk-content" style={{maxWidth:900,margin:'0 auto'}}>
        <h1 className="rk-section-title" style={{fontSize:28,marginBottom:4}}>{t.title}</h1>
        <p style={{fontSize:15,color:'var(--r-text)',marginBottom:28}}>{t.subtitle}</p>

        {/* Security Level */}
        <div className="rk-card" style={{padding:20,marginBottom:20,display:'flex',alignItems:'center',gap:16}}>
          <div style={{width:48,height:48,borderRadius:'50%',background:'rgba(245,158,11,0.1)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Shield style={{width:24,height:24,color:'#f59e0b'}} />
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:16,color:'var(--r-onsurface)'}}>{t.securityLevel}: <span style={{color:'#f59e0b'}}>{t.medium}</span></div>
            <p style={{fontSize:13,color:'var(--r-text)',marginTop:2}}>{t.recommendation}</p>
          </div>
        </div>

        {/* 2FA — Currently Unavailable */}
        <div className="rk-card" style={{padding:20,marginBottom:16,opacity:0.7}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:40,height:40,borderRadius:10,background:'rgba(55,114,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Smartphone style={{width:20,height:20,color:'#3772ff'}} />
              </div>
              <div>
                <div style={{fontWeight:700,fontSize:15,color:'var(--r-onsurface)'}}>{t.twoFA}</div>
                <p style={{fontSize:13,color:'var(--r-text)',marginTop:2}}>{t.twoFADesc}</p>
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              <span className="rk-badge rk-badge-neutral" style={{marginBottom:6,display:'inline-block'}}>
                {lang === 'it' ? 'Non Disponibile' : 'Unavailable'}
              </span>
              <br/>
              <span style={{fontSize:11,color:'var(--r-text)'}}>
                {lang === 'it' ? 'Prossimamente' : 'Coming Soon'}
              </span>
            </div>
          </div>
        </div>

        {/* Password Security */}
        <div className="rk-card" style={{padding:20,marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:40,height:40,borderRadius:10,background:'rgba(245,158,11,0.1)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Key style={{width:20,height:20,color:'#f59e0b'}} />
              </div>
              <div>
                <div style={{fontWeight:700,fontSize:15,color:'var(--r-onsurface)'}}>{t.passwordSecurity}</div>
                <p style={{fontSize:13,color:'var(--r-text)',marginTop:2}}>{t.passwordDesc}</p>
              </div>
            </div>
            <button onClick={() => window.location.href='/profile'}
              style={{padding:'8px 18px',borderRadius:8,fontSize:13,fontWeight:600,border:'1px solid var(--r-line)',background:'transparent',color:'var(--r-onsurface)',cursor:'pointer'}}>
              {t.changePassword}
            </button>
          </div>
        </div>

        {/* Anti-Phishing */}
        <div className="rk-card" style={{padding:20,marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:40,height:40,borderRadius:10,background:'rgba(34,197,94,0.1)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Lock style={{width:20,height:20,color:'#22c55e'}} />
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:15,color:'var(--r-onsurface)'}}>{t.antiPhishing}</div>
              <p style={{fontSize:13,color:'var(--r-text)',marginTop:2}}>{t.antiPhishingDesc}</p>
            </div>
            <span className="rk-badge rk-badge-neutral" style={{marginLeft:'auto'}}>{t.notSet}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SecurityPage;
