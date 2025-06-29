import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {BrowserRouter, Route, Routes} from 'react-router'
import LandingPage from "./App";

import {DirectoryPage} from "@/features/directory/DirectoryPage";
import {SpecPage} from "@/features/spec-page/SpecPage";
import {Toaster} from "@/core/components/ui/sonner";
import {SpecProvider} from "@/core/context/spec-context.tsx";
import {ThemeProvider} from "next-themes";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <Toaster/>

                <Routes>
                    <Route path="/" element={<LandingPage/>}/>
                    <Route path="/directory" element={<DirectoryPage/>}/>

                    <Route path="spec">
                        <Route index path=":id" element={<SpecProvider><SpecPage/></SpecProvider>}/>
                    </Route>
                </Routes>
            </ThemeProvider>
        </BrowserRouter>
    </StrictMode>,
)
