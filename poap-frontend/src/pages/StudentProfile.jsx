import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import POAPAttendanceABI from '../contracts/POAPAttendance.json';

export default function StudentProfile() {
  const { user } = useAuth();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    initializeContract();
  }, []);

  const initializeContract = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this feature');
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
      
      const contractInstance = new ethers.Contract(contractAddress, POAPAttendanceABI, signer);
      setContract(contractInstance);
      
      // Fetch NFTs after contract is initialized
      fetchNFTs(contractInstance);
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize smart contract: ' + error.message);
      setLoading(false);
    }
  };

  const fetchNFTs = async (contractInstance) => {
    try {
      if (!contractInstance) return;

      // Get the total number of tokens owned by the user
      const balance = await contractInstance.balanceOf(user.address);
      const totalTokens = balance.toString();

      // Fetch details for each token
      const nftPromises = [];
      for (let i = 0; i < totalTokens; i++) {
        nftPromises.push(
          contractInstance.tokenOfOwnerByIndex(user.address, i)
            .then(async (tokenId) => {
              const tokenURI = await contractInstance.tokenURI(tokenId);
              const badge = await contractInstance.badges(tokenId);
              return {
                tokenId: tokenId.toString(),
                tokenURI,
                eventTitle: badge.eventTitle,
                role: badge.role,
                expiryTime: badge.expiryTime.toString()
              };
            })
        );
      }

      const nftData = await Promise.all(nftPromises);
      setNfts(nftData);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      toast.error('Failed to fetch NFTs');
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-semibold text-gray-900">My Attendance NFTs</h1>
          <p className="mt-2 text-sm text-gray-700">
            View your attendance NFTs from validated classes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {nfts.map((nft) => (
          <div
            key={nft.tokenId}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">
                {nft.eventTitle}
              </h3>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Role:</span> {nft.role}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Token ID:</span> {nft.tokenId}
                </p>
                {nft.expiryTime !== '0' && (
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Expires:</span>{' '}
                    {new Date(parseInt(nft.expiryTime) * 1000).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="mt-4">
                <a
                  href={`https://etherscan.io/token/${import.meta.env.VITE_CONTRACT_ADDRESS}?a=${nft.tokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                >
                  View on Etherscan →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {nfts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No attendance NFTs found.</p>
        </div>
      )}
    </div>
  );
} 