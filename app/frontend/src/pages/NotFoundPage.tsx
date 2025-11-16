import { Link } from 'react-router-dom';

export const NotFoundPage = () => (
  <div className="surface-card not-found">
    <h1>404</h1>
    <p>We couldn\'t find that view. Try returning to your workspace.</p>
    <Link to="/import" className="primary">
      Go to dashboard
    </Link>
  </div>
);
