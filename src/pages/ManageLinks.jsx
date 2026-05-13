import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function ManageLinks() {
  const [links, setLinks] = useState([]);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "Links"), (snapshot) => {
      const linksData = [];
      snapshot.forEach((doc) => linksData.push({ id: doc.id, ...doc.data() }));
      // Sort by newest first
      linksData.sort((a, b) => b.timestamp - a.timestamp);
      setLinks(linksData);
    });
    return () => unsubscribe();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "Links", id), { status });
      // NOTE FOR PUSH NOTIFICATIONS:
      // If you setup a Vercel Serverless Function later, you would call it here:
      // fetch('/api/send-notification', { method: 'POST', body: JSON.stringify({ userId, status }) })
    } catch (error) {
      alert("Error updating status: " + error.message);
    }
  };

  const togglePromoted = async (id, currentStatus) => {
    await updateDoc(doc(db, "Links", id), { isPromoted: !currentStatus });
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
      
      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        {['pending', 'approved', 'rejected'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg font-medium capitalize ${
              filter === tab ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4">Image & Title</th>
              <th className="p-4">Type / Category</th>
              <th className="p-4">Views</th>
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
                    <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">View Link</a>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded-full text-white ${link.type === 'Group' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                    {link.type}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{link.category}</p>
                </td>
                <td className="p-4 text-gray-600">{link.viewsCount}</td>
                <td className="p-4 flex flex-wrap gap-2">
                  {filter === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(link.id, 'approved')} className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200">Approve</button>
                      <button onClick={() => updateStatus(link.id, 'rejected')} className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200">Reject</button>
                    </>
                  )}
                  {filter === 'approved' && (
                    <>
                      <button 
                        onClick={() => togglePromoted(link.id, link.isPromoted)} 
                        className={`px-3 py-1 rounded text-sm ${link.isPromoted ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {link.isPromoted ? 'Un-Promote' : 'Make Promoted'}
                      </button>
                    </>
                  )}
                  <button onClick={() => deleteLink(link.id)} className="bg-red-50 text-red-500 px-3 py-1 rounded text-sm hover:bg-red-100">Delete</button>
                </td>
              </tr>
            ))}
            {filteredLinks.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">No {filter} links found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
                }
