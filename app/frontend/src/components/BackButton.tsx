import { useNavigate } from 'react-router-dom';

export const BackButton = () => {
  const navigate = useNavigate();

  return (
    <button type="button" className="ghost back-button" onClick={() => navigate(-1)}>
      ← Back
    </button>
  );
};
