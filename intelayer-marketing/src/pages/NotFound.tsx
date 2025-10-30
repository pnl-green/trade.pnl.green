import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

import Footer from '../components/Footer';
import Header from '../components/Header';
import Section from '../components/Section';

const NotFound = () => (
  <div className="min-h-screen bg-page">
    <Helmet>
      <title>Intelayer | Not Found</title>
      <meta name="robots" content="noindex" />
      <link rel="canonical" href="https://intelayer.com/404" />
    </Helmet>
    <Header />
    <main>
      <Section className="pb-32 pt-24">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-green-400">404</p>
          <h1 className="mt-4 text-4xl font-heading text-ink">Signal lost.</h1>
          <p className="mt-4 text-lg text-steel">
            The page you’re looking for isn’t connected. Try jumping back to the terminal overview.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700"
            >
              Home
            </Link>
            <Link
              to="/docs"
              className="inline-flex items-center justify-center rounded-xl border border-green-500/40 px-5 py-2.5 text-sm text-green-200 hover:bg-green-500/10"
            >
              Docs
            </Link>
          </div>
        </div>
      </Section>
    </main>
    <Footer />
  </div>
);

export default NotFound;
