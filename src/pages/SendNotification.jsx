import React, { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Send, Bell } from 'lucide-react';

export default function SendNotification() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title || !body) return alert("Please fill all fields");
    
    setLoading(true);
    try {
      // Fetch all users to get their device tokens
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

      // Send to Vercel API
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens, title, body })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Successfully sent notification to ${tokens.length} users!`);
        setTitle('');
        setBody('');
      } else {
        alert(`Failed to send: ${result.error}`);
      }

    } catch (error) {
      alert("Error sending notification: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center space-x-3 mb-6">
        <Bell className="text-primary" size={28} />
        <h2 className="text-2xl font-bold text-gray-800">Send Push Notification</h2>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <form onSubmit={handleSend} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notification Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 🔥 New VIP Group Added!"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notification Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message here..."
              rows="4"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center justify-center space-x-2 w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primaryDark transition-colors disabled:opacity-50"
          >
            <Send size={20} />
            <span>{loading ? 'Sending to all users...' : 'Send Global Notification'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
