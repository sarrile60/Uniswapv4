import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/i18n';

const S = {
  h2: { fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: 16 },
  p: { color: '#b1b5c3', marginBottom: 24, lineHeight: 1.7 },
  p3: { color: '#b1b5c3', marginBottom: 12, lineHeight: 1.7 },
  li: { color: '#b1b5c3', lineHeight: 1.7, marginBottom: 8 },
  strong: { color: '#fff' },
  a: { color: '#3772ff' },
  card: { background: '#222630', borderRadius: 12, padding: 24, marginBottom: 32 },
  cardTitle: { color: '#fff', fontWeight: 500 },
  cardText: { color: '#b1b5c3' },
  sub: { fontSize: '0.875rem', color: '#777e90', marginBottom: 32 },
};

const content = {
  en: [
    { h: '1. Introduction', p: 'Uniswap V4 (\u201cwe\u201d, \u201cour\u201d, \u201cus\u201d) is committed to protecting and respecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our digital asset management platform and related services (collectively, the \u201cService\u201d). Uniswap V4 is a private limited company registered in England and Wales, with its registered office at 45 Queen Street, Deal, Kent, England, CT14 6EY.' },
    { h: '2. Information We Collect', p: 'We may collect and process the following categories of personal data: Identity Data (first name, last name, date of birth, government-issued ID); Contact Data (email address, telephone number); Account Data (username, password, account preferences, transaction history); Verification Data (identity documents, proof of address, video selfie); Technical Data (IP address, browser type, device information); Usage Data (pages visited, features accessed, interaction patterns).' },
    { h: '3. How We Use Your Information', p: 'We use your personal data to: create and manage your account; verify your identity for AML/KYC compliance; process transactions and maintain records; communicate with you regarding your account; detect and prevent fraud and security breaches; comply with legal and regulatory obligations; improve and optimise the Service.' },
    { h: '4. Legal Basis for Processing', p: 'We process your personal data under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018: (a) performance of a contract; (b) compliance with a legal obligation; (c) legitimate interests; and (d) consent.' },
    { h: '5. Data Sharing and Disclosure', p: 'We may share your personal data with: Service Providers (cloud hosting, email delivery, identity verification); Regulatory Authorities (where required by law); Professional Advisors (lawyers, auditors, insurers). We do not sell your personal data to third parties.' },
    { h: '6. Data Retention', p: 'We retain your personal data only for as long as is necessary to fulfil the purposes for which it was collected, including to satisfy legal, regulatory, accounting, or reporting requirements.' },
    { h: '7. Data Security', p: 'We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction.' },
    { h: '8. Your Rights', p: 'Under applicable data protection legislation, you have the right to: request access to your personal data; request correction of inaccurate data; request erasure in certain circumstances; object to or restrict processing; request data portability; withdraw consent at any time. To exercise these rights, contact us at info@uniswapv4.com.' },
    { h: '9. Cookies', p: 'Our Service uses essential cookies to ensure proper functioning, including session management and authentication. We do not use third-party tracking or advertising cookies.' },
    { h: '10. Changes to This Policy', p: 'We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page.' },
    { h: '11. Contact Us', p: 'If you have any questions about this Privacy Policy, please contact us at:' },
  ],
  it: [
    { h: '1. Introduzione', p: 'Uniswap V4 (\u201cnoi\u201d, \u201cnostro\u201d) si impegna a proteggere e rispettare la tua privacy. La presente Informativa sulla Privacy spiega come raccogliamo, utilizziamo, divulghiamo e proteggiamo le tue informazioni personali quando utilizzi la nostra piattaforma di gestione di asset digitali e i servizi correlati (collettivamente, il \u201cServizio\u201d). Uniswap V4 \u00e8 una societ\u00e0 a responsabilit\u00e0 limitata registrata in Inghilterra e Galles, con sede legale presso 45 Queen Street, Deal, Kent, Inghilterra, CT14 6EY.' },
    { h: '2. Informazioni che Raccogliamo', p: 'Possiamo raccogliere e trattare le seguenti categorie di dati personali: Dati Identificativi (nome, cognome, data di nascita, documento d\u2019identit\u00e0); Dati di Contatto (indirizzo email, numero di telefono); Dati dell\u2019Account (nome utente, password, preferenze, cronologia transazioni); Dati di Verifica (documenti d\u2019identit\u00e0, prova di residenza, video selfie); Dati Tecnici (indirizzo IP, tipo di browser, dispositivo); Dati di Utilizzo (pagine visitate, funzionalit\u00e0 utilizzate, schemi di interazione).' },
    { h: '3. Come Utilizziamo le Tue Informazioni', p: 'Utilizziamo i tuoi dati personali per: creare e gestire il tuo account; verificare la tua identit\u00e0 per la conformit\u00e0 AML/KYC; elaborare le transazioni e mantenere i registri; comunicare con te riguardo al tuo account; rilevare e prevenire frodi e violazioni della sicurezza; rispettare gli obblighi legali e normativi; migliorare e ottimizzare il Servizio.' },
    { h: '4. Base Giuridica del Trattamento', p: 'Trattiamo i tuoi dati personali ai sensi del Regolamento Generale sulla Protezione dei Dati del Regno Unito (UK GDPR) e del Data Protection Act 2018: (a) esecuzione di un contratto; (b) adempimento di un obbligo legale; (c) interessi legittimi; e (d) consenso.' },
    { h: '5. Condivisione e Divulgazione dei Dati', p: 'Possiamo condividere i tuoi dati personali con: Fornitori di Servizi (hosting cloud, invio email, verifica dell\u2019identit\u00e0); Autorit\u00e0 di Regolamentazione (ove richiesto dalla legge); Consulenti Professionali (avvocati, revisori, assicuratori). Non vendiamo i tuoi dati personali a terzi.' },
    { h: '6. Conservazione dei Dati', p: 'Conserviamo i tuoi dati personali solo per il tempo necessario a soddisfare le finalit\u00e0 per cui sono stati raccolti, compresi gli obblighi legali, normativi, contabili o di rendicontazione.' },
    { h: '7. Sicurezza dei Dati', p: 'Implementiamo misure tecniche e organizzative appropriate per proteggere i tuoi dati personali contro l\u2019accesso non autorizzato, l\u2019alterazione, la divulgazione o la distruzione.' },
    { h: '8. I Tuoi Diritti', p: 'Ai sensi della legislazione applicabile sulla protezione dei dati, hai il diritto di: richiedere l\u2019accesso ai tuoi dati personali; richiedere la rettifica di dati inesatti; richiedere la cancellazione in determinate circostanze; opporti o limitare il trattamento; richiedere la portabilit\u00e0 dei dati; revocare il consenso in qualsiasi momento. Per esercitare questi diritti, contattaci a info@uniswapv4.com.' },
    { h: '9. Cookie', p: 'Il nostro Servizio utilizza cookie essenziali per garantire il corretto funzionamento, inclusa la gestione delle sessioni e l\u2019autenticazione. Non utilizziamo cookie di tracciamento o pubblicitari di terze parti.' },
    { h: '10. Modifiche a Questa Informativa', p: 'Possiamo aggiornare questa Informativa sulla Privacy di volta in volta. Ti informeremo delle modifiche sostanziali pubblicando l\u2019informativa aggiornata su questa pagina.' },
    { h: '11. Contattaci', p: 'Se hai domande su questa Informativa sulla Privacy, contattaci a:' },
  ],
};

