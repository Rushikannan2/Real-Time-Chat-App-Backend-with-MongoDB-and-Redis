import { Link, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Chat from './pages/Chat'

function App() {
  return (
    <div id="app-root">
      <nav className="top-nav">
        <div className="nav-inner">
          <div className="brand">BDE Chat</div>
          <div className="nav-links">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="nav-link">Signup</Link>
            <Link to="/chat" className="nav-link primary">Chat</Link>
          </div>
        </div>
      </nav>

      <main className="main-area">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="*" element={<div className="not-found">Page not found</div>} />
        </Routes>
      </main>
    </div>
  )
}

export default App
