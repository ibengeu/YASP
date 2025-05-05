import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {BrowserRouter, Route, Routes} from 'react-router'
import LandingPage from "./App.tsx";
import {DirectoryPage} from "@/routes/directory/directory.tsx";
import {SpecPage} from "@/routes/spec-page/spec-page.tsx";
import {Toaster} from "@/components/ui/sonner.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <Toaster/>

            <Routes>
                <Route path="/" element={<LandingPage/>}/>
                <Route path="/app" element={<DirectoryPage/>}/>

                <Route path="spec">
                    <Route index path=":id" element={<SpecPage/>}/>
                </Route>
            </Routes>
        </BrowserRouter>
    </StrictMode>,
)
