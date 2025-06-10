import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="container flex flex-col items-center justify-center px-4 py-8 mx-auto">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to POAP Attendance System
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          A blockchain-based attendance tracking system using POAP NFTs
        </p>

        {!user ? (
          <div className="space-x-4">
            <Link
              to="/login"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-md border border-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Register
            </Link>
          </div>
        ) : (
          <Link
            to="/dashboard"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Go to Dashboard
          </Link>
        )}
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">For Students</h2>
          <p className="text-gray-600">
            Track your attendance, view your classes, and collect POAP NFTs as proof of participation.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">For Lecturers</h2>
          <p className="text-gray-600">
            Manage your classes, validate attendance, and issue POAP NFTs to your students.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">For Administrators</h2>
          <p className="text-gray-600">
            Oversee the system, manage user accounts, and ensure smooth operation of the platform.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home; 
