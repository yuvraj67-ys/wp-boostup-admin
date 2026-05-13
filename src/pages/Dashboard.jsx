import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Users, Link as LinkIcon, CheckCircle, Clock } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, pendingLinks: 0, approvedLinks: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const usersSnap = await getDocs(collection(db, "Users"));
      const linksSnap = await getDocs(collection(db, "Links"));
      
      let pending = 0;
      let approved = 0;
      
      linksSnap.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'pending') pending++;
        if (data.status === 'approved') approved++;
      });

      setStats({
        users: usersSnap.size,
        pendingLinks: pending,
        approvedLinks: approved
      });
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm flex items-center space-x-4">
      <div className={`p-4 rounded-full ${color}`}>
        <Icon className="text-white" size={24} />
      </div>
      <div>
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Users" value={stats.users} icon={Users} color="bg-blue-500" />
        <StatCard title="Pending Links" value={stats.pendingLinks} icon={Clock} color="bg-orange-500" />
        <StatCard title="Approved Links" value={stats.approvedLinks} icon={CheckCircle} color="bg-primary" />
      </div>
    </div>
  );
}
