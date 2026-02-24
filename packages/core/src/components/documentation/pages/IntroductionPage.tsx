import { DocSection } from '../DocSection';
import { Callout } from '../Callout';

export function IntroductionPage() {
    return (
        <>
            <DocSection title="What is YASP?">
                <p>
                    YASP (Yet Another Swagger/OpenAPI Project) is an open-source API management
                    platform that lets you import, explore, and test your OpenAPI and Swagger
                    specifications — all from your browser, with no backend required.
                </p>
                <p>
                    Specs are stored locally in IndexedDB, so your API definitions stay private
                    and available offline.
                </p>
            </DocSection>

            <DocSection title="Key Features">
                <ul className="list-disc space-y-2 pl-4 text-foreground/80">
                    <li><strong>API Catalog</strong> — import specs by file upload, paste, or URL fetch.</li>
                    <li><strong>Live Editor</strong> — edit YAML/JSON with real-time Spectral linting.</li>
                    <li><strong>Try It Out</strong> — send real HTTP requests directly from the docs UI.</li>
                    <li><strong>Workflows</strong> — chain requests together with variable substitution.</li>
                    <li><strong>Dark mode</strong> — full dark/light theme support.</li>
                </ul>
            </DocSection>

            <DocSection title="Who is it for?">
                <p>
                    YASP is built for API developers, QA engineers, and technical writers who want
                    a lightweight alternative to heavyweight API platforms — without an account,
                    without a subscription, and without your data leaving your machine.
                </p>
                <Callout variant="tip" title="Beta">
                    YASP is currently in open beta. Join the waitlist to get early access to team
                    collaboration features.
                </Callout>
            </DocSection>
        </>
    );
}
