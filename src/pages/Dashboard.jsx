import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Users, Link as LinkIcon, CheckCircle, Crown, Rocket } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, premiumUsers: 0, pendingLinks: 0, promotedLinks: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const usersSnap = await getDocs(collection(db, "Users"));
      const linksSnap = await getDocs(collection(db, "Links"));
      
      let premiumU = 0;
      usersSnap.forEach(doc => { if (doc.data().isPremium) premiumU++; });

      let pending = 0;
      let promoted = 0;
      linksSnap.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'pending') pending++;
        if (data.isPromoted) promoted++;
      });

      setStats({
        users: usersSnap.size,
        premiumUsers: premiumU,
        pendingLinks: pending,
        promotedLinks: promoted
      });
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, bg }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 transition-transform hover:-translate-y-1">
      <div className={`p-4 rounded-xl ${bg}`}>
        <Icon className={color} size={28} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-gray-500 text-sm font-semibold mb-1">{title}</p>
        <p className="text-3xl font-black text-gray-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Overview Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.users} icon={Users} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Premium Users" value={stats.premiumUsers} icon={Crown} color="text-yellow-600" bg="bg-yellow-50" />
        <StatCard title="Pending Links" value={stats.pendingLinks} icon={LinkIcon} color="text-orange-600" bg="bg-orange-50" />
        <StatCard title="Promoted Links" value={stats.promotedLinks} icon={Rocket} color="text-purple-600" bg="bg-purple-50" />
      </div>
    </div>
  );
}
