import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { addCaseNote, fetchCase } from '../../api/cases';
import { BackButton } from '../../components/BackButton';
export const CaseDetailPage = () => {
    const params = useParams();
    const queryClient = useQueryClient();
    const caseId = params.caseId;
    const query = useQuery({ queryKey: ['case', caseId], queryFn: () => fetchCase(caseId), enabled: Boolean(caseId) });
    const mutation = useMutation({
        mutationFn: (body) => addCaseNote(caseId, { body }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['case', caseId] });
        }
    });
    if (query.isLoading) {
        return _jsx("div", { className: "loader", children: "Loading\u2026" });
    }
    if (!query.data) {
        return _jsx("p", { children: "Case not found" });
    }
    const record = query.data;
    return (_jsxs("div", { className: "surface-card", children: [_jsx(BackButton, {}), _jsx("h1", { children: record.caseId }), _jsxs("p", { children: [record.applicantName, " \u00B7 ", record.category, " \u00B7 ", record.priority] }), _jsxs("section", { children: [_jsx("h2", { children: "Timeline" }), _jsx("ul", { children: record.history.map((entry) => (_jsxs("li", { children: [_jsx("strong", { children: new Date(entry.createdAt).toLocaleString() }), " \u2014 ", entry.message] }, entry.id))) })] }), _jsxs("section", { children: [_jsx("h2", { children: "Notes" }), _jsxs("form", { onSubmit: (event) => {
                            event.preventDefault();
                            const form = event.target;
                            const data = new FormData(form);
                            const body = data.get('body')?.toString();
                            if (body) {
                                mutation.mutate(body);
                                form.reset();
                            }
                        }, children: [_jsx("textarea", { name: "body", rows: 3, placeholder: "Add a note", required: true }), _jsx("button", { type: "submit", className: mutation.isPending ? 'button-loading' : '', disabled: mutation.isPending, children: mutation.isPending ? _jsx("span", { className: "spinner", "aria-hidden": true }) : 'Add note' })] }), _jsx("ul", { children: record.notes.map((note) => (_jsxs("li", { children: [_jsx("strong", { children: note.author?.email ?? 'System' }), " \u2014 ", note.body] }, note.id))) })] })] }));
};
