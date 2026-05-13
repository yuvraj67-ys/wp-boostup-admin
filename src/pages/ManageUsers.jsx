import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);

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

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Users</h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4">User ID / Email</th>
              <th className="p-4">Premium Status</th>
              <th className="p-4">Account Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-gray-100">
                <td className="p-4">
                  <p className="font-medium text-gray-800">{user.email || 'Anonymous User'}</p>
                  <p className="text-xs text-gray-400 font-mono">{user.uid}</p>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${user.isPremium ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                    {user.isPremium ? 'Premium' : 'Free'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${user.status === 'banned' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="p-4 flex space-x-2">
                  <button 
                    onClick={() => togglePremium(user.id, user.isPremium)}
                    className="bg-blue-50 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-100"
                  >
                    Toggle Premium
                  </button>
                  <button 
                    onClick={() => toggleBanStatus(user.id, user.status)}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200"
                  >
                    {user.status === 'active' ? 'Ban User' : 'Unban User'}
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
