import React, { useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, RefreshCw, Send, ShieldCheck, HardDrive } from 'lucide-react';
import { MongoStatus } from '../../types';
import { adminApi } from '../../api';
import { toast } from '../../context/ToastContext';

interface DatabaseAtlasTabProps {
  mongoStatus: MongoStatus;
  totalUsers: number;
  totalProjects: number;
  totalAudits: number;
  onStatusRefreshed: () => void;
}

export const DatabaseAtlasTab: React.FC<DatabaseAtlasTabProps> = ({
  mongoStatus,
  totalUsers,
  totalProjects,
  totalAudits,
  onStatusRefreshed
}) => {
  const [atlasUri, setAtlasUri] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleConnectAtlas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!atlasUri.trim()) return;
    setIsConnecting(true);
    setTestResult(null);
    try {
      const res = await adminApi.saveMongoUri(atlasUri.trim());
      onStatusRefreshed();
      if (res.connected) {
        setTestResult(`Successfully connected to MongoDB Atlas! Database: ${res.dbName}`);
        toast.success(`MongoDB Atlas connection established and synchronized with database: ${res.dbName}!`, 'Database Connected');
      } else {
        setTestResult(res.message);
        toast.warning(res.message, 'Atlas Connection Status');
      }
    } catch (err: any) {
      setTestResult(err.message || 'Failed to connect to MongoDB Atlas');
      toast.error(err.message || 'Failed to connect to MongoDB Atlas', 'Atlas Connection Failed');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="max-w-4xl text-left space-y-6">
      {/* Status Overview Card */}
      <div className={`p-6 rounded-2xl border ${
        mongoStatus.connected
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-amber-50 border-amber-200'
      } shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div className="flex items-start space-x-3">
          <div className={`p-3 rounded-xl ${
            mongoStatus.connected ? 'bg-emerald-500/20 text-emerald-700' : 'bg-amber-500/20 text-amber-700'
          }`}>
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                mongoStatus.connected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-500/40'
                  : 'bg-amber-50 text-amber-700 border-amber-500/40'
              }`}>
                {mongoStatus.connected ? 'Live Atlas Cluster' : 'Local Persistence (Atlas Ready)'}
              </span>
            </div>
            <h3 className="text-lg font-black text-gray-900 mt-1">
              {mongoStatus.connected ? `MongoDB Atlas: ${mongoStatus.dbName || 'Cluster Active'}` : 'Local Document Store Engine Active'}
            </h3>
            <p className="text-xs text-gray-700 mt-0.5">{mongoStatus.message}</p>
          </div>
        </div>

        <button
          onClick={onStatusRefreshed}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 text-xs font-semibold shrink-0 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Ping Connection</span>
        </button>
      </div>

      {/* Atlas Connection Form */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
            <Send className="w-4 h-4 text-red-700" />
            <span>Connect Live MongoDB Atlas Cluster</span>
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            Paste your MongoDB Atlas connection string below. The server will establish a live Mongoose connection, 
            test cluster reachability, save the connection string to <code className="bg-gray-50 px-1 py-0.5 rounded font-mono text-red-700">server/.env</code>, and synchronize records.
          </p>
        </div>

        <form onSubmit={handleConnectAtlas} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              MongoDB Atlas Connection URI (SRV format)
            </label>
            <input
              type="text"
              required
              placeholder="mongodb+srv://<username>:<password>@cluster0.mongodb.net/jg_hub?retryWrites=true&w=majority"
              value={atlasUri}
              onChange={e => setAtlasUri(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-red-500"
            />
            <span className="text-[11px] text-gray-900 block mt-1">
              Example format: mongodb+srv://admin:pass123@mycluster.net/production?retryWrites=true
            </span>
          </div>

          {testResult && (
            <div className={`p-3 rounded-xl border text-xs ${
              mongoStatus.connected ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-950/20 border-red-500/30 text-red-700'
            }`}>
              {testResult}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isConnecting || !atlasUri.trim()}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-red-600/25"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Establishing Connection...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Connect & Synchronize Atlas</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Database Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
            <HardDrive className="w-4 h-4 text-red-700" />
          </div>
          <span className="text-2xl font-black text-gray-900">{totalUsers}</span>
          <span className="text-[10px] text-gray-600 block mt-0.5">Admin, CEO, COO & Users</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Managed Projects</span>
            <HardDrive className="w-4 h-4 text-indigo-700" />
          </div>
          <span className="text-2xl font-black text-gray-900">{totalProjects}</span>
          <span className="text-[10px] text-gray-600 block mt-0.5">Active & Archived Records</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Audit Trail Events</span>
            <HardDrive className="w-4 h-4 text-emerald-700" />
          </div>
          <span className="text-2xl font-black text-gray-900">{totalAudits}</span>
          <span className="text-[10px] text-gray-600 block mt-0.5">Immutable System Logs</span>
        </div>
      </div>
    </div>
  );
};


