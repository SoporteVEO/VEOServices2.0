// NOTE: This file mirrors apps/web/src/components/pdfx/table/pdfx-table.types.ts. Keep them in sync.

import type { Style } from '@react-pdf/types';
import type React from 'react';

export type TableVariant =
  | 'line'
  | 'grid'
  | 'minimal'
  | 'striped'
  | 'compact'
  | 'bordered'
  | 'primary-header';

export interface TableProps {
  style?: Style;
  children: React.ReactNode;
  variant?: TableVariant;
  zebraStripe?: boolean;
  noWrap?: boolean;
}

export interface TableSectionProps {
  style?: Style;
  children: React.ReactNode;
}

export interface TableRowProps {
  style?: Style;
  children: React.ReactNode;
  header?: boolean;
  footer?: boolean;
  stripe?: boolean;
  variant?: TableVariant;
}

export interface TableCellProps {
  style?: Style;
  children: React.ReactNode;
  header?: boolean;
  footer?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  variant?: TableVariant;
  _last?: boolean;
}
