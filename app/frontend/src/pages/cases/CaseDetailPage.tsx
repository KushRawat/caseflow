import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { addCaseNote, fetchCase, updateCase } from '../../api/cases';
import { BackButton } from '../../components/BackButton';
import { listUsers } from '../../api/users';
import type { CaseCategory, CasePriority, CaseStatus } from '../../api/types';

const statusOptions = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'FAILED'] as const;
const priorityOptions = ['LOW', 'MEDIUM', 'HIGH'] as const;

export const CaseDetailPage = () => {
  const { t } = useTranslation();
  const params = useParams();
  const queryClient = useQueryClient();
  const caseId = params.caseId as string;
  const query = useQuery({ queryKey: ['case', caseId], queryFn: () => fetchCase(caseId), enabled: Boolean(caseId) });
  const assigneesQuery = useQuery({ queryKey: ['users'], queryFn: listUsers });

  const mutation = useMutation({
    mutationFn: (body: string) => addCaseNote(caseId, { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['case', caseId] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateCase(caseId, payload),
    onMutate: async (payload: Record<string, unknown>) => {
      await queryClient.cancelQueries({ queryKey: ['case', caseId] });
      const previous = queryClient.getQueryData(['case', caseId]);
      queryClient.setQueryData(['case', caseId], (current: typeof query.data | undefined) => {
        if (!current) return current;
        const next = { ...current };
        if (payload.status) {
          next.status = payload.status as CaseStatus;
        }
        if (payload.priority) {
          next.priority = payload.priority as CasePriority;
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'assigneeId')) {
          const targetId = payload.assigneeId as string | null | undefined;
          if (!targetId) {
            next.assignee = null;
          } else {
            const candidate = assigneesQuery.data?.users?.find((user) => user.id === targetId);
            if (candidate) {
              next.assignee = candidate;
            }
          }
        }
        return next;
      });
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['case', caseId], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      void queryClient.invalidateQueries({ queryKey: ['cases'] });
    }
  });

  const getStatusLabel = (value: CaseStatus) => t(`cases.status.${value}`, { defaultValue: value });
  const getPriorityLabel = (value: CasePriority) => t(`cases.priorities.${value}`, { defaultValue: value });
  const getCategoryLabel = (value: CaseCategory) => t(`cases.categories.${value}`, { defaultValue: value });

  if (query.isLoading) {
    return <div className="loader">{t('cases.loading', { defaultValue: 'Loading…' })}</div>;
  }

  if (!query.data) {
    return <p>{t('cases.notFound', { defaultValue: 'Case not found' })}</p>;
  }

  const record = query.data;
  const handleFieldChange = (field: 'status' | 'priority' | 'assigneeId', value: string) => {
    const payload: Record<string, string | null> =
      field === 'assigneeId'
        ? { assigneeId: value === '' ? null : value }
        : { [field]: value };
    updateMutation.mutate(payload);
  };

  return (
    <div className="surface-card">
      <BackButton />
      <h1>{record.caseId}</h1>
      <p>
        {record.applicantName} · {getCategoryLabel(record.category)} · {getPriorityLabel(record.priority)}
      </p>

      <section className="case-controls">
        <label>
          {t('cases.detail.status', { defaultValue: 'Status' })}
          <select
            value={record.status}
            onChange={(event) => handleFieldChange('status', event.target.value)}
            disabled={updateMutation.isPending}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('cases.detail.priority', { defaultValue: 'Priority' })}
          <select
            value={record.priority}
            onChange={(event) => handleFieldChange('priority', event.target.value)}
            disabled={updateMutation.isPending}
          >
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {getPriorityLabel(priority)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('cases.detail.assignee', { defaultValue: 'Assignee' })}
          <select
            value={record.assignee?.id ?? ''}
            onChange={(event) => handleFieldChange('assigneeId', event.target.value)}
            disabled={updateMutation.isPending}
          >
            <option value="">{t('cases.detail.unassigned', { defaultValue: 'Unassigned' })}</option>
            {(assigneesQuery.data?.users ?? []).map((user) => (
              <option key={user.id} value={user.id}>
                {user.email}
              </option>
            ))}
          </select>
        </label>
        {updateMutation.isPending && (
          <span className="text-muted">{t('cases.detail.saving', { defaultValue: 'Saving changes…' })}</span>
        )}
      </section>

      <section>
        <h2>{t('cases.detail.timeline', { defaultValue: 'Timeline' })}</h2>
        <ul>
          {record.history.map((entry) => (
            <li key={entry.id}>
              <strong>{new Date(entry.createdAt).toLocaleString()}</strong> — {entry.message}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>{t('cases.detail.notes', { defaultValue: 'Notes' })}</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.target as HTMLFormElement;
            const data = new FormData(form);
            const body = data.get('body')?.toString();
            if (body) {
              mutation.mutate(body);
              form.reset();
            }
          }}
        >
          <textarea
            name="body"
            rows={3}
            placeholder={t('cases.detail.notePlaceholder', { defaultValue: 'Add a note' })}
            required
          />
          <button type="submit" className={mutation.isPending ? 'button-loading' : ''} disabled={mutation.isPending}>
            {mutation.isPending ? <span className="spinner" aria-hidden /> : t('cases.detail.addNote', { defaultValue: 'Add note' })}
          </button>
        </form>
        <ul>
          {record.notes.map((note) => (
            <li key={note.id}>
              <strong>{note.author?.email ?? 'System'}</strong> — {note.body}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
