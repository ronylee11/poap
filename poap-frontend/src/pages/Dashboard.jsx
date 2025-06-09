import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, attendanceResponse] = await Promise.all([
          axios.get('/api/student/attendance/stats', { withCredentials: true }),
          axios.get('/api/student/profile', { withCredentials: true })
        ]);

        setStats(statsResponse.data);
        setRecentAttendance(attendanceResponse.data.attendance.slice(0, 5));
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
    <div className="space-y-6">
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

      {/* Recent Attendance */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Attendance</h3>
        <div className="flow-root">
          <ul role="list" className="-my-5 divide-y divide-gray-200">
            {recentAttendance.map((record) => (
              <li key={record._id} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {record.classId.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(record.markedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        record.validated
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {record.validated ? 'Validated' : 'Pending'}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 