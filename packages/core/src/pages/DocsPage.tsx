/**
 * DocsPage — prose documentation page rendered by the /docs and /docs/:slug routes.
 *
 * Reads the :slug param from React Router, resolves page metadata and content,
 * and renders everything inside DocumentationLayout.
 */

import { useParams, useLocation, Navigate } from 'react-router';
import { DocumentationLayout } from '@/components/documentation/DocumentationLayout';
import { DocHeader } from '@/components/documentation/DocHeader';
import { DocFooter } from '@/components/documentation/DocFooter';
import { GenericDocPage } from '@/components/documentation/pages/GenericDocPage';
import { IntroductionPage } from '@/components/documentation/pages/IntroductionPage';
import { InstallationPage } from '@/components/documentation/pages/InstallationPage';
import { QuickStartPage } from '@/components/documentation/pages/QuickStartPage';
import {
    DOC_NAV,
    DOC_PAGE_META,
    SLUG_ALIASES,
    getAdjacentPages,
} from '@/components/documentation/docs-content';
import type { DocSlug } from '@/components/documentation/docs-content';

/** Map of slug → content component. Add entries here as pages are authored. */
const PAGE_CONTENT: Partial<Record<DocSlug, React.ComponentType>> = {
    introduction: IntroductionPage,
    installation: InstallationPage,
    'quick-start': QuickStartPage,
};

export default function DocsPage() {
    const { slug: rawSlug } = useParams<{ slug?: string }>();
    const { pathname } = useLocation();

    // Normalise: root /docs has no slug param → alias to 'introduction'
    const slug = (rawSlug ?? '') as DocSlug;
    const resolvedSlug: DocSlug = SLUG_ALIASES[slug] ?? slug;

    const meta = DOC_PAGE_META[resolvedSlug];
    if (!meta) {
        // Unknown slug — redirect to docs root
        return <Navigate to="/docs" replace />;
    }

    const { prev, next } = getAdjacentPages(resolvedSlug);
    const Content = PAGE_CONTENT[resolvedSlug] ?? (() => <GenericDocPage title={meta.title} />);

    return (
        <DocumentationLayout
            nav={DOC_NAV}
            currentPath={pathname}
            headings={meta.headings}
        >
            <div className="mx-auto max-w-3xl px-6 py-8 lg:px-10">
                <DocHeader
                    title={meta.title}
                    subtitle={meta.subtitle}
                    breadcrumbs={meta.breadcrumbs}
                />

                <Content />

                <DocFooter
                    prev={prev}
                    next={next}
                    lastUpdated={meta.lastUpdated}
                />
            </div>
        </DocumentationLayout>
    );
}
