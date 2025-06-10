import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const LecturerDashboard = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newClass, setNewClass] = useState({
    name: '',
    description: '',
    schedule: ''
  });
  const [selectedClass, setSelectedClass] = useState(null);
  const [newStudent, setNewStudent] = useState({
    address: ''
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await axios.get('/api/lecturer/classes', { withCredentials: true });
      setClasses(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching classes');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClass(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/lecturer/classes', newClass, { withCredentials: true });
      toast.success('Class created successfully');
      setNewClass({
        name: '',
        description: '',
        schedule: ''
      });
      fetchClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating class');
    }
  };

  const handleUpdateClass = async (classId, updates) => {
    try {
      await axios.put(`/api/lecturer/classes/${classId}`, updates, { withCredentials: true });
      toast.success('Class updated successfully');
      fetchClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating class');
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    
    try {
      await axios.delete(`/api/lecturer/classes/${classId}`, { withCredentials: true });
      toast.success('Class deleted successfully');
      fetchClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting class');
    }
  };

  const handleEnrollStudent = async (classId, address) => {
    try {
      await axios.post(`/api/lecturer/classes/${classId}/enroll`, { studentAddress: address }, { withCredentials: true });
      toast.success('Student enrolled successfully');
      fetchClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error enrolling student');
    }
  };

  const handleRemoveStudent = async (classId, address) => {
    if (!window.confirm('Are you sure you want to remove this student?')) return;
    
    try {
      await axios.delete(`/api/lecturer/classes/${classId}/students/${address}`, { withCredentials: true });
      toast.success('Student removed successfully');
      fetchClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error removing student');
    }
  };

  const handleValidateAttendance = async (classId, studentAddress, date) => {
    try {
      await axios.post(`/api/lecturer/classes/${classId}/attendance/validate`, {
        studentAddress,
        date
      }, { withCredentials: true });
      toast.success('Attendance validated successfully');
      fetchClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error validating attendance');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Lecturer Dashboard</h1>
      
      {/* Create Class Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Class</h2>
        <form onSubmit={handleCreateClass} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Class Name</label>
            <input
              type="text"
              name="name"
              value={newClass.name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={newClass.description}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows="3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Schedule</label>
            <input
              type="text"
              name="schedule"
              value={newClass.schedule}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Create Class
          </button>
        </form>
      </div>

      {/* Classes List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Classes</h2>
        <div className="space-y-6">
          {classes.map((classItem) => (
            <div key={classItem._id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium">{classItem.name}</h3>
                  <p className="text-gray-500">{classItem.description}</p>
                  <p className="text-sm text-gray-500">Schedule: {classItem.schedule}</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleDeleteClass(classItem._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Enroll Student Form */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Enroll Student</h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newStudent.address}
                    onChange={(e) => setNewStudent({ address: e.target.value })}
                    placeholder="Student's Ethereum Address"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleEnrollStudent(classItem._id, newStudent.address)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Enroll
                  </button>
                </div>
              </div>

              {/* Students List */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Enrolled Students</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {classItem.students.map((studentAddress) => (
                        <tr key={studentAddress}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{studentAddress}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => handleRemoveStudent(classItem._id, studentAddress)}
                              className="text-red-600 hover:text-red-900 mr-4"
                            >
                              Remove
                            </button>
                            <button
                              onClick={() => handleValidateAttendance(classItem._id, studentAddress, new Date().toISOString())}
                              className="text-green-600 hover:text-green-900"
                            >
                              Validate Attendance
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard; 
