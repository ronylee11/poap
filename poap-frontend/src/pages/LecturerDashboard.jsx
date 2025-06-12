import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import POAPAttendanceABI from '../contracts/POAPAttendance.json';

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
  const [contract, setContract] = useState(null);
  const [mintingStatus, setMintingStatus] = useState({});
  const [isAddingLecturer, setIsAddingLecturer] = useState(false);

  useEffect(() => {
    fetchClasses();
    initializeContract();
  }, []);

  const initializeContract = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this feature');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Connected account:', accounts[0]);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
      
      console.log('Initializing contract with address:', contractAddress);
      
      if (!contractAddress) {
        throw new Error('Contract address not found in environment variables');
      }

      // Verify contract address format
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Invalid contract address format');
      }

      // Create contract instance with the ABI from the JSON file
      const contractInstance = new ethers.Contract(
        contractAddress,
        POAPAttendanceABI.abi, // Access the abi property from the imported JSON
        signer
      );
      
      // Verify contract connection
      try {
        const code = await provider.getCode(contractAddress);
        if (code === '0x') {
          throw new Error('No contract found at the specified address');
        }
        console.log('Contract code found at address');

        // Verify contract methods
        if (!contractInstance.mintBadge) {
          throw new Error('mintBadge method not found in contract ABI');
        }

        // Get network info
        const network = await provider.getNetwork();
        console.log('Connected to network:', network);

        // Get signer balance
        const balance = await provider.getBalance(accounts[0]);
        console.log('Signer balance:', ethers.formatEther(balance), 'ETH');

      } catch (error) {
        console.error('Error verifying contract:', error);
        throw new Error(`Failed to verify contract: ${error.message}`);
      }

      setContract(contractInstance);
      console.log('Contract initialized successfully');
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize smart contract: ' + error.message);
    }
  };

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

  const handleValidateAttendance = async (classId, studentAddress) => {
    try {
      if (!contract) {
        toast.error('Smart contract not initialized');
        return;
      }

      // Validate student address
      if (!ethers.isAddress(studentAddress)) {
        throw new Error('Invalid student address');
      }

      setMintingStatus(prev => ({ ...prev, [studentAddress]: 'minting' }));

      // Get class details
      const classDetails = classes.find(c => c._id === classId);
      if (!classDetails) {
        throw new Error('Class not found');
      }

      // Generate metadata for the NFT
      const timestamp = new Date().toISOString();
      const metadata = {
        name: `${classDetails.name} Attendance Badge`,
        description: `Attendance badge for ${classDetails.name}`,
        image: "ipfs://QmYourDefaultImageHash", // Replace with your default image
        attributes: [
          {
            trait_type: "Event",
            value: classDetails.name
          },
          {
            trait_type: "Role",
            value: "Student"
          },
          {
            trait_type: "Date",
            value: timestamp
          }
        ]
      };

      // Convert metadata to IPFS URI
      const tokenURI = `ipfs://${btoa(JSON.stringify(metadata))}`;
      const eventTitle = classDetails.name;
      const role = "Student";
      const expiryTime = 0; // No expiry

      // Get the current signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      console.log('Signer address:', signerAddress);

      // Create a new contract instance with the current signer
      const contractWithSigner = new ethers.Contract(
        import.meta.env.VITE_CONTRACT_ADDRESS,
        POAPAttendanceABI.abi,
        signer
      );

      // Mint the badge
      console.log('Minting badge...');
      const tx = await contractWithSigner.mintBadge(
        studentAddress,
        tokenURI,
        eventTitle,
        role,
        expiryTime
      );
      
      setMintingStatus(prev => ({ ...prev, [studentAddress]: 'confirming' }));
      console.log('Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);
      
      // Get the token ID from the event
      const event = receipt.logs.find(log => {
        try {
          return contractWithSigner.interface.parseLog(log).name === 'BadgeMinted';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsedLog = contractWithSigner.interface.parseLog(event);
        const tokenId = parsedLog.args.tokenId;
        console.log('Minted token ID:', tokenId.toString());
      }
      
      setMintingStatus(prev => ({ ...prev, [studentAddress]: 'completed' }));
      
      // Show success messages
      toast.success('Attendance validated and NFT minted successfully');
      if (receipt && receipt.hash) {
        toast('Transaction Hash: ' + receipt.hash);
      }
    } catch (error) {
      console.error('Error validating attendance:', error);
      setMintingStatus(prev => ({ ...prev, [studentAddress]: 'error' }));
      toast.error(error.message || 'Failed to validate attendance');
    }
  };

  const addLecturer = async (lecturerAddress) => {
    try {
      if (!contract) {
        toast.error('Smart contract not initialized');
        return;
      }

      setIsAddingLecturer(true);

      // Get the current signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      console.log('Signer address:', signerAddress);

      // Create a new contract instance with the current signer
      const contractWithSigner = new ethers.Contract(
        import.meta.env.VITE_CONTRACT_ADDRESS,
        POAPAttendanceABI.abi,
        signer
      );

      // Verify contract owner
      const owner = await contractWithSigner.owner();
      console.log('Contract owner:', owner);
      
      if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
        throw new Error('Only the contract owner can add lecturers');
      }

      // Add lecturer
      console.log('Adding lecturer:', lecturerAddress);
      const tx = await contractWithSigner.addLecturer(lecturerAddress);
      console.log('Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);
      
      toast.success('Lecturer added successfully');
      toast.info(`Transaction Hash: ${receipt.hash}`);
    } catch (error) {
      console.error('Error adding lecturer:', error);
      toast.error(error.message || 'Failed to add lecturer');
    } finally {
      setIsAddingLecturer(false);
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
                              onClick={() => handleValidateAttendance(classItem._id, studentAddress)}
                              disabled={mintingStatus[studentAddress] === 'minting' || mintingStatus[studentAddress] === 'confirming'}
                              className={`text-green-600 hover:text-green-900 ${
                                (mintingStatus[studentAddress] === 'minting' || mintingStatus[studentAddress] === 'confirming') 
                                ? 'opacity-50 cursor-not-allowed' 
                                : ''
                              }`}
                            >
                              {mintingStatus[studentAddress] === 'minting' ? 'Minting...' :
                               mintingStatus[studentAddress] === 'confirming' ? 'Confirming...' :
                               mintingStatus[studentAddress] === 'completed' ? '✓ Validated' :
                               'Validate & Mint NFT'}
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
