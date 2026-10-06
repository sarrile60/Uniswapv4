import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/i18n';

const content = {
  en: [
    { h: '1. Introduction', p: 'Uniswap V4 (\u201cwe\u201d, \u201cour\u201d, \u201cus\u201d) is committed to protecting and respecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our digital asset management platform and related services (collectively, the \u201cService\u201d). Uniswap V4 is a private limited company registered in England and Wales, with its registered office at 45 Queen Street, Deal, Kent, England, CT14 6EY.' },
    { h: '2. Information We Collect', p: 'We may collect: Identity Data (name, date of birth, government-issued ID); Contact Data (email, telephone); Account Data (username, password, preferences, transaction history); Verification Data (identity documents, proof of address, video selfie); Technical Data (IP address, browser, device); Usage Data (pages visited, features accessed).' },
    { h: '3. How We Use Your Information', p: 'We use your data to: create and manage your account; verify identity for AML/KYC; process transactions; communicate regarding your account; detect and prevent fraud; comply with legal obligations; improve the Service.' },
    { h: '4. Legal Basis for Processing', p: 'We process under the UK GDPR and Data Protection Act 2018: (a) performance of a contract; (b) legal obligation compliance; (c) legitimate interests; (d) consent.' },
    { h: '5. Data Sharing', p: 'We may share with: Service Providers (hosting, email, identity verification); Regulatory Authorities (where required by law); Professional Advisors (lawyers, auditors). We do not sell your personal data.' },
    { h: '6. Data Retention', p: 'We retain data only as long as necessary for the purposes collected, including legal, regulatory, accounting, or reporting requirements.' },
    { h: '7. Data Security', p: 'We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction.' },
    { h: '8. Your Rights', p: 'You have the right to: access your data; request correction; request erasure; object to or restrict processing; request portability; withdraw consent. Contact info@uniswapv4.com.' },
    { h: '9. Cookies', p: 'We use essential cookies for session management and authentication. No third-party tracking or advertising cookies.' },
    { h: '10. Changes', p: 'We may update this policy from time to time. Material changes will be posted on this page.' },
    { h: '11. Contact Us', p: 'If you have any questions, contact us at:' },
  ],
  it: [
    { h: '1. Introduzione', p: 'Uniswap V4 (\u201cnoi\u201d, \u201cnostro\u201d) si impegna a proteggere la tua privacy. Questa Informativa spiega come raccogliamo, utilizziamo e proteggiamo le tue informazioni personali quando utilizzi la nostra piattaforma di gestione di asset digitali (il \u201cServizio\u201d). Uniswap V4 \u00e8 registrata in Inghilterra e Galles, sede legale: 45 Queen Street, Deal, Kent, CT14 6EY.' },
    { h: '2. Informazioni Raccolte', p: 'Possiamo raccogliere: Dati Identificativi (nome, data di nascita, documento); Dati di Contatto (email, telefono); Dati Account (nome utente, password, preferenze, transazioni); Dati di Verifica (documenti, prova residenza, video selfie); Dati Tecnici (IP, browser, dispositivo); Dati di Utilizzo (pagine visitate, funzionalit\u00e0 utilizzate).' },
    { h: '3. Utilizzo delle Informazioni', p: 'Utilizziamo i dati per: gestire il tuo account; verificare l\u2019identit\u00e0 AML/KYC; elaborare transazioni; comunicare con te; rilevare frodi; rispettare obblighi legali; migliorare il Servizio.' },
    { h: '4. Base Giuridica', p: 'Trattiamo i dati ai sensi del UK GDPR e Data Protection Act 2018: (a) esecuzione contratto; (b) obbligo legale; (c) interessi legittimi; (d) consenso.' },
    { h: '5. Condivisione Dati', p: 'Possiamo condividere con: Fornitori di Servizi (hosting, email, verifica identit\u00e0); Autorit\u00e0 (ove richiesto dalla legge); Consulenti (avvocati, revisori). Non vendiamo i tuoi dati.' },
    { h: '6. Conservazione', p: 'Conserviamo i dati solo per il tempo necessario alle finalit\u00e0 per cui sono stati raccolti, compresi obblighi legali e contabili.' },
    { h: '7. Sicurezza', p: 'Implementiamo misure tecniche e organizzative appropriate per proteggere i tuoi dati personali.' },
    { h: '8. I Tuoi Diritti', p: 'Hai diritto di: accedere ai dati; richiedere rettifica; richiedere cancellazione; opporti al trattamento; richiedere portabilit\u00e0; revocare consenso. Contattaci a info@uniswapv4.com.' },
    { h: '9. Cookie', p: 'Utilizziamo cookie essenziali per sessioni e autenticazione. Nessun cookie di tracciamento o pubblicitario di terze parti.' },
    { h: '10. Modifiche', p: 'Possiamo aggiornare questa informativa. Le modifiche sostanziali verranno pubblicate su questa pagina.' },
    { h: '11. Contattaci', p: 'Se hai domande, contattaci a:' },
  ],
};

