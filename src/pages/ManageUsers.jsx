import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Search, Crown } from 'lucide-react';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all'); // all, premium, normal
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "Users"), (snapshot) => {
      const usersData = [];
      snapshot.forEach((doc) => usersData.push({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    });
    return () => unsubscribe();
  }, []);

  const togglePremium = async (id, currentStatus) => {
    await updateDoc(doc(db, "Users", id), { isPremium: !currentStatus });
  };

  const toggleBanStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    await updateDoc(doc(db, "Users", id), { status: newStatus });
  };

  let displayedUsers = users;
  if (filter === 'premium') displayedUsers = users.filter(u => u.isPremium);
  if (filter === 'normal') displayedUsers = users.filter(u => !u.isPremium);

  if (searchTerm) {
    displayedUsers = displayedUsers.filter(u => 
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) || 
      u.uid.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Users</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search Email or UID..." 
            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex space-x-2 mb-6 bg-white p-1 rounded-lg shadow-sm border border-gray-100 inline-flex">
        {[
          { id: 'all', label: 'All Users' },
          { id: 'premium', label: 'Premium Users' },
          { id: 'normal', label: 'Normal Users' }
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
              <th className="p-4 font-semibold">User Details</th>
              <th className="p-4 font-semibold">Premium Status</th>
              <th className="p-4 font-semibold">Account Status</th>
              <th className="p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedUsers.map((user) => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <p className="font-bold text-gray-800">{user.email === 'No Email' ? 'Guest User' : user.email}</p>
                  <p className="text-xs text-gray-400 font-mono mt-1">{user.uid}</p>
                </td>
                <td className="p-4">
                  {user.isPremium ? (
                    <span className="inline-flex items-center space-x-1 bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-md text-xs font-bold">
                      <Crown size={14}/> <span>PREMIUM</span>
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold">FREE</span>
                  )}
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${user.status === 'banned' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {user.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => togglePremium(user.id, user.isPremium)} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-100 border border-blue-100">
                    {user.isPremium ? 'Remove Premium' : 'Make Premium'}
                  </button>
                  <button onClick={() => toggleBanStatus(user.id, user.status)} className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-200 border border-gray-200">
                    {user.status === 'active' ? 'Ban' : 'Unban'}
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
