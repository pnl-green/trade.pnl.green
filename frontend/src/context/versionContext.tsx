import React, { createContext, useContext, useState, useEffect } from 'react';

type Version = 'v1' | 'v2';

interface VersionContextType {
  version: Version;
  setVersion: (version: Version) => void;
  isV2: boolean;
}

const VersionContext = createContext<VersionContextType | undefined>(undefined);

export const useVersionContext = () => {
  const context = useContext(VersionContext);
  if (!context) {
    throw new Error('useVersionContext must be used within a VersionProvider');
  }
  return context;
};

export const VersionProvider = ({ children }: { children: React.ReactNode }) => {
  // Check URL parameter first, then localStorage, default to v1
  const [version, setVersionState] = useState<Version>(() => {
    if (typeof window === 'undefined') return 'v1';
    
    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlVersion = urlParams.get('version') as Version;
    if (urlVersion === 'v2') {
      localStorage.setItem('appVersion', 'v2');
      return 'v2';
    }
    
    // Check localStorage
    const storedVersion = localStorage.getItem('appVersion') as Version;
    return storedVersion === 'v2' ? 'v2' : 'v1';
  });

  const setVersion = (newVersion: Version) => {
    setVersionState(newVersion);
    localStorage.setItem('appVersion', newVersion);
    
    // Update URL without reload
    const url = new URL(window.location.href);
    if (newVersion === 'v2') {
      url.searchParams.set('version', 'v2');
    } else {
      url.searchParams.delete('version');
    }
    window.history.pushState({}, '', url);
  };

  // Listen for URL changes
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlVersion = urlParams.get('version') as Version;
      if (urlVersion === 'v2') {
        setVersionState('v2');
        localStorage.setItem('appVersion', 'v2');
      } else {
        setVersionState('v1');
        localStorage.setItem('appVersion', 'v1');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <VersionContext.Provider
      value={{
        version,
        setVersion,
        isV2: version === 'v2',
      }}
    >
      {children}
    </VersionContext.Provider>
  );
};

export default VersionProvider;

