import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export default function Attendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);

  useEffect(() => {
    if (selectedClass) {
      fetchAttendance();
    }
  }, [selectedClass]);

  const fetchAttendance = async () => {
    try {
      const response = await axios.get(`/api/attendance/${selectedClass}`, {
        withCredentials: true
      });
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (studentAddress) => {
    try {
      await axios.post('/api/attendance/validate', {
        classId: selectedClass,
        studentAddress
      }, { withCredentials: true });
      
      toast.success('Attendance validated successfully');
      fetchAttendance();
    } catch (error) {
      console.error('Error validating attendance:', error);
      toast.error(error.response?.data?.message || 'Failed to validate attendance');
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
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Attendance Records</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage attendance records for your classes.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="mb-4">
          <label htmlFor="class" className="block text-sm font-medium text-gray-700">
            Select Class
          </label>
          <select
            id="class"
            name="class"
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">Select a class</option>
            {user?.classes?.map((classItem) => (
              <option key={classItem._id} value={classItem._id}>
                {classItem.title}
              </option>
            ))}
          </select>
        </div>

        {selectedClass && (
          <div className="mt-4">
            <div className="flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                        >
                          Student
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Marked At
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="relative py-3.5 pl-3 pr-4 sm:pr-0"
                        >
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {attendance.map((record) => (
                        <tr key={record._id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                            {record.student.slice(0, 6)}...{record.student.slice(-4)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {record.markedAt
                              ? new Date(record.markedAt).toLocaleString()
                              : 'Not marked'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                record.validated
                                  ? 'bg-green-100 text-green-800'
                                  : record.markedAt
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {record.validated
                                ? 'Validated'
                                : record.markedAt
                                ? 'Pending'
                                : 'Not Marked'}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                            {record.markedAt && !record.validated && (
                              <button
                                onClick={() => handleValidate(record.student)}
                                className="text-primary-600 hover:text-primary-900"
                              >
                                Validate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 