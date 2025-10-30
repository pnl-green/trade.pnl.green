import { NavLink } from 'react-router-dom';

const docsNav = [
  { slug: 'getting-started', label: 'Getting Started' },
  { slug: 'connect-venues', label: 'Connect Venues' },
  { slug: 'ai-cli', label: 'AI-CLI' },
  { slug: 'pairs-trading', label: 'Pairs Trading' },
  { slug: 'risk-manager', label: 'Risk Manager' },
  { slug: 'bots-and-fees', label: 'Bots & Fees' },
  { slug: 'keyboard-shortcuts', label: 'Keyboard Shortcuts' },
  { slug: 'security', label: 'Security' },
];

const DocSidebar = () => (
  <aside className="sticky top-24 h-fit min-w-[220px] rounded-xl border border-border bg-surface/60 p-6">
    <nav className="space-y-2 text-sm text-steel">
      {docsNav.map((item) => (
        <NavLink
          key={item.slug}
          to={`/docs/${item.slug}`}
          className={({ isActive }) =>
            `block rounded-lg px-3 py-2 transition hover:text-ink ${
              isActive ? 'bg-green-500/10 text-ink' : 'text-steel'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default DocSidebar;
