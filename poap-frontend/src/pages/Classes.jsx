import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export default function Classes() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollClassId, setEnrollClassId] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const endpoint = user.role === 'lecturer' 
        ? `${API_URL}/api/lecturer/classes`
        : `${API_URL}/api/classes`;
      
      const response = await axios.get(endpoint, { 
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (classId) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      await axios.post(`${API_URL}/api/classes/${classId}/enroll`, {
        studentAddress: user.address
      }, { 
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      toast.success('Successfully enrolled in class');
      fetchClasses();
    } catch (error) {
      console.error('Error enrolling in class:', error);
      toast.error(error.response?.data?.message || 'Failed to enroll in class');
    }
  };

  const handleMarkAttendance = async (classId) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      await axios.post(`${API_URL}/api/attendance/mark`, {
        classId
      }, { 
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      toast.success('Attendance marked successfully');
      fetchClasses();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Classes</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all classes you are enrolled in or can enroll in.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((classItem) => (
          <div key={classItem._id} className="card">
            <h3 className="text-lg font-semibold text-gray-900">{classItem.name}</h3>
            <p className="mt-1 text-sm text-gray-500">{classItem.description}</p>
            
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Lecturer: {classItem.lecturer.slice(0, 6)}...{classItem.lecturer.slice(-4)}
              </span>
              
              {classItem.students.includes(user.address) ? (
                <button
                  onClick={() => handleMarkAttendance(classItem._id)}
                  className="btn btn-primary"
                >
                  Mark Attendance
                </button>
              ) : (
                <button
                  onClick={() => handleEnroll(classItem._id)}
                  className="btn btn-secondary"
                >
                  Enroll
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No classes found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by enrolling in a class.
          </p>
        </div>
      )}
    </div>
  );
} 
