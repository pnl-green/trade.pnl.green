import { Suspense, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';

import DocSidebar from '../components/DocSidebar';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Section from '../components/Section';
import CodeBlock from '../components/CodeBlock';

const docs = import.meta.glob('../content/docs/*.mdx', { eager: true });

const docEntries = Object.entries(docs).map(([path, module]) => {
  const slug = path.replace('../content/docs/', '').replace(/\.mdx$/, '');
  return {
    slug,
    Component: (module as any).default,
  };
});

const components = {
  pre: (props: any) => <div {...props} />,
  code: ({ className, children }: { className?: string; children: string }) => {
    const language = className?.replace('language-', '') ?? 'tsx';
    return <CodeBlock language={language}>{children}</CodeBlock>;
  },
};

const Docs = () => {
  const location = useLocation();
  const canonical = useMemo(() => `https://intelayer.com${location.pathname}`, [location.pathname]);

  return (
    <div className="min-h-screen bg-page">
      <Helmet>
        <title>Intelayer Docs | Multi-venue Trading Terminal</title>
        <meta
          name="description"
          content="Documentation for Intelayer’s crypto-first trading terminal including venue connectivity, AI-CLI commands, bots, fees, and security."
        />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <Header />
      <main>
        <Section className="pb-20 pt-24">
          <div className="grid gap-12 lg:grid-cols-[260px_1fr]">
            <DocSidebar />
            <div className="space-y-10">
              <Suspense fallback={<p className="text-steel">Loading…</p>}>
                <Routes>
                  <Route path="" element={<Navigate to="getting-started" replace />} />
                  {docEntries.map(({ slug, Component }) => (
                    <Route
                      key={slug}
                      path={slug}
                      element={<Component components={components} />}
                    />
                  ))}
                </Routes>
              </Suspense>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </div>
  );
};

export default Docs;
