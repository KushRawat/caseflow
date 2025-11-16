import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { addCaseNote, fetchCase, updateCase } from '../../api/cases';
import { BackButton } from '../../components/BackButton';
import { listUsers } from '../../api/users';

const statusOptions = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'FAILED'] as const;
const priorityOptions = ['LOW', 'MEDIUM', 'HIGH'] as const;

export const CaseDetailPage = () => {
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['case', caseId] });
    }
  });

  if (query.isLoading) {
    return <div className="loader">Loading…</div>;
  }

  if (!query.data) {
    return <p>Case not found</p>;
  }

  const record = query.data;
  const handleFieldChange = (field: 'status' | 'priority' | 'assigneeId', value: string) => {
    const payload =
      field === 'assigneeId'
        ? {
            assigneeId: value === '' ? null : value
          }
        : { [field]: value };
    updateMutation.mutate(payload);
  };

  return (
    <div className="surface-card">
      <BackButton />
      <h1>{record.caseId}</h1>
      <p>
        {record.applicantName} · {record.category} · {record.priority}
      </p>
      <section className="case-controls">
        <label>
          Status
          <select value={record.status} onChange={(event) => handleFieldChange('status', event.target.value)}>
            {statusOptions.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select value={record.priority} onChange={(event) => handleFieldChange('priority', event.target.value)}>
            {priorityOptions.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </select>
        </label>
        <label>
          Assignee
          <select
            value={record.assignee?.id ?? ''}
            onChange={(event) => handleFieldChange('assigneeId', event.target.value)}
          >
            <option value="">Unassigned</option>
            {(assigneesQuery.data?.users ?? []).map((user) => (
              <option key={user.id} value={user.id}>
                {user.email}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section>
        <h2>Timeline</h2>
        <ul>
          {record.history.map((entry) => (
            <li key={entry.id}>
              <strong>{new Date(entry.createdAt).toLocaleString()}</strong> — {entry.message}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Notes</h2>
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
          <textarea name="body" rows={3} placeholder="Add a note" required />
          <button type="submit" className={mutation.isPending ? 'button-loading' : ''} disabled={mutation.isPending}>
            {mutation.isPending ? <span className="spinner" aria-hidden /> : 'Add note'}
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
