
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Designer from './components/Designer';
import InfoPage from './components/InfoPage';
import { VendorInfo } from './types';

const App: React.FC = () => {
  const [vendor, setVendor] = useState<VendorInfo | null>(() => {
    const saved = localStorage.getItem('vendor-sketch-pro-vendor');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [infoAccepted, setInfoAccepted] = useState(() => {
    const saved = localStorage.getItem('vendor-sketch-pro-info-accepted');
    return saved === 'true';
  });

  useEffect(() => {
    if (vendor) {
      localStorage.setItem('vendor-sketch-pro-vendor', JSON.stringify(vendor));
    } else {
      localStorage.removeItem('vendor-sketch-pro-vendor');
      localStorage.removeItem('vendor-sketch-pro-info-accepted');
    }
  }, [vendor]);

  useEffect(() => {
    localStorage.setItem('vendor-sketch-pro-info-accepted', infoAccepted.toString());
  }, [infoAccepted]);

  if (!vendor) {
    return <Login onLogin={setVendor} />;
  }

  if (!infoAccepted) {
    return <InfoPage onAccept={() => setInfoAccepted(true)} />;
  }

  return <Designer vendor={vendor} onLogout={() => {
    setVendor(null);
    setInfoAccepted(false);
  }} />;
};

export default App;
