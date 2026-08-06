// src/components/tables/DataTable.jsx
import { useState } from 'react';
import { RiArrowUpLine, RiArrowDownLine } from 'react-icons/ri';
import { EmptyState } from '../common/EmptyState';
import { Spinner } from '../common/Spinner';

export const DataTable = ({
  columns,
  data,
  loading = false,
  keyField = 'id',
  onRowClick,
  emptyMessage = 'No records found',
}) => {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (col) => {
    if (!col.sortable) return;
    if (sortCol === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col.key);
      setSortDir('asc');
    }
  };

  const sorted = [...(data || [])].sort((a, b) => {
    if (!sortCol) return 0;
    const va = a[sortCol] ?? '';
    const vb = b[sortCol] ?? '';
    return sortDir === 'asc'
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col)}
                className={col.sortable ? 'cursor-pointer select-none hover:text-gray-200' : ''}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortCol === col.key && (
                    sortDir === 'asc'
                      ? <RiArrowUpLine className="w-3 h-3" />
                      : <RiArrowDownLine className="w-3 h-3" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState title={emptyMessage} />
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr
                key={row[keyField]}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
      <p className="text-xs text-gray-400">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn-outline btn-sm disabled:opacity-40"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-surface-2'
              }`}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn-outline btn-sm disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DataTable;
