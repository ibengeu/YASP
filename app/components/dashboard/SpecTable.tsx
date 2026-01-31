/**
 * Spec Table Component
 * Displays specifications in a table format with actions
 */

import { Link } from 'react-router';
import type { OpenApiDocument } from '@/core/storage/storage-schema';

interface SpecTableProps {
  specs: OpenApiDocument[];
  onDelete: (id: string) => void;
}

export function SpecTable({ specs, onDelete }: SpecTableProps) {
  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-rose-500';
  };

  const getQualityGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'F';
  };

  return (
    <table className="w-full">
      <thead className="border-b border-white/5">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
            Specification
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
            Version
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
            Quality
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
            Status
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
            Last Updated
          </th>
          <th className="px-4 py-3 text-right text-xs font-medium text-[#666] uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {specs.map((spec) => {
          const score = spec.metadata.score || 0;
          return (
            <tr
              key={spec.id}
              className="group hover:bg-white/5 transition-colors"
            >
              <td className="px-4 py-4">
                <Link
                  to={`/editor/${spec.id}`}
                  className="flex flex-col hover:text-white transition-colors"
                >
                  <span className="text-sm font-medium text-white">{spec.title}</span>
                  {spec.description && (
                    <span className="text-xs text-[#666] mt-0.5 line-clamp-1">{spec.description}</span>
                  )}
                </Link>
              </td>
              <td className="px-4 py-4">
                <span className="text-xs text-[#888]">{spec.version}</span>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${getQualityColor(score)}`}>
                    {getQualityGrade(score)}
                  </span>
                  <div className="flex-1 bg-[#111] rounded-full h-1 w-16 overflow-hidden">
                    <div
                      className={`h-full ${
                        score >= 80
                          ? 'bg-emerald-500'
                          : score >= 60
                            ? 'bg-yellow-500'
                            : 'bg-rose-500'
                      }`}
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-[#666]">{score}%</span>
                </div>
              </td>
              <td className="px-4 py-4">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 rounded-full">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                  Active
                </span>
              </td>
              <td className="px-4 py-4">
                <span className="text-xs text-[#666]">
                  {new Date(spec.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </td>
              <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    to={`/editor/${spec.id}`}
                    className="p-1.5 text-[#666] hover:text-white transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </Link>
                  <button
                    onClick={() => onDelete(spec.id)}
                    className="p-1.5 text-[#666] hover:text-rose-500 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
