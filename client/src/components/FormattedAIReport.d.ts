import type { ReactElement } from 'react';
export function reportValue(value: unknown): unknown;
export function reportText(value: unknown, depth?: number): string;
export default function AIReport(props: { response?: unknown; title?: string; loading?: boolean; error?: string | null }): ReactElement | null;
