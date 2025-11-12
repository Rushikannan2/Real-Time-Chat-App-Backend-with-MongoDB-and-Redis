import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
    <div className="container-center">
      <div className="auth-card">
        <header style={{marginBottom:12}}>
          <h2 style={{margin:0,fontSize:24}}>Welcome back</h2>
          <p style={{color:'var(--muted)',marginTop:6,marginBottom:0}}>Sign in to your account to continue to BDE Chat</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Email</label>
            <Input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@company.com" />
          </div>

          <div className="form-field">
            <label>Password</label>
            <Input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="••••••••" />
          </div>

          <div className="form-actions">
            <Button type="submit">Sign in</Button>
            <Button variant="outline" type="button" onClick={()=>{setEmail('');setPassword('')}}>Clear</Button>
          </div>
        </form>

        <div className="links-row">
          <small>New here? <Link to="/signup">Create an account</Link></small>
        </div>
      </div>
    </div>
  )
}
