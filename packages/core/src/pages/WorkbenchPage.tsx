/**
 * Workbench Page - /workbench
 * High-fidelity IDE-like view for API specifications
 */

import { PageLayout } from '@/components/layout/PageLayout';
import { IdeWorkbench } from '@/components/workbench/IdeWorkbench';

export default function WorkbenchPage() {
  return (
    <PageLayout activeView="workbench">
      <IdeWorkbench />
    </PageLayout>
  );
}
