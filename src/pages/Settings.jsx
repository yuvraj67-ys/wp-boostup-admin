import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Save } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    adminContactLink: '',
    officialChannelLink: '',
    premiumPrice: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, "Settings", "app_config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, "Settings", "app_config"), settings, { merge: true });
      alert("Settings updated successfully!");
    } catch (error) {
      alert("Error saving settings: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">App Configuration</h2>
      
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Contact Link (WhatsApp URL)</label>
            <p className="text-xs text-gray-500 mb-2">Used when users click "Contact Admin to Buy" in Premium screen.</p>
            <input
              type="text"
              value={settings.adminContactLink}
              onChange={(e) => setSettings({...settings, adminContactLink: e.target.value})}
              placeholder="https://wa.me/1234567890"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Official Channel Link</label>
            <p className="text-xs text-gray-500 mb-2">Used in the Navigation Drawer "Join Official Channel".</p>
            <input
              type="text"
              value={settings.officialChannelLink}
              onChange={(e) => setSettings({...settings, officialChannelLink: e.target.value})}
              placeholder="https://chat.whatsapp.com/..."
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Premium Pricing Text</label>
            <p className="text-xs text-gray-500 mb-2">Displayed on the Premium Screen.</p>
            <input
              type="text"
              value={settings.premiumPrice}
              onChange={(e) => setSettings({...settings, premiumPrice: e.target.value})}
              placeholder="e.g. $10 / Lifetime or ₹499 / Month"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center justify-center space-x-2 w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primaryDark transition-colors disabled:opacity-50"
          >
            <Save size={20} />
            <span>{loading ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
