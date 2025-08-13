import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, Stack, Typography, Container, Alert } from '@mui/material';
import { useAuthStore } from '../store/auth';

type RoleParam = 'admin' | 'teacher' | 'student';

function LoginPage() {
  const navigate = useNavigate();
  const params = useParams();
  const role = (params.role as RoleParam) || 'student';
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ id, password, role });
      if (role === 'admin') navigate('/admin');
      else if (role === 'teacher') navigate('/teacher');
      else navigate('/student');
    } catch (err: any) {
      setError(err?.message || '로그인에 실패했습니다.');
    }
  };

  return (
    <Container maxWidth="sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <Stack spacing={3}>
          <Typography variant="h5" align="center">{role.toUpperCase()} 로그인</Typography>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField label="아이디" value={id} onChange={(e) => setId(e.target.value)} required />
          <TextField type="password" label="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" variant="contained" size="large">로그인</Button>
        </Stack>
      </form>
    </Container>
  );
}

export default LoginPage;


