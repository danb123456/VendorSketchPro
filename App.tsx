
import React, { useState } from 'react';
import Login from './components/Login';
import Designer from './components/Designer';
import { VendorInfo } from './types';

const App: React.FC = () => {
  const [vendor, setVendor] = useState<VendorInfo | null>(null);

  if (!vendor) {
    return <Login onLogin={setVendor} />;
  }

  return <Designer vendor={vendor} onLogout={() => setVendor(null)} />;
};

export default App;
