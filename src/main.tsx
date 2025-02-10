import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {Analytics} from "@vercel/analytics/react";
import {ThemeProvider} from "@/context/context.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider>

            <App/>
            <Analytics/>
        </ThemeProvider>
    </StrictMode>,
)
