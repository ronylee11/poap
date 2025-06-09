import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import App from '../App';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock ethers
jest.mock('ethers', () => ({
  BrowserProvider: jest.fn(() => ({
    getSigner: jest.fn(() => ({
      getAddress: jest.fn(() => '0x123...'),
      signMessage: jest.fn(() => '0x456...')
    }))
  }))
}));

// Mock window.ethereum
window.ethereum = {
  request: jest.fn()
};

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('App Integration Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should show login page when not authenticated', () => {
      renderWithRouter(<App />);
      expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument();
    });

    it('should handle successful login', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          token: 'test-token',
          user: {
            address: '0x123...',
            name: 'Test User'
          }
        }
      });

      renderWithRouter(<App />);
      
      const loginButton = screen.getByText(/Connect with MetaMask/i);
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          '/api/auth/login',
          expect.any(Object),
          expect.any(Object)
        );
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to dashboard after login', async () => {
      // Mock authenticated state
      axios.get.mockResolvedValueOnce({
        data: {
          address: '0x123...',
          name: 'Test User'
        }
      });

      renderWithRouter(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
      });
    });

    it('should show 404 page for invalid routes', () => {
      renderWithRouter(<App />);
      window.history.pushState({}, '', '/invalid-route');
      
      expect(screen.getByText(/Page not found/i)).toBeInTheDocument();
    });
  });

  describe('Class Management', () => {
    beforeEach(() => {
      // Mock authenticated state
      axios.get.mockResolvedValueOnce({
        data: {
          address: '0x123...',
          name: 'Test User'
        }
      });

      // Mock classes data
      axios.get.mockResolvedValueOnce({
        data: [
          {
            _id: '1',
            title: 'Test Class',
            description: 'Test Description',
            lecturer: '0x789...',
            students: []
          }
        ]
      });
    });

    it('should display classes list', async () => {
      renderWithRouter(<App />);
      
      // Navigate to classes page
      window.history.pushState({}, '', '/classes');
      
      await waitFor(() => {
        expect(screen.getByText(/Test Class/i)).toBeInTheDocument();
      });
    });

    it('should handle class enrollment', async () => {
      axios.post.mockResolvedValueOnce({
        data: { message: 'Successfully enrolled' }
      });

      renderWithRouter(<App />);
      
      // Navigate to classes page
      window.history.pushState({}, '', '/classes');
      
      await waitFor(() => {
        const enrollButton = screen.getByText(/Enroll/i);
        fireEvent.click(enrollButton);
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/classes/'),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('Attendance Management', () => {
    beforeEach(() => {
      // Mock authenticated state
      axios.get.mockResolvedValueOnce({
        data: {
          address: '0x123...',
          name: 'Test User'
        }
      });

      // Mock attendance data
      axios.get.mockResolvedValueOnce({
        data: [
          {
            _id: '1',
            student: '0x123...',
            markedAt: new Date().toISOString(),
            validated: false
          }
        ]
      });
    });

    it('should display attendance records', async () => {
      renderWithRouter(<App />);
      
      // Navigate to attendance page
      window.history.pushState({}, '', '/attendance');
      
      await waitFor(() => {
        expect(screen.getByText(/Attendance Records/i)).toBeInTheDocument();
      });
    });

    it('should handle attendance validation', async () => {
      axios.post.mockResolvedValueOnce({
        data: { validated: true }
      });

      renderWithRouter(<App />);
      
      // Navigate to attendance page
      window.history.pushState({}, '', '/attendance');
      
      await waitFor(() => {
        const validateButton = screen.getByText(/Validate/i);
        fireEvent.click(validateButton);
      });

      expect(axios.post).toHaveBeenCalledWith(
        '/api/attendance/validate',
        expect.any(Object),
        expect.any(Object)
      );
    });
  });
}); 