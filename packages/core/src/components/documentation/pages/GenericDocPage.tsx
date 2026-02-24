/**
 * Placeholder content for doc pages that don't yet have authored content.
 * Replace by adding a specific page component to the slug map in DocsPage.
 */

import { DocSection } from '../DocSection';
import { Callout } from '../Callout';

interface GenericDocPageProps {
    title: string;
}

export function GenericDocPage({ title }: GenericDocPageProps) {
    return (
        <DocSection title={title}>
            <Callout variant="info" title="Coming soon">
                This page is being written. Check back soon for full documentation.
            </Callout>
        </DocSection>
    );
}
