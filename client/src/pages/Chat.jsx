import { Link } from 'react-router-dom'

export default function Chat(){
  return (
    <div>
      <div className="auth-card" style={{maxWidth:'980px'}}>
        <h2>Chat</h2>
        <p style={{color:'#9fb6dc'}}>This is a placeholder Chat page. Integrate real-time messaging with sockets/redis next.</p>
        <div style={{marginTop:16}}>
          <div style={{background:'#071226',padding:12,borderRadius:8,color:'#cfe6ff'}}>Welcome to the chat room. Messages will appear here.</div>
        </div>
        <div style={{marginTop:18}}>
          <Link to="/login" className="btn secondary">Logout</Link>
        </div>
      </div>
    </div>
  )
}
