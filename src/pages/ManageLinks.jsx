import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function ManageLinks() {
  const [links, setLinks] = useState([]);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "Links"), (snapshot) => {
      const linksData = [];
      snapshot.forEach((doc) => linksData.push({ id: doc.id, ...doc.data() }));
      linksData.sort((a, b) => b.timestamp - a.timestamp);
      setLinks(linksData);
    });
    return () => unsubscribe();
  }, []);

  const updateStatus = async (linkId, uid, newStatus, linkTitle) => {
    try {
      await updateDoc(doc(db, "Links", linkId), { status: newStatus });

      const userDoc = await getDoc(doc(db, "Users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.deviceToken) {
          const notificationTitle = newStatus === 'approved' ? 'Link Approved! 🎉' : 'Link Rejected ❌';
          const notificationBody = `Your link "${linkTitle}" has been ${newStatus}.`;

          // Trigger Vercel API Notification (Non-blocking)
          fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deviceToken: userData.deviceToken,
              title: notificationTitle,
              body: notificationBody
            })
          }).catch(err => console.log("Push notification silent failure:", err));
        }
      }
    } catch (error) {
      alert("Error updating status: " + error.message);
    }
  };

  const deleteLink = async (id) => {
    if (window.confirm("Are you sure you want to delete this link?")) {
      await deleteDoc(doc(db, "Links", id));
    }
  };

  const filteredLinks = links.filter(link => link.status === filter);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Links</h2>
      <div className="flex space-x-4 mb-6">
        {['pending', 'approved', 'rejected'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg font-medium capitalize ${
              filter === tab ? 'bg-primary text-white' : 'bg-white text-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4">Image & Title</th>
              <th className="p-4">Type</th>
              <th className="p-4">Status Tag</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLinks.map((link) => (
              <tr key={link.id} className="border-t border-gray-100">
                <td className="p-4 flex items-center space-x-3">
                  <img src={link.profilePicUrl} alt="DP" className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                  <div>
                    <p className="font-medium text-gray-800">{link.title}</p>
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-500">{link.type}</td>
                <td className="p-4 text-sm">
                  {link.isPromoted ? (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">PROMOTED</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">FREE</span>
                  )}
                </td>
                <td className="p-4 flex gap-2">
                  {filter === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(link.id, link.uid, 'approved', link.title)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200">Approve</button>
                      <button onClick={() => updateStatus(link.id, link.uid, 'rejected', link.title)} className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200">Reject</button>
                    </>
                  )}
                  <button onClick={() => deleteLink(link.id)} className="bg-red-50 text-red-500 px-3 py-1 rounded text-sm hover:bg-red-100">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
