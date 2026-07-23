import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-background-main border-t border-surface p-8 mt-12 text-center text-sm text-gray-500">
      <div className="flex flex-wrap justify-center gap-4 mb-4">
        <Link to="/terms" className="hover:text-primary">Terms of Use</Link>
        <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
        <Link to="/refund" className="hover:text-primary">Refund Policy</Link>
        <Link to="/copyright" className="hover:text-primary">Copyright</Link>
        <Link to="/guidelines" className="hover:text-primary">Community Guidelines</Link>
        <Link to="/ban-policy" className="hover:text-primary">Ban Policy</Link>
        <Link to="/premium-agreement" className="hover:text-primary">Premium Agreement</Link>
        <Link to="/contact" className="hover:text-primary">Contact Us</Link>
      </div>
      <p>&copy; {new Date().getFullYear()} EduPlatform. All rights reserved.</p>
    </footer>
  );
}
