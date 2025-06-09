import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/me', { withCredentials: true });
      setUser(response.data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = async (address) => {
    try {
      const response = await axios.get(`/api/auth/check-registration/${address}`);
      return response.data.isRegistered;
    } catch (error) {
      console.error('Check registration failed:', error);
      return false;
    }
  };

  const login = async (address, signature) => {
    try {
      // Check if user is registered
      const isRegistered = await checkRegistration(address);
      if (!isRegistered) {
        toast.error('Please register first');
        navigate('/register');
        return false;
      }

      const message = 'Sign this message to authenticate with POAP Attendance System';
      const response = await axios.post('/api/auth/login', {
        address,
        signature,
        message
      }, { withCredentials: true });
      
      await checkAuth(); // Fetch user data after successful login
      toast.success('Login successful!');
      navigate('/dashboard');
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      toast.error(error.response?.data?.message || `Login failed: ${error}`);
      return false;
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    }
  };

  const signMessage = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const message = 'Sign this message to authenticate with POAP Attendance System';
      const signature = await signer.signMessage(message);

      return { address, signature, message };
    } catch (error) {
      console.error('Signing failed:', error);
      toast.error(error.message || 'Failed to sign message');
      return null;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    signMessage,
    checkRegistration
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 
