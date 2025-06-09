# POAP Attendance System

A decentralized attendance tracking system using POAP NFTs for educational institutions.

## Backend

### Framework
- Express.js for the REST API
- Node.js runtime

### Key Routes
- `/api/auth`
  - `POST /login` - Authenticate with Ethereum wallet
  - `POST /logout` - Clear authentication
  - `GET /me` - Get current user info
- `/api/classes`
  - `GET /` - List all classes
  - `POST /` - Create new class
  - `GET /:classId` - Get class details
  - `POST /:classId/enroll` - Enroll student in class
- `/api/attendance`
  - `POST /mark` - Mark attendance
  - `POST /validate` - Validate attendance and mint NFT
  - `GET /:classId` - Get attendance records
- `/api/student`
  - `GET /:address/badges` - Get student's attendance badges

### Database
- MongoDB for storing:
  - User profiles
  - Class information
  - Attendance records
  - NFT metadata

## Frontend

### Framework
- React.js with Vite
- Tailwind CSS for styling
- React Router for navigation

### Features
- MetaMask Integration
  - Wallet connection
  - Message signing for authentication
- Pages
  - Home - Landing page
  - Login - Wallet authentication
  - Dashboard - Overview of classes and attendance
  - Classes - Manage and view classes
  - Attendance - Mark and validate attendance
  - Profile - View attendance badges and profile

## Smart Contract

### Features
- ERC-721 compliant NFT contract
- Minting functionality for attendance badges
- Metadata storage for class information

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