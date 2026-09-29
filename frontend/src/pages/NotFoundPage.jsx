import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="content">
      <h1>Page not found</h1>
      <Link to="/">Go home</Link>
    </div>
  );
}
