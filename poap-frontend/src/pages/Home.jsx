import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="relative isolate overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
          <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            POAP Attendance System
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            A decentralized attendance tracking system that rewards students with NFT badges for their class participation.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            {user ? (
              <Link
                to="/dashboard"
                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="card">
                <h3 className="text-lg font-semibold leading-8 text-gray-900">Attendance Tracking</h3>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  Mark your attendance for classes and get validated by lecturers.
                </p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold leading-8 text-gray-900">NFT Badges</h3>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  Receive unique NFT badges as proof of your class participation.
                </p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold leading-8 text-gray-900">Decentralized</h3>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  Built on blockchain technology for transparent and immutable records.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 