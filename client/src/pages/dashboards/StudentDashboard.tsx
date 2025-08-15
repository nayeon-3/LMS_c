import React, { useEffect, useState } from 'react';
import { Typography, Container, Box, Button, Stack, Alert, CircularProgress, Paper, Divider, Avatar, Tabs, Tab } from '@mui/material';
import { useAuthStore } from '../../store/auth';


type Test = {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
};
type TestResult = {
  testId: string;
  score: number;
  total: number;
  answers: { question: string; correct: boolean; explanation?: string; feedback?: string }[];
  submittedAt: string;
};

function StudentDashboard() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [tests, setTests] = useState<Test[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'test' | 'result'>('test');
  // 통계용 데이터 (예시)
  const [stats, setStats] = useState<{ labels: string[]; scores: number[] }>({ labels: [], scores: [] });

  useEffect(() => {
    if (!user || user.role !== 'student') return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch('/api/student/tests').then(r => r.json()),
      fetch('/api/student/results').then(r => r.json())
    ])
      .then(([testData, resultData]) => {
        setTests(testData.items || []);
        setResults(resultData.items || []);
        setStats({
          labels: (resultData.items || []).slice(-5).map((r: any) => r.submittedAt?.slice(0, 10)),
          scores: (resultData.items || []).slice(-5).map((r: any) => r.score)
        });
      })
      .catch(e => setError(e.message || '데이터 불러오기 실패'))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user || user.role !== 'student') {
    return (
      <Container maxWidth="sm" sx={{ pt: 8 }}>
        <Alert severity="error">학생 계정으로 로그인해야 합니다.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ pt: 4, pb: 8 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? <CircularProgress /> : (
        <Stack direction="row" spacing={4} alignItems="flex-start">
          {/* 왼쪽: 프로필 + 네비 */}
          <Box sx={{ minWidth: 280, maxWidth: 320 }}>
            <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
              <Avatar src="https://i.ibb.co/6bQ7QpP/hello-kitty.png" sx={{ width: 80, height: 80, mx: 'auto', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{user.username}</Typography>
              <Typography color="text.secondary" fontSize={14} sx={{ mb: 1 }}>학생</Typography>
              <Button variant="outlined" size="small" onClick={logout} sx={{ mt: 1 }}>로그아웃</Button>
            </Paper>
            <Paper sx={{ p: 2 }}>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                orientation="vertical"
                variant="fullWidth"
                sx={{ minHeight: 120 }}
                TabIndicatorProps={{ style: { left: 0 } }}
              >
                <Tab label="테스트" value="test" sx={{ alignItems: 'flex-start' }} />
                <Tab label="결과" value="result" sx={{ alignItems: 'flex-start' }} />
              </Tabs>
            </Paper>
          </Box>
          {/* 중앙: 테스트/결과 */}
          <Box sx={{ flex: 2, minWidth: 0 }}>
            {tab === 'test' && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>온라인 테스트</Typography>
                {tests.length === 0 ? (
                  <Typography color="text.secondary">응시 가능한 테스트가 없습니다.</Typography>
                ) : (
                  <Stack spacing={1}>
                    {tests.map(test => (
                      <Box key={test.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography>{test.title}</Typography>
                        {test.status === 'completed' ? (
                          <Button variant="outlined" size="small" disabled>응시 완료</Button>
                        ) : (
                          <Button variant="contained" size="small">응시하기</Button>
                        )}
                      </Box>
                    ))}
                  </Stack>
                )}
              </Paper>
            )}
            {tab === 'result' && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>최근 결과</Typography>
                {results.length === 0 ? (
                  <Typography color="text.secondary">결과 데이터가 없습니다.</Typography>
                ) : (
                  <Stack spacing={2}>
                    {results.slice(0, 3).map(r => (
                      <Box key={r.testId}>
                        <Typography variant="subtitle2">테스트: {r.testId} | 점수: {r.score} / {r.total} | 제출일: {r.submittedAt?.slice(0, 10)}</Typography>
                        <Divider sx={{ my: 1 }} />
                        <Stack spacing={1}>
                          {r.answers.map((a, i) => (
                            <Box key={i} sx={{ pl: 1 }}>
                              <Typography variant="body2">Q{i + 1}. {a.question}</Typography>
                              <Typography color={a.correct ? 'primary' : 'error'}>
                                {a.correct ? '정답' : '오답'}
                              </Typography>
                              {a.explanation && <Typography color="text.secondary">해설: {a.explanation}</Typography>}
                              {a.feedback && <Typography color="info.main">LLM 피드백: {a.feedback}</Typography>}
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Paper>
            )}
          </Box>
          {/* 오른쪽: 통계/그래프 */}
          <Box sx={{ flex: 1, minWidth: 260 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>통계 및 분석</Typography>
              {stats.labels.length === 0 ? (
                <Typography color="text.secondary">통계 데이터가 없습니다.</Typography>
              ) : (
                <Box>
                  <Typography variant="body2">최근 점수 추이:</Typography>
                  <Stack direction="row" spacing={2} alignItems="flex-end" sx={{ mt: 1 }}>
                    {stats.scores.map((score, idx) => (
                      <Box key={idx} sx={{ width: 40, height: score * 2, bgcolor: 'primary.main', color: '#fff', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderRadius: 1 }}>
                        <span>{score}</span>
                      </Box>
                    ))}
                  </Stack>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    {stats.labels.map((label, idx) => (
                      <Box key={idx} sx={{ width: 40, textAlign: 'center' }}>
                        <Typography variant="caption">{label}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Paper>
          </Box>
        </Stack>
      )}
    </Container>
  );
}

export default StudentDashboard;


