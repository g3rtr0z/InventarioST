import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import ItemPDFViewer from './components/ItemPDFViewer.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/item/:id" element={<ItemPDFViewer />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
