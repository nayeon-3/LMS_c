import React, { useEffect, useMemo, useState } from 'react';
import { Container, Typography, Tabs, Tab, Box, Stack, TextField, Button, Divider, IconButton, Alert, Checkbox, FormControlLabel } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuthStore } from '../../store/auth';

type Student = { id: string; name: string; email?: string; classroom?: string };
type Teacher = { id: string; name: string; email?: string };
type Course = { code: string; title: string; description?: string; teacherId?: string };
type Topic = { id: string; courseCode: string; name: string; description?: string };
type Admin = { id: string; username: string; email?: string };
type Settings = { siteTitle: string; allowSelfSignup: boolean; announcement: string };
type Metrics = { now: string; uptimeSec: number; memory: { rss: number; heapTotal: number; heapUsed: number; external: number }; counts: Record<string, number> };

type Question = { id: string; type: string; difficulty: string; topicId: string; text: string; choices?: string[]; answer?: string; explanation?: string };
type TabKey = 'admins' | 'students' | 'teachers' | 'courses' | 'topics' | 'questions' | 'settings';

function useApi() {
  const token = useAuthStore((s) => s.token);
	const baseUrl = useMemo(() => {
		const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
		const normalizedBase = base.replace(/\/+$/, '');
		return normalizedBase.endsWith('/api') ? normalizedBase : `${normalizedBase}/api`;
	}, []);

  async function request(path: string, options?: RequestInit) {
		const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
        ...(options && options.headers ? options.headers : {}),
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({} as any));
      throw new Error(body?.message || '요청 실패');
    }
    return res.json();
  }

  return { request };
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
      <Typography variant="h5">{title}</Typography>
    </Stack>
  );
}

