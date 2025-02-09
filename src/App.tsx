import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { DirectoryPage } from '@/components/directory'
import {SpecPage} from "@/components/swagger/spec-page.tsx";
import {SwaggerInput} from "@/components/swagger/swagger-input.tsx";


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<DirectoryPage />} />
                <Route path="/new" element={<SwaggerInput />} />
                <Route path="/spec/:id" element={<SpecPage />} />
            </Routes>
        </Router>
    )
}

export default App