// @ts-nocheck
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { ADMIN_ROUTES } from "@/utils/constants";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { FiUsers, FiMessageSquare, FiHash, FiActivity } from "react-icons/fi";

const AnalyticsDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await apiClient.get(`${ADMIN_ROUTES}/analytics`, {
          withCredentials: true,
        });
        setData(res.data);
      } catch (error) {
        toast.error("Unauthorized or failed to load analytics.");
        navigate("/chat");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [navigate]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#181920] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8417ff]"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen w-full bg-[#181920] text-white p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
            <p className="text-neutral-400 mt-1">Super Admin Dashboard</p>
          </div>
          <button 
            onClick={() => navigate("/chat")}
            className="px-4 py-2 bg-[#2a2a3c] hover:bg-[#3a3a4c] rounded-md transition-colors"
          >
            Back to App
          </button>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Daily Active Users" 
            value={data.dau} 
            icon={<FiActivity className="text-green-400" size={24} />} 
            sub={`WAU: ${data.wau} | MAU: ${data.mau}`}
          />
          <StatCard 
            title="Total Messages" 
            value={data.totalMessages} 
            icon={<FiMessageSquare className="text-[#8417ff]" size={24} />} 
          />
          <StatCard 
            title="Total Channels" 
            value={data.totalChannels} 
            icon={<FiHash className="text-blue-400" size={24} />} 
            sub={`${data.activeChannels} active in last 7 days`}
          />
          <StatCard 
            title="Total Users (MAU)" 
            value={data.mau} 
            icon={<FiUsers className="text-orange-400" size={24} />} 
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
          {/* User Growth */}
          <div className="bg-[#1e1e2e] p-6 rounded-xl border border-[#2a2a3c] flex flex-col">
            <h2 className="text-xl font-semibold mb-6">User Growth (Last 30 Days)</h2>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3c" />
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#181920', border: '1px solid #2a2a3c', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="users" stroke="#8417ff" strokeWidth={3} dot={{ fill: '#8417ff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Peak Hours */}
          <div className="bg-[#1e1e2e] p-6 rounded-xl border border-[#2a2a3c] flex flex-col">
            <h2 className="text-xl font-semibold mb-6">Peak Message Hours (UTC)</h2>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.peakHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3c" vertical={false} />
                  <XAxis dataKey="hour" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#181920', border: '1px solid #2a2a3c', borderRadius: '8px' }}
                    cursor={{ fill: '#2a2a3c' }}
                  />
                  <Bar dataKey="messages" fill="#8417ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, sub }: { title: string, value: number, icon: any, sub?: string }) => (
  <div className="bg-[#1e1e2e] p-6 rounded-xl border border-[#2a2a3c] flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-neutral-400">{title}</p>
        <h3 className="text-3xl font-bold mt-2">{value.toLocaleString()}</h3>
      </div>
      <div className="p-3 bg-[#2a2a3c] rounded-lg">
        {icon}
      </div>
    </div>
    {sub && (
      <div className="mt-4 text-xs text-neutral-500 font-medium">
        {sub}
      </div>
    )}
  </div>
);

export default AnalyticsDashboard;
