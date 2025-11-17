import { useRef, useState, useEffect } from 'react';

import { BackButton } from '../../components/BackButton';
import { ImportHistoryPanel } from '../../components/ImportHistoryPanel';
import { ImportReport } from '../../components/ImportReport';

export const ImportHistoryPage = () => {
  const [activeImportId, setActiveImportId] = useState<string | null>(null);
  const reportAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeImportId && reportAnchorRef.current) {
      reportAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeImportId]);

  return (
    <div className="page-grid">
      <section className="surface-card">
        <BackButton />
        <div className="section-title">
          <div>
            <h2>Recent import activity</h2>
            <p className="text-muted">Audit past uploads, download failed rows, and jump back into any report.</p>
          </div>
        </div>
      </section>
      <div className="stack">
        <ImportHistoryPanel activeImportId={activeImportId} onSelectReport={setActiveImportId} />
        <div ref={reportAnchorRef}>{activeImportId && <ImportReport importId={activeImportId} />}</div>
      </div>
    </div>
  );
};
