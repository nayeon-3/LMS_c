import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

function Home() {
  const navigate = useNavigate();
  return (
    <Container maxWidth="sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Stack spacing={3} alignItems="stretch" style={{ width: '100%' }}>
        <Typography variant="h4" align="center">LMS - 사용자 선택</Typography>
        <Button variant="contained" size="large" onClick={() => navigate('/login/admin')}>관리자 로그인</Button>
        <Button variant="contained" size="large" onClick={() => navigate('/login/teacher')}>교사 로그인</Button>
        <Button variant="contained" size="large" onClick={() => navigate('/login/student')}>학생 로그인</Button>
      </Stack>
    </Container>
  );
}

export default Home;


