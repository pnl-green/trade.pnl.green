import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-sm rounded-xl border border-border bg-elev/90 p-4 text-sm text-steel shadow-md">
      <p className="font-heading text-sm text-ink">Install Intelayer</p>
      <p className="mt-1 text-xs text-muted">
        Add the Intelayer marketing app to your device for quick access.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="rounded-xl border border-green-500/40 px-4 py-2 text-xs text-green-200 transition hover:bg-green-500/10"
          onClick={async () => {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
              setVisible(false);
            }
          }}
        >
          Install
        </button>
        <button
          type="button"
          className="rounded-xl border border-border px-4 py-2 text-xs text-muted transition hover:text-steel"
          onClick={() => setVisible(false)}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default InstallBanner;
