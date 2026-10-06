import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Globe, Users, Lock, Mail, MapPin, Building } from 'lucide-react';
import { useLang } from '@/i18n';

const txt = {
  en: {
    heroTitle: 'Trusted Digital Asset Management',
    heroDesc: 'Uniswap V4 provides a secure, reliable platform for managing digital assets. Founded in 2023 and headquartered in the United Kingdom, we are committed to delivering institutional-grade security and a seamless user experience for individuals and businesses alike.',
    missionTitle: 'Our Mission',
    missionP1: 'At Uniswap V4, our mission is to make digital asset management accessible, transparent, and secure. We believe that financial tools should empower users with full control over their assets, backed by robust security measures and clear regulatory compliance.',
    missionP2: 'We are dedicated to building a platform where trust is earned through transparency, where security is built into every layer, and where our users can manage their digital portfolios with confidence.',
    guidesTitle: 'What Guides Us',
    values: [
      { title: 'Security First', text: 'Every feature we build starts with security. From encrypted data storage to rigorous identity verification, safeguarding your assets and personal information is our highest priority.' },
      { title: 'Regulatory Compliance', text: 'We adhere to applicable anti-money laundering (AML) and know your customer (KYC) regulations, ensuring that our platform operates within the bounds of UK and international financial law.' },
      { title: 'User-Centred Design', text: 'We design our platform with real users in mind. From onboarding to daily use, every interaction is crafted for clarity, simplicity, and reliability across all devices.' },
      { title: 'Transparency', text: 'We believe in open communication with our users. Our fee structures, policies, and operational practices are clearly documented and readily available.' },
    ],
    companyTitle: 'Company Information',
    companyName: 'Company Name', companyType: 'Private Limited Company',
    office: 'Registered Office', contact: 'Contact', incorporated: 'Incorporated',
    ctaTitle: 'Get in Touch', ctaDesc: 'Have questions or need support? Our team is here to help.', ctaBtn: 'Contact Support',
    rights: '\u00a9 {y} Uniswap V4. All rights reserved.', privacy: 'Privacy Policy', terms: 'Terms of Service',
  },
  it: {
    heroTitle: 'Gestione Affidabile di Asset Digitali',
    heroDesc: 'Uniswap V4 fornisce una piattaforma sicura e affidabile per la gestione di asset digitali. Fondata nel 2023 e con sede nel Regno Unito, ci impegniamo a fornire sicurezza di livello istituzionale e un\'esperienza utente impeccabile per privati e aziende.',
    missionTitle: 'La Nostra Missione',
    missionP1: 'In Uniswap V4, la nostra missione \u00e8 rendere la gestione degli asset digitali accessibile, trasparente e sicura. Crediamo che gli strumenti finanziari debbano permettere agli utenti di avere il pieno controllo sui propri asset, supportati da solide misure di sicurezza e una chiara conformit\u00e0 normativa.',
    missionP2: 'Ci dedichiamo a costruire una piattaforma dove la fiducia si guadagna attraverso la trasparenza, dove la sicurezza \u00e8 integrata in ogni livello e dove i nostri utenti possono gestire i propri portafogli digitali con fiducia.',
    guidesTitle: 'I Nostri Valori',
    values: [
      { title: 'Sicurezza al Primo Posto', text: 'Ogni funzionalit\u00e0 che costruiamo parte dalla sicurezza. Dalla crittografia dei dati alla rigorosa verifica dell\'identit\u00e0, la protezione dei tuoi asset e delle tue informazioni personali \u00e8 la nostra massima priorit\u00e0.' },
      { title: 'Conformit\u00e0 Normativa', text: 'Rispettiamo le normative antiriciclaggio (AML) e di adeguata verifica della clientela (KYC) applicabili, garantendo che la nostra piattaforma operi nel rispetto delle leggi finanziarie britanniche e internazionali.' },
      { title: 'Design Incentrato sull\'Utente', text: 'Progettiamo la nostra piattaforma pensando agli utenti reali. Dall\'onboarding all\'uso quotidiano, ogni interazione \u00e8 progettata per chiarezza, semplicit\u00e0 e affidabilit\u00e0 su tutti i dispositivi.' },
      { title: 'Trasparenza', text: 'Crediamo nella comunicazione aperta con i nostri utenti. Le nostre strutture tariffarie, politiche e pratiche operative sono chiaramente documentate e facilmente disponibili.' },
    ],
    companyTitle: 'Informazioni Aziendali',
    companyName: 'Ragione Sociale', companyType: 'Societ\u00e0 a Responsabilit\u00e0 Limitata',
    office: 'Sede Legale', contact: 'Contatto', incorporated: 'Costituzione',
    ctaTitle: 'Contattaci', ctaDesc: 'Hai domande o hai bisogno di supporto? Il nostro team \u00e8 qui per aiutarti.', ctaBtn: 'Contatta il Supporto',
    rights: '\u00a9 {y} Uniswap V4. Tutti i diritti riservati.', privacy: 'Informativa Privacy', terms: 'Termini di Servizio',
  },
};

