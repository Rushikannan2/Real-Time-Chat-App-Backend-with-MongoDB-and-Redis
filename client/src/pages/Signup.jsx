import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/AuthContext';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { signup } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      await signup({ name, email, password });
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during signup.');
    }
  }

  return (
    <div className="container-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Start a free account for BDE Chat</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Your name" />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@company.com" />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Choose a password" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => { setName(''); setEmail(''); setPassword(''); }}>Clear</Button>
          <Button type="submit" onClick={handleSubmit}>Create account</Button>
        </CardFooter>
        <div className="links-row" style={{ padding: '0 24px 16px' }}>
          <small>Already have an account? <Link to="/login">Sign in</Link></small>
        </div>
      </Card>
    </div>
  );
}
