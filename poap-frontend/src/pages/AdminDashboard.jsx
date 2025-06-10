import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import POAPAttendanceABI from '../contracts/POAPAttendance.json';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAccount, setNewAccount] = useState({
    address: '',
    name: '',
    role: 'student',
    studentId: ''
  });
  const [contract, setContract] = useState(null);
  const [isAddingLecturer, setIsAddingLecturer] = useState(false);
  const [newLecturerAddress, setNewLecturerAddress] = useState('');
  const [lecturers, setLecturers] = useState([]);

  useEffect(() => {
    fetchAccounts();
    initializeContract();
    fetchLecturers();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('/api/admin/accounts', { withCredentials: true });
      setAccounts(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching accounts');
      setLoading(false);
    }
  };

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

      // Create contract instance with signer
      const contractInstance = new ethers.Contract(
        contractAddress,
        [
          "function addLecturer(address lecturer) public",
          "function removeLecturer(address lecturer) public",
          "function owner() public view returns (address)",
          "function lecturers(address) public view returns (bool)"
        ],
        signer
      );
      
      // Verify contract connection
      try {
        const code = await provider.getCode(contractAddress);
        if (code === '0x') {
          throw new Error('No contract found at the specified address');
        }
        console.log('Contract code found at address');

        // Verify contract owner
        const owner = await contractInstance.owner();
        console.log('Contract owner:', owner);
        if (owner.toLowerCase() !== accounts[0].toLowerCase()) {
          throw new Error('Connected account is not the contract owner');
        }

      } catch (error) {
        console.error('Error verifying contract:', error);
        throw new Error(`Failed to verify contract: ${error.message}`);
      }

      setContract(contractInstance);
      console.log('Contract initialized successfully');
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize smart contract: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLecturers = async () => {
    try {
      if (!contract) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = new ethers.Contract(
        import.meta.env.VITE_CONTRACT_ADDRESS,
        [
          "function addLecturer(address lecturer) public",
          "function removeLecturer(address lecturer) public",
          "function owner() public view returns (address)",
          "function lecturers(address) public view returns (bool)"
        ],
        signer
      );

      // Get all accounts from your backend
      const response = await axios.get('/api/admin/accounts', { withCredentials: true });
      const accounts = response.data;

      // Filter accounts that are lecturers in the smart contract
      const lecturerAddresses = [];
      for (const account of accounts) {
        if (account.role === 'lecturer') {
          const isLecturer = await contractWithSigner.lecturers(account.address);
          if (isLecturer) {
            lecturerAddresses.push(account.address);
          }
        }
      }

      setLecturers(lecturerAddresses);
    } catch (error) {
      console.error('Error fetching lecturers:', error);
      toast.error('Failed to fetch lecturers');
    }
  };

  const addLecturer = async (lecturerAddress) => {
    try {
      if (!contract) {
        toast.error('Smart contract not initialized');
        return;
      }

      if (!ethers.isAddress(lecturerAddress)) {
        throw new Error('Invalid Ethereum address');
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
        [
          "function addLecturer(address lecturer) public",
          "function removeLecturer(address lecturer) public",
          "function owner() public view returns (address)",
          "function lecturers(address) public view returns (bool)"
        ],
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
      toast('Transaction Hash: ' + receipt.hash);
      
      // Clear the input
      setNewLecturerAddress('');
      
      // Refresh the lecturers list
      await fetchLecturers();
    } catch (error) {
      console.error('Error adding lecturer:', error);
      toast.error(error.message || 'Failed to add lecturer');
    } finally {
      setIsAddingLecturer(false);
    }
  };

  const removeLecturer = async (lecturerAddress) => {
    try {
      if (!contract) {
        toast.error('Smart contract not initialized');
        return;
      }

      if (!window.confirm('Are you sure you want to remove this lecturer?')) {
        return;
      }

      // Get the current signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();

      // Create a new contract instance with the current signer
      const contractWithSigner = new ethers.Contract(
        import.meta.env.VITE_CONTRACT_ADDRESS,
        [
          "function addLecturer(address lecturer) public",
          "function removeLecturer(address lecturer) public",
          "function owner() public view returns (address)",
          "function lecturers(address) public view returns (bool)"
        ],
        signer
      );

      // Remove lecturer
      console.log('Removing lecturer:', lecturerAddress);
      const tx = await contractWithSigner.removeLecturer(lecturerAddress);
      console.log('Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);
      
      toast.success('Lecturer removed successfully');
      toast('Transaction Hash: ' + receipt.hash);
      
      // Refresh the lecturers list
      await fetchLecturers();
    } catch (error) {
      console.error('Error removing lecturer:', error);
      toast.error(error.message || 'Failed to remove lecturer');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAccount(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/accounts', newAccount, { withCredentials: true });
      toast.success('Account created successfully');
      setNewAccount({
        address: '',
        name: '',
        role: 'student',
        studentId: ''
      });
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating account');
    }
  };

  const handleUpdateRole = async (address, newRole) => {
    try {
      await axios.put(`/api/admin/accounts/${address}/role`, { role: newRole }, { withCredentials: true });
      toast.success('Role updated successfully');
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating role');
    }
  };

  const handleDeleteAccount = async (address) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    
    try {
      await axios.delete(`/api/admin/accounts/${address}`, { withCredentials: true });
      toast.success('Account deleted successfully');
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting account');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Create Account Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Account</h2>
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Ethereum Address</label>
            <input
              type="text"
              name="address"
              value={newAccount.address}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={newAccount.name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              name="role"
              value={newAccount.role}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {newAccount.role === 'student' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Student ID</label>
              <input
                type="text"
                name="studentId"
                value={newAccount.studentId}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
          )}
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Create Account
          </button>
        </form>
      </div>

      {/* Add Lecturer Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Manage Lecturers</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newLecturerAddress}
            onChange={(e) => setNewLecturerAddress(e.target.value)}
            placeholder="Lecturer's Ethereum Address"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <button
            onClick={() => addLecturer(newLecturerAddress)}
            disabled={isAddingLecturer}
            className={`bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 ${
              isAddingLecturer ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isAddingLecturer ? 'Adding...' : 'Add Lecturer'}
          </button>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Accounts</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.map((account) => (
                <tr key={account.address}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <select
                      value={account.role}
                      onChange={(e) => handleUpdateRole(account.address, e.target.value)}
                      className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="student">Student</option>
                      <option value="lecturer">Lecturer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.studentId || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleDeleteAccount(account.address)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lecturers List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Current Lecturers</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lecturers.map((lecturer) => (
                <tr key={lecturer}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lecturer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => removeLecturer(lecturer)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 
