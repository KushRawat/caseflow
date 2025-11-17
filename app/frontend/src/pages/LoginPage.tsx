import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { authStore } from '../state/auth.store';
import { uiStore } from '../state/ui.store';

type FormData = {
  email: string;
  password: string;
};

export const LoginPage = () => {
  const { t } = useTranslation();
  const { register, handleSubmit } = useForm<FormData>({ defaultValues: { email: '', password: '' } });
  const status = authStore((state) => state.status);
  const user = authStore((state) => state.user);
  const signIn = authStore((state) => state.signIn);
  const error = authStore((state) => state.error);
  const loginLayout = uiStore((state) => state.loginLayout);
  const setLoginLayout = uiStore((state) => state.setLoginLayout);

  if (user && status === 'authenticated') {
    const destination = user.role === 'ADMIN' ? '/import' : '/cases';
    return <Navigate to={destination} replace />;
  }

  const onSubmit = async (form: FormData) => {
    try {
      await signIn(form);
    } catch {
      // state already updated
    }
  };

  const formFields = (
    <form onSubmit={handleSubmit(onSubmit)} className="login-form-fields">
      <label className="form-field">
        <span>{t('login.email')}</span>
        <input type="email" {...register('email', { required: true })} autoComplete="email" />
      </label>
      <label className="form-field">
        <span>{t('login.password')}</span>
        <input type="password" {...register('password', { required: true })} autoComplete="current-password" />
      </label>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className={`primary ${status === 'loading' ? 'button-loading' : ''}`} disabled={status === 'loading'}>
        {status === 'loading' ? <span className="spinner" aria-hidden /> : t('login.cta')}
      </button>
    </form>
  );

  const heroLayout = (
    <div className="login-hero">
      <div className="login-copy">
        <div className="hero-logo">CF</div>
        <h1>
          Import faster. <span>Trust every row.</span>
        </h1>
        <p>
          CaseFlow wraps your entire intake pipeline—upload, fix, and track cases with delightful speed and zero surprises.
        </p>
        <ul className="login-bullets">
          <li>Virtualized grid handles 50k+ rows effortlessly</li>
          <li>Chunked uploads with automatic retries and telemetry</li>
          <li>Auditable history for every batch and case</li>
        </ul>
      </div>
      <div className="login-form-card surface-card">
        <h2>{t('login.title')}</h2>
        <p className="text-muted">Use your workspace credentials to continue.</p>
        {formFields}
      </div>
      <div className="floating-orb orb-1" />
      <div className="floating-orb orb-2" />
    </div>
  );

  const classicLayout = (
    <div className="login-classic">
      <div className="surface-card">
        <div className="hero-logo">CF</div>
        <h2>{t('login.title')}</h2>
        <p className="text-muted">Securely sign in to continue.</p>
        {formFields}
      </div>
    </div>
  );

  return (
    <div className="login-wrapper">
      <div className="layout-toggle">
        <div>
          <span>Login layout</span>
          <p className="text-muted">Choose the experience that fits your workflow.</p>
        </div>
        <div className="segment-controls">
          {[
            { id: 'hero', label: 'Showcase' },
            { id: 'classic', label: 'Compact' }
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              className={loginLayout === option.id ? 'active' : ''}
              onClick={() => setLoginLayout(option.id as 'hero' | 'classic')}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {loginLayout === 'hero' ? heroLayout : classicLayout}
    </div>
  );
};
