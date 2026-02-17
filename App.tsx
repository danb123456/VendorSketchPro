
import React, { useState } from 'react';
import Login from './components/Login';
import Designer from './components/Designer';
import InfoPage from './components/InfoPage';
import { VendorInfo } from './types';

const App: React.FC = () => {
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [infoAccepted, setInfoAccepted] = useState(false);

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