const meta = {
  en: { updated: 'Last updated: 1 January 2026', rights: '\u00a9 {y} Uniswap V4. All rights reserved.', terms: 'Terms of Service', aboutUs: 'About Us', icoNote: 'You may also lodge a complaint with the ICO at ico.org.uk.' },
  it: { updated: 'Ultimo aggiornamento: 1 gennaio 2026', rights: '\u00a9 {y} Uniswap V4. Tutti i diritti riservati.', terms: 'Termini di Servizio', aboutUs: 'Chi Siamo', icoNote: 'Puoi anche presentare un reclamo all\u2019ICO su ico.org.uk.' },
};

const PrivacyPolicyPage = () => {
  const { lang } = useLang();
  const sections = content[lang] || content.en;
  const m = meta[lang] || meta.en;

  return (
    <div className="min-h-screen" data-testid="privacy-policy-page" style={{ background: 'var(--r-bg)', color: 'var(--r-text)' }}>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <p style={{ fontSize: '0.875rem', color: 'var(--r-text)', marginBottom: 32, opacity: 0.7 }}>{m.updated}</p>
        {sections.map((sec, i) => (
          <React.Fragment key={i}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--r-onsurface)', marginBottom: 16 }}>{sec.h}</h2>
            {i === sections.length - 1 ? (
              <>
                <p style={{ color: 'var(--r-text)', marginBottom: 12, lineHeight: 1.7 }}>{sec.p}</p>
                <div style={{ background: 'var(--r-bg1)', border: '1px solid var(--r-line)', borderRadius: 12, padding: 24, marginBottom: 32 }}>
                  <p style={{ color: 'var(--r-onsurface)', fontWeight: 500 }}>Uniswap V4</p>
                  <p style={{ color: 'var(--r-text)' }}>45 Queen Street, Deal, Kent, England, CT14 6EY</p>
                  <p style={{ color: 'var(--r-text)' }}>Email: <a href="mailto:info@uniswapv4.com" style={{ color: '#3772ff' }}>info@uniswapv4.com</a></p>
                </div>
                <p style={{ color: 'var(--r-text)', lineHeight: 1.7 }}>{m.icoNote}</p>
              </>
            ) : (
              <p style={{ color: 'var(--r-text)', marginBottom: 24, lineHeight: 1.7 }}>{sec.p}</p>
            )}
          </React.Fragment>
        ))}
      </main>
      <footer style={{ background: 'var(--r-surface)', borderTop: '1px solid var(--r-line)', padding: '24px 16px' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center" style={{ fontSize: '0.875rem', color: 'var(--r-text)' }}>
          <p>{m.rights.replace('{y}', new Date().getFullYear())}</p>
          <div className="flex space-x-6 mt-2 sm:mt-0">
            <Link to="/terms" style={{ color: 'var(--r-text)' }}>{m.terms}</Link>
            <Link to="/about" style={{ color: 'var(--r-text)' }}>{m.aboutUs}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicyPage;
