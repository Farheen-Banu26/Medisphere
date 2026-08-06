import { RiAlertLine } from 'react-icons/ri';
import { Link } from 'react-router-dom';

export const NotFound = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
    <div className="mb-6 flex items-center justify-center w-24 h-24 rounded-3xl bg-red-500/10 text-red-400">
      <RiAlertLine className="w-10 h-10" />
    </div>
    <h1 className="text-6xl font-black text-white mb-3">404</h1>
    <p className="text-lg text-gray-400 mb-6">The page you were looking for cannot be found.</p>
    <Link to="/" className="btn-primary">Return to Dashboard</Link>
  </div>
);

export default NotFound;
