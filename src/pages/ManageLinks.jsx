import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Search, Trash2, XCircle, CheckCircle, Eye, Plus } from 'lucide-react';

export default function ManageLinks() {
  const [links, setLinks] = useState([]);
  const [filter, setFilter] = useState('pending_free');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for Add Link Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '', type: 'Group', category: 'Technology', profilePicUrl: '', isPromoted: false });

  const categories = ["Technology", "Entertainment", "Education", "Gaming", "News & Politics", "Sports", "Health & Fitness", "Finance & Crypto", "Music & Audio", "Lifestyle & Fashion", "Shopping & Offers", "Funny & Memes", "Other"];

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
      if(newStatus === 'rejected' && !window.confirm("Are you sure you want to hide/reject this link?")) return;
      await updateDoc(doc(db, "Links", linkId), { status: newStatus });

      if(uid !== "admin") {
        const userDoc = await getDoc(doc(db, "Users", uid));
        if (userDoc.exists() && userDoc.data().deviceToken) {
          const title = newStatus === 'approved' ? 'Link Approved! 🎉' : 'Link Removed/Rejected ❌';
          fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceToken: userDoc.data().deviceToken, title, body: `Your link "${linkTitle}" has been ${newStatus}.` })
          }).catch(() => {});
        }
      }
    } catch (error) { alert("Error: " + error.message); }
  };

  const deleteLink = async (id) => {
    if (window.confirm("PERMANENTLY delete this link?")) await deleteDoc(doc(db, "Links", id));
  };

  // ADD LINK FUNCTION
  // ADD LINK FUNCTION WITH AUTO DP FETCH
  const handleAddLink = async (e) => {
    e.preventDefault();
    try {
      setIsModalOpen(false); // Close modal immediately
      
      let finalPicUrl = newLink.profilePicUrl;
      
      // FIX: Auto fetch profile pic using a proxy if not provided
      if (!finalPicUrl && newLink.url) {
        try {
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(newLink.url)}`;
          const response = await fetch(proxyUrl);
          const data = await response.json();
          const match = data.contents.match(/<meta property="og:image" content="([^"]+)"/);
          if (match && match[1]) {
            finalPicUrl = match[1];
          } else {
            finalPicUrl = "https://i.ibb.co/4pDNDk1/avatar-contact.png";
          }
        } catch (err) {
          finalPicUrl = "https://i.ibb.co/4pDNDk1/avatar-contact.png";
        }
      }

      const linkId = "admin_" + Date.now();
      await setDoc(doc(db, "Links", linkId), {
        linkId: linkId,
        uid: "admin",
        title: newLink.title,
        url: newLink.url,
        type: newLink.type,
        category: newLink.category,
        profilePicUrl: finalPicUrl,
        isPromoted: newLink.isPromoted,
        status: "approved",
        viewsCount: 0,
        timestamp: Date.now()
      });
      alert("Link Added Successfully with Image!");
      setNewLink({ title: '', url: '', type: 'Group', category: 'Technology', profilePicUrl: '', isPromoted: false });
    } catch (error) {
      alert("Failed to add link: " + error.message);
    }
  };

  let displayedLinks = links;
  if (filter === 'pending_free') displayedLinks = links.filter(l => l.status === 'pending' && !l.isPromoted);
  else if (filter === 'pending_promoted') displayedLinks = links.filter(l => l.status === 'pending' && l.isPromoted);
  else displayedLinks = links.filter(l => l.status === filter);

  if (searchTerm) {
    displayedLinks = displayedLinks.filter(l => 
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.uid.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return (
    <div className="pb-10 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Content (Links)</h2>
        
        <div className="flex space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search Title..." className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-blue-700 transition-colors">
            <Plus size={18}/> <span>Add Link</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 w-fit">
        {[ { id: 'pending_free', label: 'Pending (Free)' }, { id: 'pending_promoted', label: 'Pending (Paid)' }, { id: 'approved', label: 'Approved (Live)' }, { id: 'rejected', label: 'Hidden/Rejected' } ].map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${filter === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>{tab.label}</button>
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
              <tr><td colSpan="4" className="p-10 text-center text-gray-500 font-medium">No links found</td></tr>
            ) : displayedLinks.map((link) => (
              <tr key={link.id} className="border-b border-gray-50 hover:bg-blue-50/50">
                <td className="p-4 flex items-center space-x-4">
                  <img src={link.profilePicUrl} alt="DP" className="w-12 h-12 rounded-full object-cover bg-gray-200 border border-gray-200" />
                  <div>
                    <a href={link.url} target="_blank" rel="noreferrer" className="font-bold text-gray-900 hover:text-blue-600 hover:underline">{link.title}</a>
                    <p className="text-xs text-gray-400 font-mono mt-1">UID: {link.uid === 'admin' ? 'ADMIN' : link.uid.substring(0,8)}</p>
                    {link.isPromoted && <span className="mt-1 inline-block bg-yellow-100 text-yellow-800 text-[10px] font-black px-2 py-0.5 rounded border border-yellow-200">PROMOTED</span>}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col items-start gap-1">
                    <span className={`px-2 py-0.5 text-[11px] font-black uppercase rounded ${link.type === 'Group' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{link.type}</span>
                    <span className="text-xs text-gray-600 font-medium">{link.category}</span>
                  </div>
                </td>
                <td className="p-4 text-gray-500 font-semibold text-sm"><Eye size={16} className="inline mr-1"/>{link.viewsCount || 0}</td>
                <td className="p-4 flex justify-center gap-2">
                  {(filter === 'pending_free' || filter === 'pending_promoted' || filter === 'rejected') && (
                    <button onClick={() => updateStatus(link.id, link.uid, 'approved', link.title)} className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-md hover:bg-green-600 hover:text-white"><CheckCircle size={18}/></button>
                  )}
                  {(filter === 'pending_free' || filter === 'pending_promoted' || filter === 'approved') && (
                    <button onClick={() => updateStatus(link.id, link.uid, 'rejected', link.title)} className="w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 rounded-md hover:bg-orange-600 hover:text-white"><XCircle size={18}/></button>
                  )}
                  <button onClick={() => deleteLink(link.id)} className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-md hover:bg-red-600 hover:text-white"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Link Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Add New Link (Live)</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={24}/></button>
            </div>
            <form onSubmit={handleAddLink} className="space-y-4">
              <input type="text" placeholder="Title" required value={newLink.title} onChange={e => setNewLink({...newLink, title: e.target.value})} className="w-full p-3 border rounded-lg" />
              <input type="url" placeholder="WhatsApp URL (chat.whatsapp.com...)" required value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} className="w-full p-3 border rounded-lg" />
              <input type="url" placeholder="Image URL (Optional)" value={newLink.profilePicUrl} onChange={e => setNewLink({...newLink, profilePicUrl: e.target.value})} className="w-full p-3 border rounded-lg text-sm" />
              
              <div className="flex gap-4">
                <select value={newLink.type} onChange={e => setNewLink({...newLink, type: e.target.value})} className="w-1/2 p-3 border rounded-lg bg-white">
                  <option value="Group">Group</option>
                  <option value="Channel">Channel</option>
                </select>
                <select value={newLink.category} onChange={e => setNewLink({...newLink, category: e.target.value})} className="w-1/2 p-3 border rounded-lg bg-white">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={newLink.isPromoted} onChange={e => setNewLink({...newLink, isPromoted: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="font-semibold text-gray-700">Mark as Promoted (Shows at Top)</span>
              </label>

              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 mt-2">Publish Directly to App</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
