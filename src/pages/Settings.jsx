import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Save } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    adminContactLink: '',
    officialChannelLink: '',
    contactEmail: '',
    promotePrice: '',
    premiumMonthlyPrice: '',
    premiumLifetimePrice: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, "Settings", "app_config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings((prev) => ({ ...prev, ...docSnap.data() }));
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin WhatsApp URL</label>
              <input type="text" value={settings.adminContactLink} onChange={(e) => setSettings({...settings, adminContactLink: e.target.value})} placeholder="https://wa.me/..." className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Official Channel Link</label>
              <input type="text" value={settings.officialChannelLink} onChange={(e) => setSettings({...settings, officialChannelLink: e.target.value})} placeholder="https://chat.whatsapp.com/..." className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
            <p className="text-xs text-gray-500 mb-2">Used in Sidebar 'Contact Us' menu.</p>
            <input type="email" value={settings.contactEmail} onChange={(e) => setSettings({...settings, contactEmail: e.target.value})} placeholder="admin@wpboostup.com" className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" required />
          </div>

          <hr className="my-4" />
          <h3 className="text-lg font-bold text-gray-800">Pricing Configuration</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Promote Link Price</label>
            <input type="text" value={settings.promotePrice} onChange={(e) => setSettings({...settings, promotePrice: e.target.value})} placeholder="e.g. $5 / ₹400" className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Premium Monthly Price</label>
              <input type="text" value={settings.premiumMonthlyPrice} onChange={(e) => setSettings({...settings, premiumMonthlyPrice: e.target.value})} placeholder="e.g. $3 / ₹250" className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Premium Lifetime Price</label>
              <input type="text" value={settings.premiumLifetimePrice} onChange={(e) => setSettings({...settings, premiumLifetimePrice: e.target.value})} placeholder="e.g. $10 / ₹800" className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
          </div>

          <button type="submit" disabled={loading} className="flex items-center justify-center space-x-2 w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primaryDark transition-colors disabled:opacity-50">
            <Save size={20} />
            <span>{loading ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
