import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
    <div className="container-center">
      <div className="auth-card">
        <header style={{marginBottom:12}}>
          <h2 style={{margin:0,fontSize:24}}>Create account</h2>
          <p style={{color:'var(--muted)',marginTop:6,marginBottom:0}}>Start a free account for BDE Chat</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Full name</label>
            <Input value={name} onChange={e=>setName(e.target.value)} type="text" placeholder="Your name" />
          </div>

          <div className="form-field">
            <label>Email</label>
            <Input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@company.com" />
          </div>

          <div className="form-field">
            <label>Password</label>
            <Input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Choose a password" />
          </div>

          <div className="form-actions">
            <Button type="submit">Create account</Button>
            <Button variant="outline" type="button" onClick={()=>{setName('');setEmail('');setPassword('')}}>Clear</Button>
          </div>
        </form>

        <div className="links-row">
          <small>Already have an account? <Link to="/login">Sign in</Link></small>
        </div>
      </div>
    </div>
  )
}
