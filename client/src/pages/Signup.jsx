import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Signup(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e){
    e.preventDefault()
    // placeholder - integrate real signup later
    console.log('signup', {name,email,password})
    navigate('/chat')
  }

  return (
    <div className="auth-card">
      <h2>Create account</h2>
      <p style={{color:'#9fb6dc',marginTop:6,marginBottom:18}}>Start a free account for BDE Chat</p>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Full name</label>
          <input value={name} onChange={e=>setName(e.target.value)} type="text" placeholder="Your name" />
        </div>
        <div className="form-field">
          <label>Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@company.com" />
        </div>
        <div className="form-field">
          <label>Password</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Choose a password" />
        </div>
        <div className="form-actions">
          <button className="btn" type="submit">Create account</button>
          <button type="button" className="btn secondary" onClick={()=>{setName('');setEmail('');setPassword('')}}>Clear</button>
        </div>
      </form>
      <div className="links-row">
        <small>Already have an account? <Link to="/login">Sign in</Link></small>
      </div>
    </div>
  )
}
