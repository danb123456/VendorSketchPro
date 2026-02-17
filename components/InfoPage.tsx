
import React, { useState } from 'react';

interface InfoPageProps {
  onAccept: () => void;
}

const InfoPage: React.FC<InfoPageProps> = ({ onAccept }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Important Information - Must Read</h2>
        
        <div className="text-slate-600 space-y-4 mb-8">
          <p className="font-medium text-slate-800">
            VendorSketch is a tool designed by BBQ Festivals Ltd to give traders the ability to draw their stand, as well as the queue system for crowd flow.
          </p>
          
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Process:</h3>
            <ol className="list-decimal pl-5 space-y-3 text-sm">
              <li>Make sure your Vendor ID and trading name are accurate.</li>
              <li>Enter the pitch size agreed by FUME (from the onboarding form) that you need. This is the space not accessible to the public.</li>
              <li>Fill out your pitch with all of the relevant objects in your stand. Please look at all the objects carefully and use as many as required.</li>
              <li>Build a queue system that works with your service flow. Build this below your front of house area in the wider canvas space (not within the pitch boundary). This needs to remain within the width of your stand and should be able to traffic ~35 people.</li>
              <li>Select the "Export (PNG)" button at the top of the page to download your floor plan in a high resolution.</li>
              <li>Email the high resolution image to <a href="mailto:dan@savourfestival.com" className="text-emerald-600 font-bold hover:underline">dan@savourfestival.com</a></li>
            </ol>
          </div>
        </div>

        <div className="flex items-start gap-3 mb-8 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <input
            id="declaration"
            type="checkbox"
            className="mt-1 w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <label htmlFor="declaration" className="text-sm text-slate-700 leading-relaxed cursor-pointer select-none">
            I acknowledge that this sketch does not guarantee my pitch size, and the organisers reserve the right to make amendments if required.
          </label>
        </div>

        <button
          onClick={onAccept}
          disabled={!agreed}
          className={`w-full font-bold py-4 rounded-xl transition shadow-lg ${
            agreed 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Continue to Pitch Setup
        </button>
      </div>
    </div>
  );
};

export default InfoPage;
