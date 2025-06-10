import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import POAPAttendanceABI from '../contracts/POAPAttendance.json';

export default function Attendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [contract, setContract] = useState(null);
  const [mintingStatus, setMintingStatus] = useState({});

  useEffect(() => {
    if (selectedClass) {
      fetchAttendance();
    }
    initializeContract();
  }, [selectedClass]);

  const initializeContract = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this feature');
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
      
      console.log('Initializing contract with address:', contractAddress);
      console.log('Contract ABI:', POAPAttendanceABI);
      
      if (!contractAddress) {
        throw new Error('Contract address not found in environment variables');
      }

      const contractInstance = new ethers.Contract(contractAddress, POAPAttendanceABI, signer);
      
      // Verify contract connection
      try {
        const code = await provider.getCode(contractAddress);
        if (code === '0x') {
          throw new Error('No contract found at the specified address');
        }
        console.log('Contract code found at address');
      } catch (error) {
        console.error('Error verifying contract:', error);
        throw new Error('Failed to verify contract at the specified address');
      }

      setContract(contractInstance);
      console.log('Contract initialized successfully');
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize smart contract: ' + error.message);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await axios.get(`/api/attendance/class/${selectedClass}`, {
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
      // First validate attendance in the backend
      await axios.post('/api/attendance/validate', {
        classId: selectedClass,
        studentAddress
      }, { withCredentials: true });

      // Then mint the NFT
      if (contract) {
        setMintingStatus(prev => ({ ...prev, [studentAddress]: 'minting' }));

        const selectedClassData = user.classes.find(c => c._id === selectedClass);
        const timestamp = new Date().toISOString();
        const tokenURI = `ipfs://${selectedClassData.title}-${timestamp}`;
        const eventTitle = selectedClassData.title;
        const role = "Student";
        const expiryTime = 0; // No expiry

        console.log('Minting parameters:', {
          studentAddress,
          tokenURI,
          eventTitle,
          role,
          expiryTime
        });

        try {
          // First try to estimate gas
          const gasEstimate = await contract.mintBadge.estimateGas(
            studentAddress,
            tokenURI,
            eventTitle,
            role,
            expiryTime
          );

          console.log('Gas estimate:', gasEstimate.toString());

          // Add 20% buffer to gas estimate
          const gasLimit = Math.floor(gasEstimate * 1.2);

          // Now execute the transaction with the gas limit
          const tx = await contract.mintBadge(
            studentAddress,
            tokenURI,
            eventTitle,
            role,
            expiryTime,
            {
              gasLimit: gasLimit
            }
          );
          
          setMintingStatus(prev => ({ ...prev, [studentAddress]: 'confirming' }));
          console.log('Transaction sent:', tx.hash);
          
          const receipt = await tx.wait();
          console.log('Transaction confirmed:', receipt.hash);
          
          setMintingStatus(prev => ({ ...prev, [studentAddress]: 'completed' }));
          toast.success('Attendance validated and NFT minted successfully');
          toast.info(`Transaction Hash: ${receipt.hash}`);
        } catch (contractError) {
          console.error('Contract interaction error:', {
            error: contractError,
            message: contractError.message,
            code: contractError.code,
            data: contractError.data
          });
          throw new Error(`Contract interaction failed: ${contractError.message}`);
        }
      } else {
        toast.error('Smart contract not initialized');
      }
      
      fetchAttendance();
    } catch (error) {
      console.error('Error validating attendance:', error);
      setMintingStatus(prev => ({ ...prev, [studentAddress]: 'error' }));
      if (error.response?.data?.validatedAt) {
        const validatedTime = new Date(error.response.data.validatedAt).toLocaleString();
        toast.error(`Attendance already validated today at ${validatedTime}`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to validate attendance');
      }
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
                          Validated At
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
                            {record.validatedAt
                              ? new Date(record.validatedAt).toLocaleString()
                              : 'Not validated'}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                            {!record.validated && (
                              <button
                                onClick={() => handleValidate(record.student)}
                                disabled={mintingStatus[record.student] === 'minting' || mintingStatus[record.student] === 'confirming'}
                                className={`text-primary-600 hover:text-primary-900 ${
                                  (mintingStatus[record.student] === 'minting' || mintingStatus[record.student] === 'confirming') 
                                  ? 'opacity-50 cursor-not-allowed' 
                                  : ''
                                }`}
                              >
                                {mintingStatus[record.student] === 'minting' ? 'Minting...' :
                                 mintingStatus[record.student] === 'confirming' ? 'Confirming...' :
                                 mintingStatus[record.student] === 'completed' ? '✓ Validated' :
                                 'Validate & Mint NFT'}
                              </button>
                            )}
                            {record.validated && (
                              <span className="text-green-600">✓ Validated</span>
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