const meta = {
  en: { updated: 'Last updated: 1 January 2026', rights: '\u00a9 {y} Uniswap V4. All rights reserved.', terms: 'Terms of Service', aboutUs: 'About Us', icoNote: 'You also have the right to lodge a complaint with the Information Commissioner\u2019s Office (ICO) at ico.org.uk.' },
  it: { updated: 'Ultimo aggiornamento: 1 gennaio 2026', rights: '\u00a9 {y} Uniswap V4. Tutti i diritti riservati.', terms: 'Termini di Servizio', aboutUs: 'Chi Siamo', icoNote: 'Hai inoltre il diritto di presentare un reclamo all\u2019Information Commissioner\u2019s Office (ICO) su ico.org.uk.' },
};

const PrivacyPolicyPage = () => {
  const { lang } = useLang();
  const sections = content[lang] || content.en;
  const m = meta[lang] || meta.en;

  return (
    <div className="min-h-screen" data-testid="privacy-policy-page" style={{ background: '#141416', color: '#b1b5c3' }}>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <p style={S.sub}>{m.updated}</p>
        {sections.map((sec, i) => (
          <React.Fragment key={i}>
            <h2 style={S.h2}>{sec.h}</h2>
            {i === sections.length - 1 ? (
              <>
                <p style={S.p3}>{sec.p}</p>
                <div style={S.card}>
                  <p style={S.cardTitle}>Uniswap V4</p>
                  <p style={S.cardText}>45 Queen Street, Deal, Kent, England, CT14 6EY</p>
                  <p style={S.cardText}>Email: <a href="mailto:info@uniswapv4.com" style={S.a}>info@uniswapv4.com</a></p>
                </div>
                <p style={S.p}>{m.icoNote}</p>
              </>
            ) : (
              <p style={S.p}>{sec.p}</p>
            )}
          </React.Fragment>
        ))}
      </main>
      <footer style={{ background: '#18191d', borderTop: '1px solid #23262f', padding: '24px 16px' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center" style={{ fontSize: '0.875rem', color: '#777e90' }}>
          <p>{m.rights.replace('{y}', new Date().getFullYear())}</p>
          <div className="flex space-x-6 mt-2 sm:mt-0">
            <Link to="/terms" style={{ color: '#777e90' }}>{m.terms}</Link>
            <Link to="/about" style={{ color: '#777e90' }}>{m.aboutUs}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicyPage;
