import { DocSection } from '../DocSection';
import { CodeBlock } from '../CodeBlock';
import { Callout } from '../Callout';

export function InstallationPage() {
    return (
        <>
            <DocSection title="Requirements">
                <ul className="list-disc space-y-1 pl-4 text-foreground/80">
                    <li>Node.js 18+ or Bun 1.3+</li>
                    <li>A modern browser (Chrome, Firefox, Safari, Edge)</li>
                </ul>
            </DocSection>

            <DocSection title="Install via Bun">
                <p>Clone the repository and install dependencies with Bun:</p>
                <CodeBlock language="bash">
{`git clone https://github.com/your-org/yasp-monorepo.git
cd yasp-monorepo
bun install`}
                </CodeBlock>
                <p>Start the development server:</p>
                <CodeBlock language="bash">bun dev</CodeBlock>
            </DocSection>

            <DocSection title="Install via npm">
                <CodeBlock language="bash">
{`git clone https://github.com/your-org/yasp-monorepo.git
cd yasp-monorepo
npm install
npm run dev`}
                </CodeBlock>
                <Callout variant="info">
                    We recommend Bun for faster installs and better monorepo performance.
                </Callout>
            </DocSection>

            <DocSection title="Environment Variables">
                <p>Copy the example env file and configure your values:</p>
                <CodeBlock language="bash">cp .env.example .env</CodeBlock>
                <CodeBlock language="bash" filename=".env">
{`# Required for the Join Beta email capture
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx`}
                </CodeBlock>
                <Callout variant="warning" title="Keep secrets out of source control">
                    Never commit your <code>.env</code> file. It is already listed in <code>.gitignore</code>.
                </Callout>
            </DocSection>
        </>
    );
}
