import { useEffect, useState } from 'react';

interface ColumnManagerProps {
  headers: string[];
  columnOrder: string[];
  onChange: (order: string[]) => void;
  disabled?: boolean;
}

export const ColumnManager = ({ headers, columnOrder, onChange, disabled = false }: ColumnManagerProps) => {
  const [order, setOrder] = useState<string[]>(columnOrder.length ? columnOrder : headers);

  useEffect(() => {
    setOrder(columnOrder.length ? columnOrder : headers);
  }, [columnOrder, headers]);

  const moveColumn = (index: number, delta: number) => {
    const next = [...order];
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(targetIndex, 0, item);
    setOrder(next);
    onChange(next);
  };

  const resetOrder = () => {
    setOrder(headers);
    onChange(headers);
  };

  return (
    <section className="surface-card" aria-disabled={disabled}>
      <div className="section-title">
        <div>
          <h2>Column arrangement</h2>
          <p className="text-muted">
            Reorder how columns appear in the review grid—changes apply instantly and help during validation.
          </p>
        </div>
        <button type="button" className="ghost" onClick={resetOrder} disabled={disabled}>
          Reset
        </button>
      </div>
      <div className="column-grid">
        {order.map((header, index) => (
          <div key={header} className="column-chip">
            <span>{header}</span>
            <div className="chip-actions">
              <button
                type="button"
                onClick={() => moveColumn(index, -1)}
                disabled={index === 0 || disabled}
                aria-label="Move column earlier"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveColumn(index, 1)}
                disabled={index === order.length - 1 || disabled}
                aria-label="Move column later"
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
