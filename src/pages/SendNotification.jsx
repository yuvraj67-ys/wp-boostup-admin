import React, { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Send, Bell, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

export default function SendNotification() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title || !body) return alert("Please fill Title and Message fields");
    
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, "Users"));
      const tokens = [];
      
      usersSnap.forEach((doc) => {
        const token = doc.data().deviceToken;
        if (token) tokens.push(token);
      });

      if (tokens.length === 0) {
        alert("No users found with valid device tokens.");
        setLoading(false);
        return;
      }

      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens, title, body, actionUrl, imageUrl })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Successfully sent notification to ${tokens.length} users!`);
        setTitle(''); setBody(''); setActionUrl(''); setImageUrl('');
      } else {
        alert(`Failed to send: ${result.error}`);
      }
    } catch (error) {
      alert("Error sending notification: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl pb-10">
      <div className="flex items-center space-x-3 mb-6">
        <Bell className="text-blue-600" size={28} />
        <h2 className="text-2xl font-bold text-gray-800">Push Notifications Studio</h2>
      </div>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleSend} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Notification Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 🔥 New VIP Premium Group Added!" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Message Body *</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type your message here..." rows="3" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" required />
            </div>

            {/* Optional URL */}
            <div className="md:col-span-2">
              <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 mb-1">
                <LinkIcon size={16} className="text-gray-500"/> <span>Action URL (Optional)</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">When user clicks the notification, this link will open (App link, PlayStore, or Web URL).</p>
              <input type="url" value={actionUrl} onChange={(e) => setActionUrl(e.target.value)} placeholder="https://play.google.com/store/apps/details?id=com.urmods.wpboostup" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            {/* Optional Image */}
            <div className="md:col-span-2">
              <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 mb-1">
                <ImageIcon size={16} className="text-gray-500"/> <span>Banner Image URL (Optional)</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">Provide a direct image link (JPG/PNG) to show a big banner in the notification.</p>
              <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/banner.jpg" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="flex items-center justify-center space-x-2 w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 mt-4">
            <Send size={20} />
            <span>{loading ? 'Sending to all users...' : 'Broadcast Notification'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
