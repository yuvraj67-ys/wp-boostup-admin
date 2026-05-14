import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Search } from 'lucide-react';

export default function ManageLinks() {
  const [links, setLinks] = useState([]);
  const [filter, setFilter] = useState('pending_free'); // pending_free, pending_promoted, approved, rejected
  const [searchTerm, setSearchTerm] = useState('');

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

      // Notify User
      const userDoc = await getDoc(doc(db, "Users", uid));
      if (userDoc.exists() && userDoc.data().deviceToken) {
        const title = newStatus === 'approved' ? 'Link Approved! 🎉' : 'Link Rejected ❌';
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceToken: userDoc.data().deviceToken, title, body: `Your link "${linkTitle}" has been ${newStatus}.` })
        }).catch(() => {});
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const deleteLink = async (id) => {
    if (window.confirm("Delete this link permanently?")) await deleteDoc(doc(db, "Links", id));
  };

  // Filter Logic
  let displayedLinks = links;
  if (filter === 'pending_free') displayedLinks = links.filter(l => l.status === 'pending' && !l.isPromoted);
  else if (filter === 'pending_promoted') displayedLinks = links.filter(l => l.status === 'pending' && l.isPromoted);
  else displayedLinks = links.filter(l => l.status === filter);

  // Search Logic
  if (searchTerm) {
    displayedLinks = displayedLinks.filter(l => 
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.uid.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Links</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search Title or User ID..." 
            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex space-x-2 mb-6 bg-white p-1 rounded-lg shadow-sm border border-gray-100 inline-flex">
        {[
          { id: 'pending_free', label: 'Pending (Free)' },
          { id: 'pending_promoted', label: 'Pending (Paid/Promoted)' },
          { id: 'approved', label: 'Approved' },
          { id: 'rejected', label: 'Rejected' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${
              filter === tab.id ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-100 text-sm">
            <tr>
              <th className="p-4 font-semibold">Link Details</th>
              <th className="p-4 font-semibold">Type</th>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedLinks.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-500">No links found</td></tr>
            ) : displayedLinks.map((link) => (
              <tr key={link.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="p-4 flex items-center space-x-3">
                  <img src={link.profilePicUrl} alt="DP" className="w-12 h-12 rounded-full object-cover bg-gray-200 shadow-sm" />
                  <div>
                    <p className="font-bold text-gray-800">{link.title}</p>
                    <p className="text-xs text-gray-400 font-mono mt-1">UID: {link.uid.substring(0,8)}...</p>
                    {link.isPromoted && <span className="mt-1 inline-block bg-yellow-100 text-yellow-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Promoted Paid</span>}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-md ${link.type === 'Group' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {link.type}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-600">{link.category}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {(filter === 'pending_free' || filter === 'pending_promoted') && (
                      <>
                        <button onClick={() => updateStatus(link.id, link.uid, 'approved', link.title)} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-600">Approve</button>
                        <button onClick={() => updateStatus(link.id, link.uid, 'rejected', link.title)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-100">Reject</button>
                      </>
                    )}
                    <button onClick={() => deleteLink(link.id)} className="text-gray-400 hover:text-red-500 p-1.5"><Search size={18}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
