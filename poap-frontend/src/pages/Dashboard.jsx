import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [recentBadges, setRecentBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, profileResponse] = await Promise.all([
          axios.get('/api/student/attendance/stats', { withCredentials: true }),
          axios.get('/api/student/profile', { withCredentials: true })
        ]);

        setStats(statsResponse.data);
        setRecentAttendance(profileResponse.data.attendance.slice(0, 5));
        
        // Sort badges by mintedAt timestamp (newest first) and take the 5 most recent
        const sortedBadges = [...profileResponse.data.badges].sort((a, b) => 
          Number(b.mintedAt) - Number(a.mintedAt)
        );
        setRecentBadges(sortedBadges.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Welcome back, {user?.name || 'User'}
        </h2>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats && Object.entries(stats).map(([classId, data]) => (
          <div key={classId} className="card">
            <h3 className="text-lg font-semibold text-gray-900">{data.classTitle}</h3>
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Classes</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">{data.total}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Attended</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">{data.attended}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Validated</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">{data.validated}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Attendance Rate</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {data.total ? Math.round((data.attended / data.total) * 100) : 0}%
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      {/* Recent Badges */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Attendance Badges</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentBadges.map((badge) => (
            <div key={badge.tokenId} className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">{badge.title}</h4>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    badge.isValid
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {badge.isValid ? 'Valid' : 'Expired'}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">Role: {badge.role}</p>
              <p className="text-sm text-gray-500">
                Expires: {new Date(Number(badge.expiry) * 1000).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                Minted: {new Date(Number(badge.mintedAt) * 1000).toLocaleDateString()}
              </p>
            </div>
          ))}
          {recentBadges.length === 0 && (
            <p className="text-gray-500 col-span-full text-center py-4">
              No badges earned yet. Attend classes to earn badges!
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 
