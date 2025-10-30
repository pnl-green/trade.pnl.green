import { Helmet } from 'react-helmet-async';

import Footer from '../components/Footer';
import Header from '../components/Header';
import Section from '../components/Section';

const LegalTerms = () => (
  <div className="min-h-screen bg-page">
    <Helmet>
      <title>Intelayer Terms of Use</title>
      <link rel="canonical" href="https://intelayer.com/legal/terms" />
    </Helmet>
    <Header />
    <main>
      <Section className="pb-24 pt-24">
        <article className="prose prose-invert max-w-3xl text-steel">
          <h1>Terms of Use</h1>
          <p>
            By accessing Intelayer, you acknowledge that the platform is provided “as is” during an active beta period. Intelayer is not a broker, exchange, or investment advisor and does not execute trades on your behalf.
          </p>
          <h2>Eligibility</h2>
          <p>
            You must comply with applicable laws in your jurisdiction. Intelayer may restrict access to certain regions based on regulatory requirements.
          </p>
          <h2>No Warranties</h2>
          <p>
            Intelayer disclaims all warranties, express or implied, including merchantability and fitness for a particular purpose. Market data and venue connectivity are provided on a best-effort basis.
          </p>
          <h2>Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Intelayer is not liable for indirect, incidental, or consequential damages arising from your use of the terminal.
          </p>
          <h2>Trading Risk</h2>
          <p>
            Trading digital assets, equities, and derivatives involves substantial risk. You are solely responsible for your decisions. Nothing on Intelayer constitutes financial advice.
          </p>
          <h2>Bots & Fees</h2>
          <p>
            Bots deployed through Intelayer incur a 3 bps fee on executed volume. When venues do not provide rebates, Intelayer may charge a flat 2 bps fee to cover infrastructure.
          </p>
          <h2>Trademarks</h2>
          <p>
            “Robinhood” and “Coinbase” are trademarks of their respective owners. Intelayer references supported venues for descriptive purposes only.
          </p>
          <h2>Changes</h2>
          <p>
            Intelayer may update these terms as the product evolves. Continued use signifies acceptance of any revisions.
          </p>
        </article>
      </Section>
    </main>
    <Footer />
  </div>
);

export default LegalTerms;
