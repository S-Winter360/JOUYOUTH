import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [members, setMembers] = useState<any[]>([]);
  const [filterRole, setFilterRole] = useState('All');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');

  const navigate = useNavigate();

  useEffect(() => {
    const auth = localStorage.getItem('joyouth_admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    
    const storedMembers = JSON.parse(localStorage.getItem('joyouth_members') || '[]');
    setMembers(storedMembers);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'joyouth123') {
      setIsAuthenticated(true);
      localStorage.setItem('joyouth_admin_auth', 'true');
      setError('');
    } else {
      setError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('joyouth_admin_auth');
    navigate('/');
  };

  const handleApprove = (id: string) => {
    const updatedMembers = members.map(m => m.id === id ? { ...m, status: 'approved' } : m);
    setMembers(updatedMembers);
    localStorage.setItem('joyouth_members', JSON.stringify(updatedMembers));
  };

  const handleReject = (id: string) => {
    const updatedMembers = members.filter(m => m.id !== id);
    setMembers(updatedMembers);
    localStorage.setItem('joyouth_members', JSON.stringify(updatedMembers));
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Role', 'Availability', 'Motivation', 'Status', 'Date'];
    const csvContent = [
      headers.join(','),
      ...members.map(m => [
        `"${m.name}"`,
        `"${m.phone}"`,
        `"${m.email}"`,
        `"${m.role}"`,
        `"${m.availability}"`,
        `"${m.motivation.replace(/"/g, '""')}"`,
        `"${m.status}"`,
        `"${new Date(m.date).toLocaleString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `joyouth_applicants_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md p-8 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-normal text-white mb-2">Admin Login</h1>
            <p className="text-slate-400 text-sm">Sign in to access the dashboard</p>
          </div>
          
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full h-12 mt-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredMembers = members.filter(m => filterRole === 'All' || m.role === filterRole);
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortBy === 'latest' ? dateB - dateA : dateA - dateB;
  });

  const roles = ['All', ...Array.from(new Set(members.map(m => m.role)))];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-normal text-white">Admin Dashboard</h1>
            <p className="text-slate-400">Manage volunteer applications</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={exportToCSV}
              className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors flex items-center gap-2"
            >
              <iconify-icon icon="solar:download-linear"></iconify-icon>
              Export CSV
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-white/[0.05] text-white border border-white/[0.1] hover:bg-white/[0.1] transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div className="flex-1">
            <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider">Filter by Role</label>
            <select 
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider">Sort by</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'latest' | 'oldest')}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="latest">Latest Submissions</option>
              <option value="oldest">Oldest Submissions</option>
            </select>
          </div>
          <div className="flex-1 flex items-end">
            <div className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-center">
              <span className="text-white font-medium">{sortedMembers.length}</span> <span className="text-slate-400">Total Applicants</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMembers.map(member => (
            <div 
              key={member.id} 
              className={`p-6 rounded-2xl bg-white/[0.02] border backdrop-blur-sm transition-all ${
                member.status === 'approved' 
                  ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                  : 'border-white/[0.08]'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-normal text-white">{member.name}</h3>
                  <span className="inline-block px-2 py-1 mt-1 rounded text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {member.role}
                  </span>
                </div>
                {member.status === 'approved' && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                    <iconify-icon icon="solar:check-circle-bold"></iconify-icon> Approved
                  </span>
                )}
                {member.status === 'pending' && (
                  <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
                    <iconify-icon icon="solar:clock-circle-bold"></iconify-icon> Pending
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm text-slate-400 mb-6">
                <p className="flex items-center gap-2">
                  <iconify-icon icon="solar:phone-linear"></iconify-icon> {member.phone}
                </p>
                <p className="flex items-center gap-2">
                  <iconify-icon icon="solar:letter-linear"></iconify-icon> {member.email}
                </p>
                <p className="flex items-start gap-2">
                  <iconify-icon icon="solar:calendar-linear" class="mt-0.5"></iconify-icon> 
                  <span className="text-xs">{member.availability}</span>
                </p>
                <div className="mt-4 p-3 rounded-lg bg-black/20 border border-white/5 text-xs">
                  <p className="text-slate-500 mb-1 uppercase tracking-wider" style={{fontSize: '10px'}}>Motivation</p>
                  <p className="text-slate-300 line-clamp-3" title={member.motivation}>{member.motivation}</p>
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  Submitted: {new Date(member.date).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-3 mt-auto pt-4 border-t border-white/5">
                {member.status !== 'approved' && (
                  <button 
                    onClick={() => handleApprove(member.id)}
                    className="flex-1 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <iconify-icon icon="solar:check-circle-linear"></iconify-icon> Approve
                  </button>
                )}
                <button 
                  onClick={() => handleReject(member.id)}
                  className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <iconify-icon icon="solar:trash-bin-trash-linear"></iconify-icon> Reject
                </button>
              </div>
            </div>
          ))}

          {sortedMembers.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              No applicants found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
