import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Crown, Check } from 'lucide-react';

export default function PremiumRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "PremiumRequests"), (snapshot) => {
      const reqData = [];
      snapshot.forEach((doc) => reqData.push({ id: doc.id, ...doc.data() }));
      reqData.sort((a, b) => b.timestamp - a.timestamp);
      setRequests(reqData);
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = async (requestId, uid, planType) => {
    try {
      if(window.confirm(`Approve this user for ${planType} Premium?`)){
        await updateDoc(doc(db, "PremiumRequests", requestId), { status: 'approved' });
        
        // FIX: Save Plan type to User document
        await updateDoc(doc(db, "Users", uid), { 
          isPremium: true,
          premiumPlan: planType,
          premiumDate: new Date().toISOString()
        });

        const userDoc = await getDoc(doc(db, "Users", uid));
        if (userDoc.exists() && userDoc.data().deviceToken) {
          fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceToken: userDoc.data().deviceToken, title: "Premium Activated! 👑", body: `Your ${planType} Premium membership is now active.` })
          }).catch(() => {});
        }
        alert("User successfully upgraded to Premium!");
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div>
      <div className="flex items-center space-x-3 mb-6">
        <Crown className="text-yellow-500" size={28} />
        <h2 className="text-2xl font-bold text-gray-800">Premium Upgrade Requests</h2>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-yellow-800 text-sm">
        <p className="font-bold">How it works:</p>
        <p>When users click "Buy Premium", their request appears here. Verify payment on WhatsApp before clicking Approve.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-100 text-sm">
            <tr>
              <th className="p-4 font-semibold">User Email</th>
              <th className="p-4 font-semibold">Plan Requested</th>
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingRequests.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-500 font-medium">No pending requests</td></tr>
            ) : pendingRequests.map((req) => (
              <tr key={req.id} className="border-b border-gray-50">
                <td className="p-4 font-bold text-gray-800">{req.email} <br/><span className="text-xs text-gray-400">{req.uid}</span></td>
                <td className="p-4"><span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{req.planType}</span></td>
                <td className="p-4 text-sm text-gray-500">{new Date(req.timestamp).toLocaleDateString()}</td>
                <td className="p-4">
                  <button onClick={() => handleApprove(req.id, req.uid, req.planType)} className="flex items-center space-x-1 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow">
                    <Check size={16}/> <span>Verify & Approve</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
