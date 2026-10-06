import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/i18n';

const S = {
  h2: { fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: 16 },
  p: { color: '#b1b5c3', marginBottom: 24, lineHeight: 1.7 },
  p3: { color: '#b1b5c3', marginBottom: 12, lineHeight: 1.7 },
  li: { color: '#b1b5c3', lineHeight: 1.7, marginBottom: 8 },
  a: { color: '#3772ff' },
  card: { background: '#222630', borderRadius: 12, padding: 24, marginBottom: 32 },
  cardTitle: { color: '#fff', fontWeight: 500 },
  cardText: { color: '#b1b5c3' },
  sub: { fontSize: '0.875rem', color: '#777e90', marginBottom: 32 },
};

const content = {
  en: [
    { h: '1. Agreement to Terms', p: 'These Terms of Service (\u201cTerms\u201d) govern your access to and use of the Uniswap V4 digital asset management platform and related services (the \u201cService\u201d) operated by Uniswap V4, a private limited company registered in England and Wales with its registered office at 45 Queen Street, Deal, Kent, England, CT14 6EY (\u201cwe\u201d, \u201cour\u201d, \u201cus\u201d). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you must not use the Service.' },
    { h: '2. Eligibility', p: 'To use the Service, you must be at least 18 years of age and have the legal capacity to enter into a binding agreement. By registering for an account, you represent and warrant that you meet these eligibility requirements. We reserve the right to request proof of age or identity at any time.' },
    { h: '3. Account Registration', p: 'To access certain features of the Service, you must create an account by providing accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.' },
    { h: '4. Identity Verification (KYC)', p: 'In order to comply with applicable anti-money laundering (AML) and know your customer (KYC) regulations, we may require you to submit identity verification documents. This may include government-issued identification, proof of address, and a video selfie for liveness verification.' },
    { h: '5. Use of the Service', p: 'You agree to use the Service only for lawful purposes and in accordance with these Terms. You shall not use the Service for any fraudulent, illegal, or unauthorised purpose, attempt to gain unauthorised access, interfere with or disrupt the Service, upload malicious code, impersonate any person, or use the Service to launder money or finance terrorism.' },
    { h: '6. Digital Assets and Transactions', p: 'The Service provides tools for managing digital assets, including viewing balances, initiating transfers, and tracking transaction history. All transactions are subject to applicable fees. You acknowledge that digital asset values are volatile and may fluctuate significantly. Uniswap V4 does not provide financial, investment, or tax advice.' },
    { h: '7. Fees', p: 'Certain features of the Service may be subject to fees. All applicable fees will be displayed before you confirm a transaction. We reserve the right to modify our fee structure at any time, with notice provided to you in advance.' },
    { h: '8. Account Suspension and Termination', p: 'We reserve the right to suspend or terminate your account at our discretion if we reasonably believe that you have violated these Terms, engaged in fraudulent or illegal activity, or if required to do so by law or regulation.' },
    { h: '9. Intellectual Property', p: 'All content, features, and functionality of the Service are the property of Uniswap V4 or its licensors and are protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our prior written consent.' },
    { h: '10. Limitation of Liability', p: 'To the fullest extent permitted by applicable law, Uniswap V4 shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of the Service.' },
    { h: '11. Disclaimer of Warranties', p: 'The Service is provided on an \u201cas is\u201d and \u201cas available\u201d basis without warranties of any kind, whether express or implied.' },
    { h: '12. Indemnification', p: 'You agree to indemnify, defend, and hold harmless Uniswap V4, its directors, officers, employees, and agents from and against any claims, liabilities, damages, losses, and expenses arising out of your use of the Service or your violation of these Terms.' },
    { h: '13. Governing Law', p: 'These Terms shall be governed by and construed in accordance with the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.' },
    { h: '14. Changes to These Terms', p: 'We may revise these Terms at any time by updating this page. Material changes will be communicated to you via email or through the Service.' },
    { h: '15. Contact Us', p: 'If you have any questions about these Terms, please contact us at:' },
  ],
  it: [
    { h: '1. Accettazione dei Termini', p: 'I presenti Termini di Servizio (\u201cTermini\u201d) regolano l\u2019accesso e l\u2019utilizzo della piattaforma di gestione di asset digitali Uniswap V4 e dei servizi correlati (il \u201cServizio\u201d) gestiti da Uniswap V4, una societ\u00e0 a responsabilit\u00e0 limitata registrata in Inghilterra e Galles con sede legale presso 45 Queen Street, Deal, Kent, Inghilterra, CT14 6EY (\u201cnoi\u201d, \u201cnostro\u201d). Accedendo o utilizzando il Servizio, accetti di essere vincolato da questi Termini. Se non accetti questi Termini, non devi utilizzare il Servizio.' },
    { h: '2. Requisiti di Idoneit\u00e0', p: 'Per utilizzare il Servizio, devi avere almeno 18 anni di et\u00e0 e la capacit\u00e0 giuridica per stipulare un contratto vincolante. Registrandoti per un account, dichiari e garantisci di soddisfare questi requisiti. Ci riserviamo il diritto di richiedere una prova dell\u2019et\u00e0 o dell\u2019identit\u00e0 in qualsiasi momento.' },
    { h: '3. Registrazione dell\u2019Account', p: 'Per accedere a determinate funzionalit\u00e0 del Servizio, devi creare un account fornendo informazioni accurate e complete. Sei responsabile della riservatezza delle tue credenziali e di tutte le attivit\u00e0 che si verificano sotto il tuo account.' },
    { h: '4. Verifica dell\u2019Identit\u00e0 (KYC)', p: 'Per conformarci alle normative antiriciclaggio (AML) e di adeguata verifica della clientela (KYC) applicabili, potremmo richiederti di presentare documenti di verifica dell\u2019identit\u00e0, tra cui un documento d\u2019identit\u00e0, prova di residenza e un video selfie per la verifica della vivacit\u00e0.' },
    { h: '5. Utilizzo del Servizio', p: 'Accetti di utilizzare il Servizio solo per scopi leciti e in conformit\u00e0 con i presenti Termini. Non devi utilizzare il Servizio per scopi fraudolenti, illegali o non autorizzati, tentare di ottenere accesso non autorizzato, interferire con il Servizio, caricare codice dannoso, impersonare persone o utilizzare il Servizio per riciclaggio di denaro o finanziamento del terrorismo.' },
    { h: '6. Asset Digitali e Transazioni', p: 'Il Servizio fornisce strumenti per la gestione di asset digitali, inclusa la visualizzazione dei saldi, l\u2019avvio di trasferimenti e il monitoraggio della cronologia delle transazioni. Tutte le transazioni sono soggette alle commissioni applicabili. Riconosci che i valori degli asset digitali sono volatili e possono fluttuare significativamente. Uniswap V4 non fornisce consulenza finanziaria, di investimento o fiscale.' },
    { h: '7. Commissioni', p: 'Alcune funzionalit\u00e0 del Servizio possono essere soggette a commissioni. Tutte le commissioni applicabili verranno visualizzate prima della conferma della transazione. Ci riserviamo il diritto di modificare la nostra struttura tariffaria in qualsiasi momento, con preavviso.' },
    { h: '8. Sospensione e Cessazione dell\u2019Account', p: 'Ci riserviamo il diritto di sospendere o terminare il tuo account a nostra discrezione se riteniamo ragionevolmente che tu abbia violato i presenti Termini, svolto attivit\u00e0 fraudolente o illegali, o se richiesto dalla legge o dalla normativa.' },
    { h: '9. Propriet\u00e0 Intellettuale', p: 'Tutti i contenuti, le funzionalit\u00e0 e le caratteristiche del Servizio sono di propriet\u00e0 di Uniswap V4 o dei suoi licenzianti e sono protetti da diritti d\u2019autore, marchi e altre leggi sulla propriet\u00e0 intellettuale. Non puoi riprodurre, distribuire o creare opere derivate senza il nostro previo consenso scritto.' },
    { h: '10. Limitazione di Responsabilit\u00e0', p: 'Nella misura massima consentita dalla legge applicabile, Uniswap V4 non sar\u00e0 responsabile per danni indiretti, incidentali, speciali, consequenziali o punitivi derivanti dal tuo utilizzo del Servizio.' },
    { h: '11. Esclusione di Garanzie', p: 'Il Servizio \u00e8 fornito \u201ccos\u00ec com\u2019\u00e8\u201d e \u201ccome disponibile\u201d senza garanzie di alcun tipo, espresse o implicite.' },
    { h: '12. Indennizzo', p: 'Accetti di indennizzare, difendere e manlevare Uniswap V4, i suoi amministratori, funzionari, dipendenti e agenti da qualsiasi reclamo, responsabilit\u00e0, danno, perdita e spesa derivante dal tuo utilizzo del Servizio o dalla violazione di questi Termini.' },
    { h: '13. Legge Applicabile', p: 'I presenti Termini sono disciplinati e interpretati in conformit\u00e0 con le leggi di Inghilterra e Galles. Qualsiasi controversia sar\u00e0 soggetta alla giurisdizione esclusiva dei tribunali di Inghilterra e Galles.' },
    { h: '14. Modifiche ai Termini', p: 'Possiamo rivedere questi Termini in qualsiasi momento aggiornando questa pagina. Le modifiche sostanziali ti verranno comunicate via email o attraverso il Servizio.' },
    { h: '15. Contattaci', p: 'Se hai domande su questi Termini, contattaci a:' },
  ],
};

const meta = {
  en: { updated: 'Last updated: 1 January 2026', rights: '\u00a9 {y} Uniswap V4. All rights reserved.', privacy: 'Privacy Policy', aboutUs: 'About Us' },
  it: { updated: 'Ultimo aggiornamento: 1 gennaio 2026', rights: '\u00a9 {y} Uniswap V4. Tutti i diritti riservati.', privacy: 'Informativa Privacy', aboutUs: 'Chi Siamo' },
};

const TermsOfServicePage = () => {
  const { lang } = useLang();
  const sections = content[lang] || content.en;
  const m = meta[lang] || meta.en;

  return (
    <div className="min-h-screen" data-testid="terms-of-service-page" style={{ background: '#141416', color: '#b1b5c3' }}>
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
            <Link to="/privacy" style={{ color: '#777e90' }}>{m.privacy}</Link>
            <Link to="/about" style={{ color: '#777e90' }}>{m.aboutUs}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfServicePage;
