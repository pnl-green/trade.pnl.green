import { Helmet } from 'react-helmet-async';

import Button from '../components/Button';
import FeatureCard from '../components/FeatureCard';
import Footer from '../components/Footer';
import Header from '../components/Header';
import HeroVisual from '../components/HeroVisual';
import InstallBanner from '../components/InstallBanner';
import Section from '../components/Section';
import Stepper from '../components/Stepper';

import gridTexture from '../assets/grid.svg';

const tradeUrl = import.meta.env.VITE_TRADE_URL ?? 'https://trade.intelayer.com';

const Home = () => (
  <div className="min-h-screen bg-page">
    <Helmet>
      <title>Intelayer | One Terminal. Any Market.</title>
      <meta
        name="description"
        content="Intelayer is a third-party trading terminal that connects to your existing exchange and brokerage accounts. Execute faster, manage risk smarter, and automate with natural-language commands."
      />
      <link rel="canonical" href="https://intelayer.com/" />
      <meta property="og:title" content="Intelayer | One Terminal. Any Market." />
      <meta
        property="og:description"
        content="Intelayer is a third-party trading terminal that connects to your existing exchange and brokerage accounts. Execute faster, manage risk smarter, and automate with natural-language commands."
      />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://intelayer.com/" />
    </Helmet>
    <Header />
    <main>
      <Section className="pb-10 pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <span className="text-sm uppercase tracking-[0.3em] text-green-400">
              Crypto-first multi-venue terminal
            </span>
            <h1 className="text-4xl font-heading font-semibold leading-tight text-ink md:text-5xl">
              One Terminal. Any Market.
            </h1>
            <p className="max-w-xl text-lg text-steel">
              Intelayer is a third-party trading terminal that connects to your existing exchange and brokerage accounts. Execute faster, manage risk smarter, and automate with natural-language commands — on a UI that’s simple for beginners and powerful for pros.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button onClick={() => window.open(tradeUrl, '_blank', 'noopener,noreferrer')}>
                Trade Now
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Learn More
              </Button>
            </div>
          </div>
          <div className="relative">
            <div
              className="absolute inset-0 -z-10 rounded-3xl border border-green-500/20 opacity-30"
              style={{ backgroundImage: `url(${gridTexture})`, backgroundSize: 'cover' }}
              aria-hidden
            />
            <HeroVisual />
          </div>
        </div>
      </Section>

      <Section background="surface" className="py-20">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            title="Beginner-simple, pro-powerful."
            description="The GUI is clean and approachable, while a natural-language AI-CLI exposes advanced workflows without the bloat."
          />
          <FeatureCard
            title="Trade where you already are."
            description="Connect supported exchanges, DEXs, and brokerages; bring your balances, positions, and history into one terminal."
          />
          <FeatureCard
            title="Automate on your terms."
            description="Spin up rules, alerts, bots, and unconventional order logic — in plain English — then monitor everything from a single dashboard."
          />
          <FeatureCard
            title="Crypto-centric performance."
            description="Low-latency UI, pairs spread charting, DOM trading, and sensible keyboard shortcuts mean fewer clicks and more execution."
          />
        </div>
      </Section>

      <Section id="features" className="py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-heading text-ink">Built for depth, speed, and discipline.</h2>
          <p className="mt-4 text-lg text-steel">
            A powerful suite of features that lets you command any venue with confidence.
          </p>
        </div>
        <div className="mt-12 space-y-10">
          <FeatureCard
            title="AI-CLI: Type English, trade like code."
            description={
              <div className="space-y-3">
                <p>Issue commands like:</p>
                <ul className="list-disc space-y-2 pl-5 text-sm text-steel">
                  <li>“Buy 10 BTC at the 4-hour 50 EMA.”</li>
                  <li>“Limit chase 1 BTC on 4-hour close above 51k.”</li>
                </ul>
                <p>
                  The AI-CLI translates intent into orders (market, limit, TWAP) and supports advanced, composable instructions. It’s a text-based assistant — no scripts required.
                </p>
              </div>
            }
          />
          <FeatureCard
            title="Copy-Trade from Screenshots."
            description="Paste a TradingView chart screenshot; Intelayer extracts TP / SL / entries with computer vision, so you don’t have to retype parameters. Ideal for learning or mirroring setups posted on social media."
          />
          <FeatureCard
            title="Pairs Spread Trading (crypto vs. crypto)."
            description="Chart and trade custom pairs like ETH/BTC, SOL/MATIC, or BONK/DOGE to pursue relative value and market-neutral strategies — no premium scripts required."
          />
          <FeatureCard
            title="Semi-Automatic Risk Manager."
            description="Set a max loss per trade; Intelayer sizes positions automatically so that if your stop or liquidation hits, your loss stays within the pre-defined amount. Less math, more discipline."
          />
          <FeatureCard
            title="Workspace & Order Flow."
            description="TradingView-grade charts, DOM trading, advanced order types, CLI overlay, and a highly customizable layout that scales from laptop to multi-monitor rigs."
          />
          <FeatureCard
            title="Bots, No Upfronts."
            description="Use the AI-CLI to define a bot in plain English, iterate, and deploy to managed infrastructure in one click. Manage PnL, history, and edits from your dashboard. Pricing: 3 bps fee on bot-executed volume; some venues pay frontend rebates, and Intelayer may charge a flat 2 bps where no rebate is available. (See Docs → Bots & Fees.)"
          />
          <p className="text-xs text-muted">Origin of feature concepts: Intelayer’s product brief and slides.</p>
        </div>
      </Section>

      <Section background="surface" className="py-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-heading text-ink">How It Works</h2>
            <p className="mt-4 text-steel">
              Five steps to connect, execute, and automate across every venue you trade.
            </p>
          </div>
          <Stepper
            steps={[
              {
                title: 'Connect a venue',
                description: 'Connect a venue (CEX/DEX/broker) via API keys or OAuth where available.',
              },
              {
                title: 'Pick your workspace',
                description: 'Pick your workspace layout or start with the default.',
              },
              {
                title: 'Trade your way',
                description: 'Trade via GUI or AI-CLI; preview and confirm orders.',
              },
              {
                title: 'Risk controls',
                description: 'Risk controls size your positions to your max-loss per trade.',
              },
              {
                title: 'Automate',
                description:
                  'Automate: set alerts, create a bot from your CLI instructions, and monitor PnL in one dashboard.',
              },
            ]}
          />
        </div>
      </Section>

      <Section className="py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-green-400">Social Proof</p>
          <h2 className="mt-4 text-3xl font-heading text-ink">Trusted by traders across the stack.</h2>
          <p className="mt-4 text-lg text-steel">“Used by day-traders, quants, and long-term allocators.”</p>
        </div>
      </Section>
    </main>
    <Footer />
    <InstallBanner />
  </div>
);

export default Home;