const icons = [Shield, Lock, Users, Globe];

const AboutPage = () => {
  const { lang } = useLang();
  const t = txt[lang] || txt.en;

  return (
    <div className="min-h-screen" data-testid="about-page" style={{ background: '#141416', color: '#b1b5c3' }}>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-16">
          <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #ec4899, #7c3aed)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <span style={{ fontSize: 32 }}>🦄</span>
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#fff', marginBottom: 16 }}>{t.heroTitle}</h2>
          <p style={{ fontSize: '1.125rem', color: '#b1b5c3', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>{t.heroDesc}</p>
        </div>

        <div className="mb-16">
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: 16 }}>{t.missionTitle}</h3>
          <p style={{ color: '#b1b5c3', lineHeight: 1.6, marginBottom: 16 }}>{t.missionP1}</p>
          <p style={{ color: '#b1b5c3', lineHeight: 1.6 }}>{t.missionP2}</p>
        </div>

        <div className="mb-16">
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: 32 }}>{t.guidesTitle}</h3>
          <div className="grid sm:grid-cols-2 gap-6">
            {t.values.map((v, i) => {
              const Icon = icons[i];
              return (
                <div key={i} style={{ background: '#222630', borderRadius: 12, padding: 24 }}>
                  <Icon style={{ width: 32, height: 32, color: '#3772ff', marginBottom: 12 }} />
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#fff', marginBottom: 8 }}>{v.title}</h4>
                  <p style={{ fontSize: '0.875rem', color: '#b1b5c3', lineHeight: 1.6 }}>{v.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-16">
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: 24 }}>{t.companyTitle}</h3>
          <div style={{ background: '#222630', borderRadius: 12, padding: 32 }}>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <Building style={{ width: 20, height: 20, color: '#777e90', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#777e90' }}>{t.companyName}</p>
                  <p style={{ color: '#fff' }}>Uniswap V4</p>
                  <p style={{ fontSize: '0.875rem', color: '#777e90' }}>{t.companyType}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin style={{ width: 20, height: 20, color: '#777e90', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#777e90' }}>{t.office}</p>
                  <p style={{ color: '#fff' }}>45 Queen Street</p>
                  <p style={{ fontSize: '0.875rem', color: '#b1b5c3' }}>Deal, Kent, England, CT14 6EY</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Mail style={{ width: 20, height: 20, color: '#777e90', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#777e90' }}>{t.contact}</p>
                  <a href="mailto:info@uniswapv4.com" style={{ color: '#3772ff' }}>info@uniswapv4.com</a>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield style={{ width: 20, height: 20, color: '#777e90', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#777e90' }}>{t.incorporated}</p>
                  <p style={{ color: '#fff' }}>2023</p>
                  <p style={{ fontSize: '0.875rem', color: '#777e90' }}>United Kingdom</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', background: 'rgba(55, 114, 255, 0.1)', borderRadius: 12, padding: 32 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: 12 }}>{t.ctaTitle}</h3>
          <p style={{ color: '#b1b5c3', marginBottom: 16 }}>{t.ctaDesc}</p>
          <a href="mailto:info@uniswapv4.com" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: '#3772ff', color: '#fff', fontWeight: 500, padding: '10px 24px', textDecoration: 'none' }}>
            <Mail style={{ width: 16, height: 16, marginRight: 8 }} />
            {t.ctaBtn}
          </a>
        </div>
      </main>

      <footer style={{ background: '#18191d', borderTop: '1px solid #23262f', padding: '24px 16px', marginTop: 64 }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center" style={{ fontSize: '0.875rem', color: '#777e90' }}>
          <p>{t.rights.replace('{y}', new Date().getFullYear())}</p>
          <div className="flex space-x-6 mt-2 sm:mt-0">
            <Link to="/privacy" style={{ color: '#777e90' }}>{t.privacy}</Link>
            <Link to="/terms" style={{ color: '#777e90' }}>{t.terms}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
