import { useEffect, useMemo, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
}

const isMobile = () => {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod|android/i.test(navigator.userAgent);
};

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const shouldRender = useMemo(() => isMobile(), []);

  useEffect(() => {
    if (!shouldRender) return;

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [shouldRender]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleClose = () => {
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible || !shouldRender) return null;

  return (
    <div className="install-prompt">
      <div className="install-prompt__content">
        <div>
          <p className="install-prompt__title">Install PNL Green</p>
          <p className="install-prompt__text">Add the app to your home screen for a fullscreen experience.</p>
        </div>
        <div className="install-prompt__actions">
          <button className="install-prompt__button" onClick={handleInstall}>
            Install
          </button>
          <button className="install-prompt__link" onClick={handleClose}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
