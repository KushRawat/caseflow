import { useEffect, useState } from 'react';

interface ColumnManagerProps {
  headers: string[];
  columnOrder: string[];
  onChange: (order: string[]) => void;
}

export const ColumnManager = ({ headers, columnOrder, onChange }: ColumnManagerProps) => {
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
    <section className="surface-card">
      <div className="section-title">
        <div>
          <h2>Column arrangement</h2>
          <p className="text-muted">Reorder visible columns to match your preferred workflow.</p>
        </div>
        <button type="button" className="ghost" onClick={resetOrder}>
          Reset
        </button>
      </div>
      <ul className="column-order-list">
        {order.map((header, index) => (
          <li key={header} className="column-order-item">
            <span>{header}</span>
            <div>
              <button type="button" onClick={() => moveColumn(index, -1)} disabled={index === 0} aria-label="Move left">
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveColumn(index, 1)}
                disabled={index === order.length - 1}
                aria-label="Move right"
              >
                ↓
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
