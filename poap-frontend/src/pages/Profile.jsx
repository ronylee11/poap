import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

function Profile() {
  const { user } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBadges();
    }
  }, [user]);

  const fetchBadges = async () => {
    try {
      const response = await axios.get(`/api/student/badges`);
      setBadges(response.data);
    } catch (error) {
      console.error('Failed to fetch badges:', error);
      toast.error('Failed to load badges');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profile</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Ethereum Address</label>
              <p className="mt-1 text-gray-900">{user.address}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <p className="mt-1 text-gray-900 capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Attendance Badges</h2>
          {loading ? (
            <p className="text-gray-600">Loading badges...</p>
          ) : badges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge) => (
                <div key={badge._id} className="border rounded-lg p-4">
                  <h3 className="font-medium">{badge.class.title}</h3>
                  <p className="text-sm text-gray-600">
                    Date: {new Date(badge.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: {badge.status}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No badges yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile; 
