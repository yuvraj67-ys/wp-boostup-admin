import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Search, Trash2, XCircle, CheckCircle, Eye } from 'lucide-react';

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
      if(newStatus === 'rejected' && !window.confirm("Are you sure you want to hide/reject this link from the app?")) return;
      
      await updateDoc(doc(db, "Links", linkId), { status: newStatus });

      // Notify User
      const userDoc = await getDoc(doc(db, "Users", uid));
      if (userDoc.exists() && userDoc.data().deviceToken) {
        const title = newStatus === 'approved' ? 'Link Approved! 🎉' : 'Link Removed/Rejected ❌';
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
    if (window.confirm("Are you sure you want to PERMANENTLY delete this link? This action cannot be undone.")) {
      await deleteDoc(doc(db, "Links", id));
    }
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
    <div className="pb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Content (Links)</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search Title or User ID..." 
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-72 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 w-fit">
        {[
          { id: 'pending_free', label: 'Pending (Free)' },
          { id: 'pending_promoted', label: 'Pending (Paid)' },
          { id: 'approved', label: 'Approved (Live in App)' },
          { id: 'rejected', label: 'Rejected/Hidden' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              filter === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-700 border-b border-gray-200 text-sm">
            <tr>
              <th className="p-4 font-bold">Link Details</th>
              <th className="p-4 font-bold">Type & Category</th>
              <th className="p-4 font-bold">Views</th>
              <th className="p-4 font-bold text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedLinks.length === 0 ? (
              <tr><td colSpan="4" className="p-10 text-center text-gray-500 font-medium text-lg">No links found in this category.</td></tr>
            ) : displayedLinks.map((link) => (
              <tr key={link.id} className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors">
                <td className="p-4 flex items-center space-x-4">
                  <img src={link.profilePicUrl} alt="DP" className="w-14 h-14 rounded-full object-cover bg-gray-200 shadow-sm border border-gray-200" />
                  <div>
                    <a href={link.url} target="_blank" rel="noreferrer" className="font-bold text-gray-900 hover:text-blue-600 hover:underline">{link.title}</a>
                    <p className="text-xs text-gray-400 font-mono mt-1">By UID: {link.uid.substring(0,10)}...</p>
                    {link.isPromoted && <span className="mt-1 inline-block bg-yellow-100 text-yellow-800 text-[10px] font-black px-2 py-0.5 rounded border border-yellow-200 uppercase tracking-wider">Promoted</span>}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col items-start gap-1">
                    <span className={`px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-md ${link.type === 'Group' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                      {link.type}
                    </span>
                    <span className="text-sm text-gray-600 font-medium">{link.category}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Eye size={16} />
                    <span className="font-semibold text-sm">{link.viewsCount || 0}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex justify-center gap-2">
                    
                    {/* Approve Button (Only for Pending or Rejected) */}
                    {(filter === 'pending_free' || filter === 'pending_promoted' || filter === 'rejected') && (
                      <button onClick={() => updateStatus(link.id, link.uid, 'approved', link.title)} title="Approve Link" className="flex items-center justify-center w-9 h-9 bg-green-100 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors">
                        <CheckCircle size={20}/>
                      </button>
                    )}

                    {/* Hide/Reject Button (For Pending or Already Approved ones) */}
                    {(filter === 'pending_free' || filter === 'pending_promoted' || filter === 'approved') && (
                      <button onClick={() => updateStatus(link.id, link.uid, 'rejected', link.title)} title="Hide / Reject Link" className="flex items-center justify-center w-9 h-9 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-600 hover:text-white transition-colors">
                        <XCircle size={20}/>
                      </button>
                    )}

                    {/* Permanent Delete Button (Available everywhere) */}
                    <button onClick={() => deleteLink(link.id)} title="Delete Permanently" className="flex items-center justify-center w-9 h-9 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors">
                      <Trash2 size={20}/>
                    </button>
                    
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
