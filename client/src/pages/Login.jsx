import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e){
    e.preventDefault()
    // placeholder - integrate real auth later
    console.log('login', {email, password})
    navigate('/chat')
  }

  return (
    <div className="auth-card">
      <h2>Welcome back</h2>
      <p style={{color:'#9fb6dc',marginTop:6,marginBottom:18}}>Sign in to your account to continue to BDE Chat</p>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@company.com" />
        </div>
        <div className="form-field">
          <label>Password</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="••••••••" />
        </div>
        <div className="form-actions">
          <button className="btn" type="submit">Sign in</button>
          <button type="button" className="btn secondary" onClick={()=>{setEmail('');setPassword('')}}>Clear</button>
        </div>
      </form>
      <div className="links-row">
        <small>New here? <Link to="/signup">Create an account</Link></small>
      </div>
    </div>
  )
}
