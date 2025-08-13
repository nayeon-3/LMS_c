const express = require('express');
const { verifyJwt, requireRole } = require('../middleware/auth');

// 메모리 기반 간단 저장소 (데모용)
const state = {
  students: [
    { id: 'S001', name: '홍길동', email: 'hong@example.com', classroom: '1-1' },
  ],
  teachers: [
    { id: 'T001', name: '김선생', email: 'kim@example.com' },
  ],
  courses: [
    { code: 'CS101', title: '컴퓨터개론', description: '기초 과목', teacherId: 'T001' },
  ],
  topics: [
    { id: 'TOP-1', courseCode: 'CS101', name: '자료구조 개요', description: '리스트, 스택, 큐' },
  ],
  questions: [
    {
      id: 'Q-1',
      type: 'mcq',
      difficulty: '중',
      topicId: 'TOP-1',
      text: '스택의 특징으로 올바른 것은?',
      choices: ['FIFO', 'LIFO', '랜덤', '정렬됨'],
      answer: 'LIFO',
      explanation: '스택은 후입선출(LIFO) 구조입니다.',
    },
  ],
};

const router = express.Router();

// 인증/권한
router.use(verifyJwt, requireRole('admin'));

// 유틸: CRUD 헬퍼
function upsert(list, predicate, newItem) {
  const index = list.findIndex(predicate);
  if (index >= 0) {
    list[index] = { ...list[index], ...newItem };
    return list[index];
  }
  list.push(newItem);
  return newItem;
}

function removeWhere(list, predicate) {
  const index = list.findIndex(predicate);
  if (index >= 0) list.splice(index, 1);
  return index >= 0;
}

// 학생 관리
router.get('/students', (req, res) => {
  res.json({ items: state.students });
});

router.post('/students', (req, res) => {
  const { id, name, email, classroom } = req.body || {};
  if (!id || !name) return res.status(400).json({ message: 'id와 name은 필수입니다.' });
  const created = upsert(state.students, (s) => s.id === id, { id, name, email, classroom });
  res.status(201).json(created);
});

router.delete('/students/:id', (req, res) => {
  const ok = removeWhere(state.students, (s) => s.id === req.params.id);
  return ok ? res.json({ ok: true }) : res.status(404).json({ message: '존재하지 않습니다.' });
});

// 강사 관리
router.get('/teachers', (req, res) => {
  res.json({ items: state.teachers });
});

router.post('/teachers', (req, res) => {
  const { id, name, email } = req.body || {};
  if (!id || !name) return res.status(400).json({ message: 'id와 name은 필수입니다.' });
  const created = upsert(state.teachers, (t) => t.id === id, { id, name, email });
  res.status(201).json(created);
});

router.delete('/teachers/:id', (req, res) => {
  const ok = removeWhere(state.teachers, (t) => t.id === req.params.id);
  return ok ? res.json({ ok: true }) : res.status(404).json({ message: '존재하지 않습니다.' });
});

// 과목 관리
router.get('/courses', (req, res) => {
  res.json({ items: state.courses });
});

router.post('/courses', (req, res) => {
  const { code, title, description, teacherId } = req.body || {};
  if (!code || !title) return res.status(400).json({ message: 'code와 title은 필수입니다.' });
  const created = upsert(state.courses, (c) => c.code === code, { code, title, description, teacherId });
  res.status(201).json(created);
});

router.delete('/courses/:code', (req, res) => {
  const ok = removeWhere(state.courses, (c) => c.code === req.params.code);
  return ok ? res.json({ ok: true }) : res.status(404).json({ message: '존재하지 않습니다.' });
});

// 주제 관리
router.get('/topics', (req, res) => {
  res.json({ items: state.topics });
});

router.post('/topics', (req, res) => {
  const { id, courseCode, name, description } = req.body || {};
  if (!id || !courseCode || !name) return res.status(400).json({ message: 'id, courseCode, name은 필수입니다.' });
  const created = upsert(state.topics, (t) => t.id === id, { id, courseCode, name, description });
  res.status(201).json(created);
});

router.delete('/topics/:id', (req, res) => {
  const ok = removeWhere(state.topics, (t) => t.id === req.params.id);
  return ok ? res.json({ ok: true }) : res.status(404).json({ message: '존재하지 않습니다.' });
});

module.exports = router;

// 문제은행 관리
router.get('/questions', (req, res) => {
  res.json({ items: state.questions });
});

router.post('/questions', (req, res) => {
  const { id, type, difficulty, topicId, text, choices, answer, explanation } = req.body || {};
  if (!id || !type || !difficulty || !topicId || !text) {
    return res.status(400).json({ message: 'id, type, difficulty, topicId, text는 필수입니다.' });
  }
  const created = upsert(
    state.questions,
    (q) => q.id === id,
    { id, type, difficulty, topicId, text, choices, answer, explanation }
  );
  res.status(201).json(created);
});

router.delete('/questions/:id', (req, res) => {
  const ok = removeWhere(state.questions, (q) => q.id === req.params.id);
  return ok ? res.json({ ok: true }) : res.status(404).json({ message: '존재하지 않습니다.' });
});


