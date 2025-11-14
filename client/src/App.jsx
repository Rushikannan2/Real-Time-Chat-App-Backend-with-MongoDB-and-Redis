import { Link, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Chat from './pages/Chat';
import { useAuth } from './lib/AuthContext';
import { Button } from './components/ui/button';

function App() {
  const { isAuthenticated, logout, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return (
    <div id="app-root">
      <nav className="top-nav">
        <div className="nav-inner">
          <div className="brand">BDE Chat</div>
          <div className="nav-links">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/signup" className="nav-link">Signup</Link>
              </>
            ) : (
              <>
                <Link to="/chat" className="nav-link primary">Chat</Link>
                <Button variant="ghost" onClick={logout}>Logout</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="main-area">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/chat" /> : <Navigate to="/login" />} />
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/chat" />} />
          <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/chat" />} />
          <Route path="/chat" element={isAuthenticated ? <Chat /> : <Navigate to="/login" />} />
          <Route path="*" element={<div className="not-found">Page not found</div>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
