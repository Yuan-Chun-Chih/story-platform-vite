// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// [新增] 引入 BrowserRouter
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* [新增] 包裹 App */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)