function AdminsPanel() {
  const { request } = useApi();
  const [items, setItems] = useState<Admin[]>([]);
  const [form, setForm] = useState<Admin>({ id: '', username: '', email: '' });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await request('/admin/admins');
    setItems(data.items || []);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function save() {
    setError(null);
    await request('/admin/admins', { method: 'POST', body: JSON.stringify(form) });
    setForm({ id: '', username: '', email: '' });
    await load();
  }

  async function remove(id: string) {
    setError(null);
    await request(`/admin/admins/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await load();
  }

  return (
    <Stack spacing={3}>
      <SectionHeader title="관리자 계정 관리" />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField label="관리자ID" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
        <TextField label="이름(표시명)" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <TextField label="이메일" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Button variant="contained" onClick={save}>추가/수정</Button>
      </Stack>
      <Divider />
      <Stack spacing={1}>
        {items.map((a) => (
          <Stack key={a.id} direction="row" alignItems="center" spacing={2}>
            <Box sx={{ width: 160 }}><Typography variant="body2">{a.id}</Typography></Box>
            <Box sx={{ flex: 1 }}><Typography>{a.username}</Typography></Box>
            <Box sx={{ width: 220 }}><Typography variant="body2">{a.email}</Typography></Box>
            <IconButton aria-label="delete" color="error" onClick={() => remove(a.id)}>
              <DeleteIcon />
            </IconButton>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

function StudentsPanel() {
  const { request } = useApi();
  const [items, setItems] = useState<Student[]>([]);
  const [form, setForm] = useState<Student>({ id: '', name: '', email: '', classroom: '' });
  const [error, setError] = useState<string | null>(null);

	async function load() {
		const data = await request('/admin/students');
    setItems(data.items || []);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

	async function save() {
    setError(null);
		await request('/admin/students', { method: 'POST', body: JSON.stringify(form) });
    setForm({ id: '', name: '', email: '', classroom: '' });
    await load();
  }

	async function remove(id: string) {
    setError(null);
		await request(`/admin/students/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await load();
  }

  return (
    <Stack spacing={3}>
      <SectionHeader title="학생 관리" />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField label="학번(id)" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
        <TextField label="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <TextField label="이메일" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <TextField label="반" value={form.classroom} onChange={(e) => setForm({ ...form, classroom: e.target.value })} />
        <Button variant="contained" onClick={save}>추가/수정</Button>
      </Stack>
      <Divider />
      <Stack spacing={1}>
        {items.map((s) => (
          <Stack key={s.id} direction="row" alignItems="center" spacing={2}>
            <Box sx={{ width: 120 }}><Typography variant="body2">{s.id}</Typography></Box>
            <Box sx={{ flex: 1 }}><Typography>{s.name}</Typography></Box>
            <Box sx={{ width: 220 }}><Typography variant="body2">{s.email}</Typography></Box>
            <Box sx={{ width: 100 }}><Typography variant="body2">{s.classroom}</Typography></Box>
            <IconButton aria-label="delete" color="error" onClick={() => remove(s.id)}>
              <DeleteIcon />
            </IconButton>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

function TeachersPanel() {
  const { request } = useApi();
  const [items, setItems] = useState<Teacher[]>([]);
  const [form, setForm] = useState<Teacher>({ id: '', name: '', email: '' });
  const [error, setError] = useState<string | null>(null);

	async function load() {
		const data = await request('/admin/teachers');
    setItems(data.items || []);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

	async function save() {
    setError(null);
		await request('/admin/teachers', { method: 'POST', body: JSON.stringify(form) });
    setForm({ id: '', name: '', email: '' });
    await load();
  }

	async function remove(id: string) {
    setError(null);
		await request(`/admin/teachers/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await load();
  }

  return (
    <Stack spacing={3}>
      <SectionHeader title="강사 관리" />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField label="강사ID" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
        <TextField label="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <TextField label="이메일" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Button variant="contained" onClick={save}>추가/수정</Button>
      </Stack>
      <Divider />
      <Stack spacing={1}>
        {items.map((t) => (
          <Stack key={t.id} direction="row" alignItems="center" spacing={2}>
            <Box sx={{ width: 120 }}><Typography variant="body2">{t.id}</Typography></Box>
            <Box sx={{ flex: 1 }}><Typography>{t.name}</Typography></Box>
            <Box sx={{ width: 220 }}><Typography variant="body2">{t.email}</Typography></Box>
            <IconButton aria-label="delete" color="error" onClick={() => remove(t.id)}>
              <DeleteIcon />
            </IconButton>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

function CoursesPanel() {
  const { request } = useApi();
  const [items, setItems] = useState<Course[]>([]);
  const [form, setForm] = useState<Course>({ code: '', title: '', description: '', teacherId: '' });
  const [error, setError] = useState<string | null>(null);

	async function load() {
		const data = await request('/admin/courses');
    setItems(data.items || []);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

	async function save() {
    setError(null);
		await request('/admin/courses', { method: 'POST', body: JSON.stringify(form) });
    setForm({ code: '', title: '', description: '', teacherId: '' });
    await load();
  }

	async function remove(code: string) {
    setError(null);
		await request(`/admin/courses/${encodeURIComponent(code)}`, { method: 'DELETE' });
    await load();
  }

  return (
    <Stack spacing={3}>
      <SectionHeader title="과목 관리" />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField label="과목코드" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <TextField label="과목명" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <TextField label="담당강사ID" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} />
      </Stack>
      <TextField label="설명" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline minRows={2} />
      <Button variant="contained" onClick={save}>추가/수정</Button>
      <Divider />
      <Stack spacing={1}>
        {items.map((c) => (
          <Stack key={c.code} direction="row" alignItems="center" spacing={2}>
            <Box sx={{ width: 120 }}><Typography variant="body2">{c.code}</Typography></Box>
            <Box sx={{ flex: 1 }}><Typography>{c.title}</Typography></Box>
            <Box sx={{ width: 160 }}><Typography variant="body2">강사: {c.teacherId}</Typography></Box>
            <IconButton aria-label="delete" color="error" onClick={() => remove(c.code)}>
              <DeleteIcon />
            </IconButton>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

function TopicsPanel() {
  const { request } = useApi();
  const [items, setItems] = useState<Topic[]>([]);
  const [form, setForm] = useState<Topic>({ id: '', courseCode: '', name: '', description: '' });
  const [error, setError] = useState<string | null>(null);

	async function load() {
		const data = await request('/admin/topics');
    setItems(data.items || []);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

	async function save() {
    setError(null);
		await request('/admin/topics', { method: 'POST', body: JSON.stringify(form) });
    setForm({ id: '', courseCode: '', name: '', description: '' });
    await load();
  }

	async function remove(id: string) {
    setError(null);
		await request(`/admin/topics/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await load();
  }

  return (
    <Stack spacing={3}>
      <SectionHeader title="주제 관리" />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField label="토픽ID" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
        <TextField label="과목코드" value={form.courseCode} onChange={(e) => setForm({ ...form, courseCode: e.target.value })} />
        <TextField label="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Stack>
      <TextField label="설명" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline minRows={2} />
      <Button variant="contained" onClick={save}>추가/수정</Button>
      <Divider />
      <Stack spacing={1}>
        {items.map((t) => (
          <Stack key={t.id} direction="row" alignItems="center" spacing={2}>
            <Box sx={{ width: 160 }}><Typography variant="body2">{t.id}</Typography></Box>
            <Box sx={{ width: 120 }}><Typography variant="body2">{t.courseCode}</Typography></Box>
            <Box sx={{ flex: 1 }}><Typography>{t.name}</Typography></Box>
            <IconButton aria-label="delete" color="error" onClick={() => remove(t.id)}>
              <DeleteIcon />
            </IconButton>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

function QuestionsPanel() {
  const { request } = useApi();
  const [items, setItems] = useState<Question[]>([]);
  const [form, setForm] = useState<Question>({ id: '', type: 'mcq', difficulty: '중', topicId: '', text: '', choices: ['', '', '', ''], answer: '', explanation: '' });
  const [error, setError] = useState<string | null>(null);

	async function load() {
		const data = await request('/admin/questions');
    setItems(data.items || []);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

	async function save() {
    setError(null);
		await request('/admin/questions', { method: 'POST', body: JSON.stringify(form) });
    setForm({ id: '', type: 'mcq', difficulty: '중', topicId: '', text: '', choices: ['', '', '', ''], answer: '', explanation: '' });
    await load();
  }

	async function remove(id: string) {
    setError(null);
		await request(`/admin/questions/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await load();
  }

  return (
    <Stack spacing={3}>
      <SectionHeader title="문제은행" />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="문항ID" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
          <TextField label="유형" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <TextField label="난이도" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} />
          <TextField label="토픽ID" value={form.topicId} onChange={(e) => setForm({ ...form, topicId: e.target.value })} />
        </Stack>
        <TextField label="문항 본문" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} multiline minRows={2} />
        {form.type === 'mcq' && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {(form.choices || []).map((c, idx) => (
              <TextField key={idx} label={`선택지 ${idx + 1}`} value={c} onChange={(e) => {
                const next = [...(form.choices || [])];
                next[idx] = e.target.value;
                setForm({ ...form, choices: next });
              }} />
            ))}
          </Stack>
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="정답" value={form.answer || ''} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
          <TextField label="해설" value={form.explanation || ''} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
        </Stack>
        <Button variant="contained" onClick={save}>추가/수정</Button>
      </Stack>
      <Divider />
      <Stack spacing={1}>
        {items.map((q) => (
          <Stack key={q.id} direction="row" alignItems="center" spacing={2}>
            <Box sx={{ width: 120 }}><Typography variant="body2">{q.id}</Typography></Box>
            <Box sx={{ width: 80 }}><Typography variant="body2">{q.type}</Typography></Box>
            <Box sx={{ width: 80 }}><Typography variant="body2">{q.difficulty}</Typography></Box>
            <Box sx={{ width: 120 }}><Typography variant="body2">{q.topicId}</Typography></Box>
            <Box sx={{ flex: 1 }}><Typography noWrap title={q.text}>{q.text}</Typography></Box>
            <IconButton aria-label="delete" color="error" onClick={() => remove(q.id)}>
              <DeleteIcon />
            </IconButton>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

function SettingsPanel() {
  const { request } = useApi();
  const [settings, setSettings] = useState<Settings>({ siteTitle: '', allowSelfSignup: false, announcement: '' });
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    const [s, m] = await Promise.all([
      request('/admin/settings'),
      request('/admin/metrics'),
    ]);
    setSettings(s);
    setMetrics(m);
  }

  useEffect(() => {
    loadAll().catch((e) => setError(e.message));
  }, []);

  async function save() {
    setError(null);
    const next = await request('/admin/settings', { method: 'POST', body: JSON.stringify(settings) });
    setSettings(next);
  }

  async function refreshMetrics() {
    setError(null);
    const m = await request('/admin/metrics');
    setMetrics(m);
  }

  return (
    <Stack spacing={3}>
      <SectionHeader title="시스템 설정 및 모니터링" />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Stack spacing={2}>
        <TextField label="사이트 제목" value={settings.siteTitle} onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })} />
        <FormControlLabel
          control={<Checkbox checked={settings.allowSelfSignup} onChange={(e) => setSettings({ ...settings, allowSelfSignup: e.target.checked })} />}
          label="사용자 자가 회원가입 허용"
        />
        <TextField label="공지사항" value={settings.announcement} onChange={(e) => setSettings({ ...settings, announcement: e.target.value })} multiline minRows={2} />
        <Button variant="contained" onClick={save}>설정 저장</Button>
      </Stack>
      <Divider />
      <Stack spacing={1}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
          <Box>
            <Typography variant="subtitle2">서버 시간</Typography>
            <Typography variant="body2">{metrics?.now || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">업타임(초)</Typography>
            <Typography variant="body2">{metrics?.uptimeSec ?? '-'}</Typography>
          </Box>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
          <Box>
            <Typography variant="subtitle2">메모리(RSS)</Typography>
            <Typography variant="body2">{metrics ? metrics.memory.rss : '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Heap Used/Total</Typography>
            <Typography variant="body2">{metrics ? `${metrics.memory.heapUsed} / ${metrics.memory.heapTotal}` : '-'}</Typography>
          </Box>
        </Stack>
        <Stack>
          <Typography variant="subtitle2">엔티티 개수</Typography>
          <Typography variant="body2">{metrics ? Object.entries(metrics.counts).map(([k, v]) => `${k}: ${v}`).join(', ') : '-'}</Typography>
        </Stack>
        <Button variant="outlined" onClick={refreshMetrics}>메트릭 새로고침</Button>
      </Stack>
    </Stack>
  );
}
function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [tab, setTab] = useState<TabKey>('students');

  return (
    <Container maxWidth="lg" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
      <Typography variant="h4">관리자 대시보드</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2">{user?.username}</Typography>
          <Button variant="outlined" onClick={logout}>로그아웃</Button>
        </Stack>
      </Stack>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="관리자" value="admins" />
          <Tab label="학생" value="students" />
          <Tab label="강사" value="teachers" />
          <Tab label="과목" value="courses" />
          <Tab label="주제" value="topics" />
          <Tab label="문제은행" value="questions" />
          <Tab label="설정/모니터" value="settings" />
        </Tabs>
      </Box>
      {tab === 'admins' && <AdminsPanel />}
      {tab === 'students' && <StudentsPanel />}
      {tab === 'teachers' && <TeachersPanel />}
      {tab === 'courses' && <CoursesPanel />}
      {tab === 'topics' && <TopicsPanel />}
      {tab === 'questions' && <QuestionsPanel />}
      {tab === 'settings' && <SettingsPanel />}
    </Container>
  );
}

export default AdminDashboard;


