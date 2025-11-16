import { useCallback, useState } from 'react';
import Papa from 'papaparse';
import { importStore } from '../state/import.store';
export const useCsvParser = () => {
    const loadCsv = importStore((state) => state.loadCsv);
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState();
    const parseFile = useCallback((file) => {
        setStatus('parsing');
        setError(undefined);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: 'greedy',
            worker: true,
            complete(result) {
                if (result.errors.length > 0) {
                    setStatus('error');
                    setError(result.errors[0].message);
                    return;
                }
                const headers = result.meta.fields ?? [];
                loadCsv({ headers, rows: result.data.filter(Boolean), sourceName: file.name });
                setStatus('ready');
            },
            error(parseError) {
                setStatus('error');
                setError(parseError.message);
            }
        });
    }, [loadCsv]);
    return { parseFile, status, error };
};
