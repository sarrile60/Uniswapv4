import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/i18n';
import { Shield, Smartphone, Key, Lock, Copy, CheckCircle, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import './RockieWallet.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SecurityPage = () => {
  const { user, api } = useAuth();
  const { lang } = useLang();

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Setup flow state
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupStep, setSetupStep] = useState(1); // 1=QR, 2=verify, 3=backup codes
  const [setupData, setSetupData] = useState(null); // {secret, qr_code}
  const [setupCode, setSetupCode] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);

  // Disable flow state
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);
  const [showDisablePassword, setShowDisablePassword] = useState(false);

  const it = lang === 'it';

  const t = {
    title: it ? 'Centro Sicurezza' : 'Security Center',
    subtitle: it ? 'Gestisci la sicurezza del tuo account' : 'Manage your account security',
    twoFA: it ? 'Autenticazione a Due Fattori (2FA)' : 'Two-Factor Authentication (2FA)',
    twoFADesc: it ? 'Aggiungi un ulteriore livello di sicurezza con la tua app autenticatore.' : 'Add an extra layer of security using your authenticator app.',
    enabled: it ? 'Attivata' : 'Enabled',
    disabled: it ? 'Disattivata' : 'Disabled',
    enable: it ? 'Attiva 2FA' : 'Enable 2FA',
    disable: it ? 'Disattiva 2FA' : 'Disable 2FA',
    passwordSecurity: it ? 'Sicurezza Password' : 'Password Security',
    changePassword: it ? 'Cambia Password' : 'Change Password',
    antiPhishing: it ? 'Codice Anti-Phishing' : 'Anti-Phishing Code',
    antiPhishingDesc: it ? 'Codice univoco nelle nostre email.' : 'Unique code in all our emails.',
    notSet: it ? 'Non impostato' : 'Not set',
    securityLevel: it ? 'Livello di Sicurezza' : 'Security Level',
    medium: it ? 'Medio' : 'Medium',
    high: it ? 'Alto' : 'High',
    recommendation: it ? 'Consiglio: Attiva il 2FA per proteggere meglio il tuo account.' : 'Recommendation: Enable 2FA to better protect your account.',
    // Setup modal
    setupTitle: it ? 'Configura 2FA' : 'Set Up 2FA',
    scanQR: it ? 'Scansiona il codice QR con la tua app autenticatore' : 'Scan the QR code with your authenticator app',
    manualKey: it ? 'Oppure inserisci manualmente questa chiave:' : 'Or enter this key manually:',
    next: it ? 'Avanti' : 'Next',
    verify: it ? 'Verifica' : 'Verify',
    enterCode: it ? 'Inserisci il codice a 6 cifre dalla tua app autenticatore' : 'Enter the 6-digit code from your authenticator app',
    codePlaceholder: it ? 'Codice a 6 cifre' : '6-digit code',
    backupCodesTitle: it ? '2FA Attivata! Salva i tuoi codici di backup' : '2FA Enabled! Save your backup codes',
    backupCodesDesc: it ? 'Questi codici vengono mostrati UNA SOLA VOLTA. Conservali in un posto sicuro.' : 'These codes are shown ONCE ONLY. Store them somewhere safe.',
    copyAll: it ? 'Copia tutti' : 'Copy all',
    done: it ? 'Fatto' : 'Done',
    // Disable modal
    disableTitle: it ? 'Disattiva 2FA' : 'Disable 2FA',
    disableDesc: it ? 'Inserisci la tua password attuale e un codice autenticatore per disattivare il 2FA.' : 'Enter your current password and an authenticator code to disable 2FA.',
    password: it ? 'Password attuale' : 'Current password',
    authCode: it ? 'Codice autenticatore' : 'Authenticator code',
    confirmDisable: it ? 'Disattiva 2FA' : 'Disable 2FA',
    cancel: it ? 'Annulla' : 'Cancel',
  };

  useEffect(() => {
    api.get('/2fa/status').then(res => {
      if (res.data.ok) setTwoFAEnabled(res.data.data.totp_enabled);
    }).catch(() => {}).finally(() => setLoadingStatus(false));
  }, []);

  // ── Enable 2FA flow ────────────────────────────────────────────────────────
  const startSetup = async () => {
    setSetupLoading(true);
    try {
      const res = await api.post('/2fa/setup');
      if (res.data.ok) {
        setSetupData(res.data.data);
        setSetupStep(1);
        setSetupCode('');
        setShowSetupModal(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to start 2FA setup');
    } finally {
      setSetupLoading(false);
    }
  };

  const verifySetup = async () => {
    if (setupCode.length !== 6) { toast.error(it ? 'Inserisci un codice a 6 cifre' : 'Enter a 6-digit code'); return; }
    setSetupLoading(true);
    try {
      const res = await api.post('/2fa/verify-setup', { code: setupCode });
      if (res.data.ok) {
        setBackupCodes(res.data.data.backup_codes);
        setSetupStep(3);
        setTwoFAEnabled(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid code. Please try again.');
    } finally {
      setSetupLoading(false);
    }
  };

  const closeSetup = () => {
    setShowSetupModal(false);
    setSetupData(null);
    setSetupCode('');
    setSetupStep(1);
    setBackupCodes([]);
  };

  // ── Disable 2FA flow ───────────────────────────────────────────────────────
  const confirmDisable = async () => {
    if (!disablePassword || disableCode.length !== 6) {
      toast.error(it ? 'Inserisci password e codice' : 'Enter password and code');
      return;
    }
    setDisableLoading(true);
    try {
      const res = await api.post('/2fa/disable', { password: disablePassword, code: disableCode });
      if (res.data.ok) {
        setTwoFAEnabled(false);
        setShowDisableModal(false);
        setDisablePassword(''); setDisableCode('');
        toast.success(it ? '2FA disattivata' : '2FA disabled successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to disable 2FA');
    } finally {
      setDisableLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success(it ? 'Codici copiati!' : 'Codes copied!');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:'100vh'}}>
      <div className="rk-content" style={{maxWidth:900,margin:'0 auto'}}>
        <h1 className="rk-section-title" style={{fontSize:28,marginBottom:4}}>{t.title}</h1>
        <p style={{fontSize:15,color:'var(--r-text)',marginBottom:28}}>{t.subtitle}</p>

        {/* Security Level */}
        <div className="rk-card" style={{padding:20,marginBottom:20,display:'flex',alignItems:'center',gap:16}}>
          <div style={{width:48,height:48,borderRadius:'50%',background:twoFAEnabled?'rgba(34,197,94,0.1)':'rgba(245,158,11,0.1)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Shield style={{width:24,height:24,color:twoFAEnabled?'#22c55e':'#f59e0b'}} />
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:16,color:'var(--r-onsurface)'}}>
              {t.securityLevel}: <span style={{color:twoFAEnabled?'#22c55e':'#f59e0b'}}>{twoFAEnabled?t.high:t.medium}</span>
            </div>
            <p style={{fontSize:13,color:'var(--r-text)',marginTop:2}}>
              {twoFAEnabled ? (it?'Il tuo account è protetto con 2FA.':'Your account is protected with 2FA.') : t.recommendation}
            </p>
          </div>
        </div>

        {/* 2FA Card */}
        <div className="rk-card" style={{padding:20,marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:14,flex:1}}>
              <div style={{width:40,height:40,borderRadius:10,background:'rgba(55,114,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Smartphone style={{width:20,height:20,color:'#3772ff'}} />
              </div>
              <div>
                <div style={{fontWeight:700,fontSize:15,color:'var(--r-onsurface)'}}>{t.twoFA}</div>
                <p style={{fontSize:13,color:'var(--r-text)',marginTop:2}}>{t.twoFADesc}</p>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
              {!loadingStatus && (
                <span className={`rk-badge ${twoFAEnabled?'rk-badge-success':'rk-badge-neutral'}`}>
                  {twoFAEnabled ? t.enabled : t.disabled}
                </span>
              )}
              {!loadingStatus && (
                twoFAEnabled ? (
                  <button onClick={() => setShowDisableModal(true)}
                    style={{padding:'8px 16px',borderRadius:8,fontSize:13,fontWeight:600,border:'1px solid rgba(239,68,68,0.4)',background:'rgba(239,68,68,0.06)',color:'#ef4444',cursor:'pointer'}}>
                    {t.disable}
                  </button>
                ) : (
                  <button onClick={startSetup} disabled={setupLoading}
                    style={{padding:'8px 16px',borderRadius:8,fontSize:13,fontWeight:600,border:'none',background:'#3772ff',color:'#fff',cursor:'pointer',opacity:setupLoading?0.6:1}}>
                    {setupLoading ? '...' : t.enable}
                  </button>
                )
              )}
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
                <p style={{fontSize:13,color:'var(--r-text)',marginTop:2}}>{it?'Ultima modifica: oltre 30 giorni fa':'Last changed: over 30 days ago'}</p>
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

      {/* ── 2FA Setup Modal ────────────────────────────────────────────────── */}
      {showSetupModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'var(--r-bg1,#1e2230)',borderRadius:16,border:'1px solid var(--r-line)',padding:28,maxWidth:440,width:'100%',position:'relative',maxHeight:'90vh',overflowY:'auto'}}>
            <button onClick={closeSetup} style={{position:'absolute',top:16,right:16,background:'none',border:'none',cursor:'pointer',color:'var(--r-text)'}}>
              <X className="w-5 h-5" />
            </button>

            {/* Step indicators */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:24}}>
              {[1,2,3].map(s => (
                <React.Fragment key={s}>
                  <div style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,
                    background:setupStep>=s?'#3772ff':'rgba(255,255,255,0.1)',color:setupStep>=s?'#fff':'var(--r-text)'}}>{s}</div>
                  {s<3 && <div style={{width:32,height:2,background:setupStep>s?'#3772ff':'rgba(255,255,255,0.1)'}} />}
                </React.Fragment>
              ))}
            </div>

            <h3 style={{fontWeight:700,fontSize:18,color:'var(--r-onsurface)',marginBottom:16,textAlign:'center'}}>{t.setupTitle}</h3>

            {/* Step 1: QR Code */}
            {setupStep === 1 && setupData && (
              <div style={{textAlign:'center'}}>
                <p style={{fontSize:13,color:'var(--r-text)',marginBottom:16}}>{t.scanQR}</p>
                <div style={{background:'#fff',padding:12,borderRadius:12,display:'inline-block',marginBottom:16}}>
                  <img src={`data:image/png;base64,${setupData.qr_code}`} alt="2FA QR" style={{width:200,height:200}} />
                </div>
                <p style={{fontSize:12,color:'var(--r-text)',marginBottom:8}}>{t.manualKey}</p>
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:20}}>
                  <code style={{fontSize:13,fontWeight:700,color:'#3772ff',letterSpacing:2,padding:'6px 12px',background:'rgba(55,114,255,0.08)',borderRadius:8}}>
                    {setupData.secret}
                  </code>
                  <button onClick={() => { navigator.clipboard.writeText(setupData.secret); toast.success('Copied!'); }}
                    style={{background:'none',border:'none',cursor:'pointer',color:'var(--r-text)'}}>
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={() => setSetupStep(2)}
                  style={{width:'100%',padding:'12px',borderRadius:10,background:'#3772ff',color:'#fff',fontWeight:600,fontSize:15,border:'none',cursor:'pointer'}}>
                  {t.next}
                </button>
              </div>
            )}

            {/* Step 2: Verify code */}
            {setupStep === 2 && (
              <div>
                <p style={{fontSize:13,color:'var(--r-text)',marginBottom:16,textAlign:'center'}}>{t.enterCode}</p>
                <input
                  type="text" inputMode="numeric" maxLength={6}
                  value={setupCode} onChange={e => setSetupCode(e.target.value.replace(/\D/g,''))}
                  placeholder={t.codePlaceholder}
                  style={{width:'100%',padding:'14px',fontSize:24,textAlign:'center',letterSpacing:8,borderRadius:10,
                    border:'1px solid var(--r-line)',background:'var(--r-surface)',color:'var(--r-onsurface)',
                    fontFamily:'monospace',boxSizing:'border-box',marginBottom:16}}
                  data-testid="totp-setup-code-input"
                  autoFocus
                />
                <button onClick={verifySetup} disabled={setupLoading || setupCode.length!==6}
                  style={{width:'100%',padding:'12px',borderRadius:10,background:'#3772ff',color:'#fff',fontWeight:600,fontSize:15,border:'none',
                    cursor:setupLoading||setupCode.length!==6?'not-allowed':'pointer',opacity:setupLoading||setupCode.length!==6?0.6:1}}>
                  {setupLoading ? '...' : t.verify}
                </button>
              </div>
            )}

            {/* Step 3: Backup codes */}
            {setupStep === 3 && (
              <div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,justifyContent:'center'}}>
                  <CheckCircle style={{color:'#22c55e',width:22,height:22}} />
                  <span style={{fontWeight:700,color:'#22c55e',fontSize:15}}>{t.backupCodesTitle}</span>
                </div>
                <p style={{fontSize:12,color:'#f59e0b',marginBottom:16,textAlign:'center',background:'rgba(245,158,11,0.08)',padding:'8px 12px',borderRadius:8}}>
                  ⚠️ {t.backupCodesDesc}
                </p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
                  {backupCodes.map((code,i) => (
                    <div key={i} style={{fontFamily:'monospace',fontSize:13,fontWeight:700,
                      padding:'8px 12px',background:'rgba(55,114,255,0.06)',borderRadius:8,
                      border:'1px solid rgba(55,114,255,0.15)',color:'var(--r-onsurface)',textAlign:'center',letterSpacing:2}}>
                      {code}
                    </div>
                  ))}
                </div>
                <button onClick={copyBackupCodes} style={{width:'100%',padding:'10px',borderRadius:8,
                  background:'rgba(55,114,255,0.1)',color:'#3772ff',fontWeight:600,fontSize:13,
                  border:'1px solid rgba(55,114,255,0.2)',cursor:'pointer',marginBottom:10}}>
                  <Copy className="w-4 h-4" style={{display:'inline',marginRight:6}} />{t.copyAll}
                </button>
                <button onClick={closeSetup} style={{width:'100%',padding:'12px',borderRadius:10,
                  background:'#3772ff',color:'#fff',fontWeight:600,fontSize:15,border:'none',cursor:'pointer'}}>
                  {t.done}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Disable 2FA Modal ─────────────────────────────────────────────── */}
      {showDisableModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'var(--r-bg1,#1e2230)',borderRadius:16,border:'1px solid var(--r-line)',padding:28,maxWidth:400,width:'100%',position:'relative'}}>
            <button onClick={() => { setShowDisableModal(false); setDisablePassword(''); setDisableCode(''); }}
              style={{position:'absolute',top:16,right:16,background:'none',border:'none',cursor:'pointer',color:'var(--r-text)'}}>
              <X className="w-5 h-5" />
            </button>
            <h3 style={{fontWeight:700,fontSize:18,color:'var(--r-onsurface)',marginBottom:8}}>{t.disableTitle}</h3>
            <p style={{fontSize:13,color:'var(--r-text)',marginBottom:20}}>{t.disableDesc}</p>

            <div style={{marginBottom:14}}>
              <label style={{fontSize:13,fontWeight:600,color:'var(--r-text)',display:'block',marginBottom:6}}>{t.password}</label>
              <div style={{position:'relative'}}>
                <input type={showDisablePassword?'text':'password'} value={disablePassword}
                  onChange={e => setDisablePassword(e.target.value)}
                  style={{width:'100%',padding:'10px 40px 10px 12px',borderRadius:8,border:'1px solid var(--r-line)',
                    background:'var(--r-surface)',color:'var(--r-onsurface)',fontSize:14,boxSizing:'border-box'}}
                />
                <button type="button" onClick={() => setShowDisablePassword(!showDisablePassword)}
                  style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--r-text)'}}>
                  {showDisablePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div style={{marginBottom:20}}>
              <label style={{fontSize:13,fontWeight:600,color:'var(--r-text)',display:'block',marginBottom:6}}>{t.authCode}</label>
              <input type="text" inputMode="numeric" maxLength={6} value={disableCode}
                onChange={e => setDisableCode(e.target.value.replace(/\D/g,''))}
                placeholder="000000"
                style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid var(--r-line)',
                  background:'var(--r-surface)',color:'var(--r-onsurface)',fontSize:20,textAlign:'center',
                  letterSpacing:6,fontFamily:'monospace',boxSizing:'border-box'}}
              />
            </div>

            <div style={{display:'flex',gap:10}}>
              <button onClick={() => { setShowDisableModal(false); setDisablePassword(''); setDisableCode(''); }}
                style={{flex:1,padding:'11px',borderRadius:10,border:'1px solid var(--r-line)',background:'transparent',
                  color:'var(--r-onsurface)',fontWeight:600,fontSize:14,cursor:'pointer'}}>
                {t.cancel}
              </button>
              <button onClick={confirmDisable} disabled={disableLoading||!disablePassword||disableCode.length!==6}
                style={{flex:1,padding:'11px',borderRadius:10,background:'#ef4444',color:'#fff',fontWeight:600,fontSize:14,
                  border:'none',cursor:disableLoading||!disablePassword||disableCode.length!==6?'not-allowed':'pointer',
                  opacity:disableLoading||!disablePassword||disableCode.length!==6?0.6:1}}>
                {disableLoading ? '...' : t.confirmDisable}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityPage;
