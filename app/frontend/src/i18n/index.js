import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
const resources = {
    en: {
        translation: {
            appTitle: 'CaseFlow',
            login: {
                title: 'Sign in',
                cta: 'Continue'
            },
            import: {
                title: 'Import cases',
                upload: 'Upload CSV'
            }
        }
    },
    xx: {
        translation: {
            appTitle: 'CaseFlow (xx)',
            login: {
                title: 'Sign in (xx)',
                cta: 'Continue'
            }
        }
    }
};
i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
});
export default i18n;
