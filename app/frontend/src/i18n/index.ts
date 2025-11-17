import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appTitle: 'CaseFlow',
      login: {
        title: 'Sign in',
        cta: 'Continue',
        email: 'Email',
        password: 'Password'
      },
      import: {
        title: 'Import cases',
        upload: 'Upload CSV',
        historyHeading: 'Recent imports',
        historySubheading: 'Track previous uploads and audit events.',
        reportHeading: 'Import report',
        reportSubheading: 'Track successes, failures, and export validation errors.',
        auditHeading: 'Audit trail',
        auditSubheading: 'Latest events for this batch.',
        downloadCsv: 'Download CSV',
        viewReport: 'View report',
        loadMore: 'Load more',
        noErrors: 'No errors recorded for this import 🎉',
        noAudits: 'No audit events yet — start an upload to log activity.'
      },
      cases: {
        title: 'Cases',
        refresh: 'Refresh',
        searchPlaceholder: 'Search case ID or applicant',
        filters: {
          status: 'Status',
          category: 'Category',
          priority: 'Priority',
          assignee: 'Assignee',
          from: 'From date',
          to: 'To date'
        },
        clearFilters: 'Clear filters',
        rowsPerPage: 'Rows per page',
        table: {
          caseId: 'Case ID',
          applicant: 'Applicant',
          status: 'Status',
          category: 'Category',
          priority: 'Priority',
          updated: 'Updated'
        },
        pagination: {
          previous: 'Previous',
          next: 'Next',
          page: 'Page {{current}} of {{total}}'
        },
        summary: 'Showing up to {{count}} cases per page · Total {{total}} records.',
        detail: {
          status: 'Status',
          priority: 'Priority',
          assignee: 'Assignee',
          unassigned: 'Unassigned',
          timeline: 'Timeline',
          notes: 'Notes',
          addNote: 'Add note',
          saving: 'Saving changes…',
          notePlaceholder: 'Add a note'
        },
        loading: 'Loading…',
        notFound: 'Case not found',
        status: {
          NEW: 'New',
          IN_PROGRESS: 'In progress',
          COMPLETED: 'Completed',
          FAILED: 'Failed'
        },
        categories: {
          TAX: 'Tax',
          LICENSE: 'License',
          PERMIT: 'Permit'
        },
        priorities: {
          LOW: 'Low',
          MEDIUM: 'Medium',
          HIGH: 'High'
        }
      }
    }
  },
  xx: {
    translation: {
      appTitle: 'CaseFlow (xx)',
      login: {
        title: 'Sign in (xx)',
        cta: 'Continue',
        email: 'Email (xx)',
        password: 'Password (xx)'
      },
      import: {
        title: 'Import cases (xx)',
        upload: 'Upload CSV (xx)',
        historyHeading: 'Recent imports (xx)',
        historySubheading: 'Track previous uploads and audit events. (xx)',
        reportHeading: 'Import report (xx)',
        reportSubheading: 'Track successes, failures, and export validation errors. (xx)',
        auditHeading: 'Audit trail (xx)',
        auditSubheading: 'Latest events for this batch. (xx)',
        downloadCsv: 'Download CSV (xx)',
        viewReport: 'View report (xx)',
        loadMore: 'Load more (xx)',
        noErrors: 'No errors recorded for this import 🎉 (xx)',
        noAudits: 'No audit events yet — start an upload to log activity. (xx)'
      },
      cases: {
        title: 'Cases (xx)',
        refresh: 'Refresh (xx)',
        searchPlaceholder: 'Search case ID or applicant (xx)',
        filters: {
          status: 'Status (xx)',
          category: 'Category (xx)',
          priority: 'Priority (xx)',
          assignee: 'Assignee (xx)',
          from: 'From date (xx)',
          to: 'To date (xx)'
        },
        clearFilters: 'Clear filters (xx)',
        rowsPerPage: 'Rows per page (xx)',
        table: {
          caseId: 'Case ID (xx)',
          applicant: 'Applicant (xx)',
          status: 'Status (xx)',
          category: 'Category (xx)',
          priority: 'Priority (xx)',
          updated: 'Updated (xx)'
        },
        pagination: {
          previous: 'Previous (xx)',
          next: 'Next (xx)',
          page: 'Page {{current}} of {{total}} (xx)'
        },
        summary: 'Showing up to {{count}} cases per page · Total {{total}} records. (xx)',
        detail: {
          status: 'Status (xx)',
          priority: 'Priority (xx)',
          assignee: 'Assignee (xx)',
          unassigned: 'Unassigned (xx)',
          timeline: 'Timeline (xx)',
          notes: 'Notes (xx)',
          addNote: 'Add note (xx)',
          saving: 'Saving changes… (xx)',
          notePlaceholder: 'Add a note (xx)'
        },
        loading: 'Loading… (xx)',
        notFound: 'Case not found (xx)',
        status: {
          NEW: 'New (xx)',
          IN_PROGRESS: 'In progress (xx)',
          COMPLETED: 'Completed (xx)',
          FAILED: 'Failed (xx)'
        },
        categories: {
          TAX: 'Tax (xx)',
          LICENSE: 'License (xx)',
          PERMIT: 'Permit (xx)'
        },
        priorities: {
          LOW: 'Low (xx)',
          MEDIUM: 'Medium (xx)',
          HIGH: 'High (xx)'
        }
      }
    }
  }
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  initImmediate: false,
  react: { useSuspense: false }
});

export default i18n;
