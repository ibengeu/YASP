import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import {DirectoryPage} from '@/components/directory'
import {SpecPage} from "@/components/swagger/spec-page"
import {RootLayout} from "@/components/layout.tsx";
import {CreateSpecPage} from "@/components/swagger/create-spec.tsx";


function App() {
    return (
        <Router>
            <Routes>
                <Route element={<RootLayout/>}>
                    <Route path="/" element={<DirectoryPage/>}/>
                    <Route path="/new" element={<CreateSpecPage/>}/>
                    <Route path="/spec/:id" element={<SpecPage/>}/>
                </Route>
            </Routes>
        </Router>
    )
}

export default App