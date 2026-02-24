import { DocSection } from '../DocSection';
import { Callout } from '../Callout';

export function QuickStartPage() {
    return (
        <>
            <DocSection title="Upload a Spec">
                <p>
                    Navigate to the <strong>Catalog</strong> page and click <strong>Add API</strong>.
                    You can import a spec three ways:
                </p>
                <ul className="list-disc space-y-1 pl-4 text-foreground/80">
                    <li><strong>File upload</strong> — drag and drop a <code>.yaml</code> or <code>.json</code> file.</li>
                    <li><strong>Paste</strong> — paste raw YAML or JSON directly into the editor.</li>
                    <li><strong>URL fetch</strong> — provide a public URL to a raw spec file.</li>
                </ul>
            </DocSection>

            <DocSection title="Browse Endpoints">
                <p>
                    After importing, click the spec card to open the full documentation view.
                    The left sidebar groups endpoints by tag. Click any endpoint to see its
                    parameters, request body schema, and example responses.
                </p>
            </DocSection>

            <DocSection title="Make Your First Request">
                <p>
                    With an endpoint selected, click the <strong>Try It Out</strong> tab on the right panel.
                    Fill in any required parameters, choose your auth method, and hit <strong>Send</strong>.
                </p>
                <Callout variant="info" title="CORS">
                    If the target API does not allow cross-origin requests, requests are proxied
                    server-side via <code>/api/execute-request</code>.
                </Callout>
            </DocSection>
        </>
    );
}
