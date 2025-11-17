import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { addCaseNote, fetchCase, updateCase } from '../../api/cases';
import { BackButton } from '../../components/BackButton';
import { listUsers } from '../../api/users';
const statusOptions = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'FAILED'];
const priorityOptions = ['LOW', 'MEDIUM', 'HIGH'];
export const CaseDetailPage = () => {
    const { t } = useTranslation();
    const params = useParams();
    const queryClient = useQueryClient();
    const caseId = params.caseId;
    const query = useQuery({ queryKey: ['case', caseId], queryFn: () => fetchCase(caseId), enabled: Boolean(caseId) });
    const assigneesQuery = useQuery({ queryKey: ['users'], queryFn: listUsers });
    const mutation = useMutation({
        mutationFn: (body) => addCaseNote(caseId, { body }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['case', caseId] });
        }
    });
    const updateMutation = useMutation({
        mutationFn: (payload) => updateCase(caseId, payload),
        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: ['case', caseId] });
            const previous = queryClient.getQueryData(['case', caseId]);
            queryClient.setQueryData(['case', caseId], (current) => {
                if (!current)
                    return current;
                const next = { ...current };
                if (payload.status) {
                    next.status = payload.status;
                }
                if (payload.priority) {
                    next.priority = payload.priority;
                }
                if (Object.prototype.hasOwnProperty.call(payload, 'assigneeId')) {
                    const targetId = payload.assigneeId;
                    if (!targetId) {
                        next.assignee = null;
                    }
                    else {
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
    const getStatusLabel = (value) => t(`cases.status.${value}`, { defaultValue: value });
    const getPriorityLabel = (value) => t(`cases.priorities.${value}`, { defaultValue: value });
    const getCategoryLabel = (value) => t(`cases.categories.${value}`, { defaultValue: value });
    if (query.isLoading) {
        return _jsx("div", { className: "loader", children: t('cases.loading', { defaultValue: 'Loading…' }) });
    }
    if (!query.data) {
        return _jsx("p", { children: t('cases.notFound', { defaultValue: 'Case not found' }) });
    }
    const record = query.data;
    const handleFieldChange = (field, value) => {
        const payload = field === 'assigneeId'
            ? { assigneeId: value === '' ? null : value }
            : { [field]: value };
        updateMutation.mutate(payload);
    };
    return (_jsxs("div", { className: "surface-card", children: [_jsx(BackButton, {}), _jsx("h1", { children: record.caseId }), _jsxs("p", { children: [record.applicantName, " \u00B7 ", getCategoryLabel(record.category), " \u00B7 ", getPriorityLabel(record.priority)] }), _jsxs("section", { className: "case-controls", children: [_jsxs("label", { children: [t('cases.detail.status', { defaultValue: 'Status' }), _jsx("select", { value: record.status, onChange: (event) => handleFieldChange('status', event.target.value), disabled: updateMutation.isPending, children: statusOptions.map((status) => (_jsx("option", { value: status, children: getStatusLabel(status) }, status))) })] }), _jsxs("label", { children: [t('cases.detail.priority', { defaultValue: 'Priority' }), _jsx("select", { value: record.priority, onChange: (event) => handleFieldChange('priority', event.target.value), disabled: updateMutation.isPending, children: priorityOptions.map((priority) => (_jsx("option", { value: priority, children: getPriorityLabel(priority) }, priority))) })] }), _jsxs("label", { children: [t('cases.detail.assignee', { defaultValue: 'Assignee' }), _jsxs("select", { value: record.assignee?.id ?? '', onChange: (event) => handleFieldChange('assigneeId', event.target.value), disabled: updateMutation.isPending, children: [_jsx("option", { value: "", children: t('cases.detail.unassigned', { defaultValue: 'Unassigned' }) }), (assigneesQuery.data?.users ?? []).map((user) => (_jsx("option", { value: user.id, children: user.email }, user.id)))] })] }), updateMutation.isPending && (_jsx("span", { className: "text-muted", children: t('cases.detail.saving', { defaultValue: 'Saving changes…' }) }))] }), _jsxs("section", { children: [_jsx("h2", { children: t('cases.detail.timeline', { defaultValue: 'Timeline' }) }), _jsx("ul", { children: record.history.map((entry) => (_jsxs("li", { children: [_jsx("strong", { children: new Date(entry.createdAt).toLocaleString() }), " \u2014 ", entry.message] }, entry.id))) })] }), _jsxs("section", { children: [_jsx("h2", { children: t('cases.detail.notes', { defaultValue: 'Notes' }) }), _jsxs("form", { onSubmit: (event) => {
                            event.preventDefault();
                            const form = event.target;
                            const data = new FormData(form);
                            const body = data.get('body')?.toString();
                            if (body) {
                                mutation.mutate(body);
                                form.reset();
                            }
                        }, children: [_jsx("textarea", { name: "body", rows: 3, placeholder: t('cases.detail.notePlaceholder', { defaultValue: 'Add a note' }), required: true }), _jsx("button", { type: "submit", className: mutation.isPending ? 'button-loading' : '', disabled: mutation.isPending, children: mutation.isPending ? _jsx("span", { className: "spinner", "aria-hidden": true }) : t('cases.detail.addNote', { defaultValue: 'Add note' }) })] }), _jsx("ul", { children: record.notes.map((note) => (_jsxs("li", { children: [_jsx("strong", { children: note.author?.email ?? 'System' }), " \u2014 ", note.body] }, note.id))) })] })] }));
};
