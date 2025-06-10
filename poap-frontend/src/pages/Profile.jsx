import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ethers } from 'ethers';
import POAPAttendanceABI from '../contracts/POAPAttendance.json';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const { user } = useAuth();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    initializeContract();
  }, []);

  const initializeContract = async () => {
    try {
      console.log('Initializing contract...');
      
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this feature');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      console.log('Contract Address:', import.meta.env.VITE_POAP_CONTRACT_ADDRESS);
      
      if (!import.meta.env.VITE_POAP_CONTRACT_ADDRESS) {
        throw new Error('Contract address not found in environment variables');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractAddress = import.meta.env.VITE_POAP_CONTRACT_ADDRESS;
      console.log('Creating contract instance with address:', contractAddress);
      
      const contractInstance = new ethers.Contract(contractAddress, POAPAttendanceABI, signer);
      setContract(contractInstance);
      console.log('Contract initialized successfully');
      await fetchNFTs(contractInstance);
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize smart contract: ' + error.message);
      setLoading(false);
    }
  };

  const fetchNFTs = async (contractInstance) => {
    try {
      // Get the total supply of NFTs
      const totalSupply = await contractInstance.nextTokenId();
      const userNFTs = [];

      // Fetch all NFTs and filter for the user's NFTs
      for (let i = 1; i < totalSupply; i++) {
        try {
          const owner = await contractInstance.ownerOf(i);
          if (owner.toLowerCase() === user.address.toLowerCase()) {
            const [eventTitle, role, expiryTime, uri] = await contractInstance.getBadgeMetadata(i);
            const isValid = await contractInstance.isBadgeValid(i);
            
            userNFTs.push({
              id: i,
              eventTitle,
              role,
              expiryTime: expiryTime.toNumber(),
              uri,
              isValid
            });
          }
        } catch (error) {
          // Skip NFTs that don't exist or can't be accessed
          continue;
        }
      }

      setNfts(userNFTs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      toast.error('Failed to fetch NFTs');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
          <p className="mt-2 text-sm text-gray-700">
            View your attendance NFTs and profile information.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Attendance NFTs</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {nfts.map((nft) => (
            <div key={nft.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{nft.eventTitle}</h3>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    nft.isValid
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {nft.isValid ? 'Valid' : 'Expired'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-2">Role: {nft.role}</p>
              {nft.expiryTime > 0 && (
                <p className="text-sm text-gray-500">
                  Expires: {new Date(nft.expiryTime * 1000).toLocaleDateString()}
                </p>
              )}
              <div className="mt-4">
                <a
                  href={nft.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  View Metadata →
                </a>
              </div>
            </div>
          ))}
          {nfts.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No attendance NFTs found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 
