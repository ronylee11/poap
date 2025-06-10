# POAP Attendance System

A decentralized attendance tracking system using POAP NFTs for educational institutions.

## Backend

### Framework
- Express.js for the REST API
- Node.js runtime

### Key Routes
- `/api/auth`
  - `POST /register` - Register new student with wallet
  - `POST /login` - Authenticate with Ethereum wallet
  - `POST /logout` - Clear authentication
  - `GET /me` - Get current user info
  - `GET /check-registration/:address` - Check if wallet is registered

- `/api/admin`
  - `POST /accounts` - Create new account (Admin only)
  - `PUT /accounts/:address/role` - Assign role to account (Admin only)
  - `GET /accounts` - List all accounts (Admin only)
  - `DELETE /accounts/:address` - Delete account (Admin only)

- `/api/lecturer`
  - `POST /classes` - Create new class (Lecturer only)
  - `PUT /classes/:classId` - Update class details (Lecturer only)
  - `DELETE /classes/:classId` - Delete class (Lecturer only)
  - `POST /classes/:classId/enroll` - Enroll student in class (Lecturer only)
  - `DELETE /classes/:classId/students/:address` - Remove student from class (Lecturer only)
  - `PUT /classes/:classId/students/:address` - Update student details (Lecturer only)
  - `POST /classes/:classId/attendance/validate` - Validate attendance and mint NFT (Lecturer only)

- `/api/student`
  - `GET /profile` - Get student profile
  - `PUT /profile` - Update student profile
  - `GET /attendance` - Get attendance history
  - `GET /badges` - Get earned badges

- `/api/classes`
  - `GET /` - List all classes
  - `GET /:classId` - Get class details
  - `POST /:classId/attend` - Mark attendance

### Database
- MongoDB for storing:
  - User profiles (with roles: Admin, Lecturer, Student)
  - Class information
  - Attendance records
  - NFT metadata

## Frontend

### Framework
- React.js with Vite
- Tailwind CSS for styling
- React Router for navigation
- React Toastify for notifications

### Features
- MetaMask Integration
  - Wallet connection
  - Message signing for authentication
  - Registration and login flow
- Role-based Access Control
  - Admin Dashboard
    - Account management
    - Role assignment
    - System overview
  - Lecturer Dashboard
    - Class management
    - Student enrollment
    - Attendance validation
    - NFT minting
  - Student Dashboard
    - Class attendance
    - Badge collection
    - Profile management
- Pages
  - Home - Landing page
  - Register - New student registration
  - Login - Wallet authentication
  - Admin Dashboard - Account and role management
  - Lecturer Dashboard - Class and student management
  - Student Dashboard - Overview of classes and attendance
  - Classes - Manage and view classes
  - Attendance - Mark and validate attendance
  - Profile - View attendance badges and profile

## Smart Contract

### Features
- ERC-721 compliant NFT contract
- Minting functionality for attendance badges
- Metadata storage for class information
- Role-based access control for minting

## Environment Variables

### Backend (.env)
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/poap-attendance
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:5173
CONTRACT_ADDRESS=your-contract-address
PRIVATE_KEY=your-private-key
RPC_URL=your-rpc-url
ADMIN_ADDRESS=your-admin-wallet-address
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
VITE_CONTRACT_ADDRESS=your-contract-address
```

## Setup and Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- MetaMask browser extension
- Hardhat (for contract development)

### Backend Setup
1. Install dependencies:
```bash
cd poap-backend
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your values
```

3. Start the development server:
```bash
npm run dev
```

### Frontend Setup
1. Install dependencies:
```bash
cd poap-frontend
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your values
```

3. Start the development server:
```bash
npm run dev
```

### Smart Contract Setup
1. Install dependencies:
```bash
cd poap-attendance-hardhat
npm install
```

2. Compile contracts:
```bash
npx hardhat compile
```

3. Deploy contracts:
```bash
npx hardhat run scripts/deploy.js --network <network-name>
```

## Development Scripts

### Backend
- `npm run dev` - Start development server
- `npm test` - Run tests
- `npm run lint` - Run linter

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Run linter

### Smart Contract
- `npx hardhat compile` - Compile contracts
- `npx hardhat test` - Run tests
- `npx hardhat node` - Start local blockchain
- `npx hardhat run scripts/deploy.js` - Deploy contracts

## User Flow

1. **Admin Setup**
   - Initial admin account creation
   - Create lecturer accounts
   - Assign roles to accounts
   - Monitor system activity

2. **Lecturer Management**
   - Create and manage classes
   - Enroll students in classes
   - Update student information
   - Validate attendance and mint NFTs
   - Remove students from classes

3. **Student Registration**
   - Connect MetaMask wallet
   - Fill in student details (name, ID)
   - Sign message to verify wallet ownership
   - Complete registration

4. **Login**
   - Connect MetaMask wallet
   - Sign message to authenticate
   - Access role-specific dashboard

5. **Attendance**
   - View available classes
   - Mark attendance for class
   - Receive NFT badge upon validation

6. **Profile**
   - View attendance history
   - Manage earned badges
   - Update profile information

## Post-Deployment

1. Update environment variables with deployed contract address
2. Copy contract artifacts to backend:
```bash
./copy-contracts.sh
```

3. Restart backend and frontend servers

## Testing

### Backend Tests
```bash
cd poap-backend
npm test
```

### Frontend Tests
```bash
cd poap-frontend
npm test
```

### Smart Contract Tests
```bash
cd poap-attendance-hardhat
npx hardhat test
```

## License

MIT 