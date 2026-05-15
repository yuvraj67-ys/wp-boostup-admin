import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import { Save, Settings as SettingsIcon, Lock, KeyRound } from 'lucide-react';

export default function Settings() {
  // --- App Settings State ---
  const [settings, setSettings] = useState({
    adminContactLink: '',
    officialChannelLink: '',
    contactEmail: '',
    promotePrice: '',
    premiumMonthlyPrice: '',
    premiumLifetimePrice: '',
    privacyPolicyLink: '',
    termsLink: ''
  });
  const [loading, setLoading] = useState(false);

  // --- Password Change State ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

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

  // Handle App Settings Save
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, "Settings", "app_config"), settings, { merge: true });
      alert("Settings updated successfully! Changes will reflect in the Android App instantly.");
    } catch (error) {
      alert("Error saving settings: " + error.message);
    }
    setLoading(false);
  };

  // Handle Admin Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      alert("Please enter both current and new passwords.");
      return;
    }
    if (newPassword.length < 6) {
      alert("New password must be at least 6 characters long.");
      return;
    }

    setPwdLoading(true);
    try {
      const user = auth.currentUser;
      if (user && user.email) {
        // 1. Re-authenticate user with current password to prevent "recent-login" errors
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        // 2. Update to new password
        await updatePassword(user, newPassword);
        
        alert("Admin password changed successfully! Use your new password next time you login.");
        setCurrentPassword('');
        setNewPassword('');
      } else {
        alert("No active admin user found.");
      }
    } catch (error) {
      // Handle incorrect password or other errors
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        alert("Incorrect Current Password. Please try again.");
      } else {
        alert("Error changing password: " + error.message);
      }
    }
    setPwdLoading(false);
  };

  return (
    <div className="max-w-3xl pb-10">
      <div className="flex items-center space-x-3 mb-6">
        <SettingsIcon className="text-gray-700" size={28} />
        <h2 className="text-2xl font-bold text-gray-800">App Configuration</h2>
      </div>
      
      {/* =========================================
          SECTION 1: APP CONFIGURATION
      ========================================= */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* General Links Section */}
          <div>
            <h3 className="text-lg font-bold text-blue-600 mb-4 border-b pb-2">1. General App Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Admin WhatsApp URL</label>
                <input type="text" value={settings.adminContactLink} onChange={(e) => setSettings({...settings, adminContactLink: e.target.value})} placeholder="https://wa.me/919876543210" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Official Channel Link</label>
                <input type="text" value={settings.officialChannelLink} onChange={(e) => setSettings({...settings, officialChannelLink: e.target.value})} placeholder="https://whatsapp.com/channel/..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Support Email ID</label>
                <input type="email" value={settings.contactEmail} onChange={(e) => setSettings({...settings, contactEmail: e.target.value})} placeholder="support@wpboostup.com" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
            </div>
          </div>

          {/* Legal Pages Section */}
          <div>
            <h3 className="text-lg font-bold text-blue-600 mb-4 border-b pb-2">2. Legal & Policies</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Privacy Policy URL</label>
                <input type="url" value={settings.privacyPolicyLink || ''} onChange={(e) => setSettings({...settings, privacyPolicyLink: e.target.value})} placeholder="https://yourwebsite.com/privacy" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Terms of Service URL</label>
                <input type="url" value={settings.termsLink || ''} onChange={(e) => setSettings({...settings, termsLink: e.target.value})} placeholder="https://yourwebsite.com/terms" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div>
            <h3 className="text-lg font-bold text-blue-600 mb-4 border-b pb-2">3. Pricing Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Promote Link Price</label>
                <input type="text" value={settings.promotePrice} onChange={(e) => setSettings({...settings, promotePrice: e.target.value})} placeholder="e.g. ₹200" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Premium (Monthly)</label>
                <input type="text" value={settings.premiumMonthlyPrice} onChange={(e) => setSettings({...settings, premiumMonthlyPrice: e.target.value})} placeholder="e.g. ₹99 / Month" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Premium (Lifetime)</label>
                <input type="text" value={settings.premiumLifetimePrice} onChange={(e) => setSettings({...settings, premiumLifetimePrice: e.target.value})} placeholder="e.g. ₹499" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="flex items-center justify-center space-x-2 w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 mt-8">
            <Save size={20} />
            <span>{loading ? 'Saving Changes...' : 'Save App Settings'}</span>
          </button>
        </form>
      </div>

      {/* =========================================
          SECTION 2: ADMIN SECURITY (CHANGE PASSWORD)
      ========================================= */}
      <div className="flex items-center space-x-3 mb-6 mt-10">
        <Lock className="text-gray-700" size={28} />
        <h2 className="text-2xl font-bold text-gray-800">Admin Security</h2>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100">
        <form onSubmit={handlePasswordChange} className="space-y-6">
          <p className="text-sm text-gray-500 mb-4">Change your admin panel login password. You must enter your current password to verify your identity.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password *</label>
              <input 
                type="password" 
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)} 
                placeholder="Enter current password" 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">New Password *</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Enter new password (min 6 chars)" 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" 
                required 
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" disabled={pwdLoading} className="flex items-center justify-center space-x-2 w-full md:w-auto px-8 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors shadow-md disabled:opacity-50 mt-4">
            <KeyRound size={18} />
            <span>{pwdLoading ? 'Updating Password...' : 'Change Password'}</span>
          </button>
        </form>
      </div>

    </div>
  );
}
