const express = require('express');
const { verifyJwt, requireRole } = require('../middleware/auth');
const { connectDB: connectPostgres, query: pgQuery } = require('../config/database');
const { connectMongoDB, isConnected: isMongoConnected } = require('../config/mongodb');
const bcrypt = require('bcryptjs');

// 설정은 일단 메모리 보관 (DB 스키마에 설정 테이블이 없다면 유지)
const settings = {
  siteTitle: 'LMS 시스템',
  allowSelfSignup: false,
  announcement: '',
};

const router = express.Router();

// 인증/권한
router.use(verifyJwt, requireRole('admin'));

// 데이터 소스 선택: mongo | postgres | auto(기본)
function getDataSource() {
  const env = (process.env.DATA_SOURCE || process.env.AUTH_SOURCE || '').toLowerCase();
  if (env.includes('mongo')) return 'mongo';
  if (env.includes('postg') || env === 'pg') return 'postgres';
  return 'auto';
}

async function upsertAdminMongo({ id, username, email, password }) {
  const conn = await ensureMongo();
  const col = conn.collection('users');
  const login = username || id;
  if (!login) throw new Error('username 또는 id 필요');
  const update = { $set: { username: login, email, role: 'admin' } };
  if (password) {
    const hash = password.startsWith('$2') ? password : await bcrypt.hash(password, 10);
    update.$set.password = hash;
  }
  await col.updateOne({ username: login }, update, { upsert: true });
  return { id: login, username: login, email };
}

async function upsertAdminPostgres({ id, username, email, password }) {
  await connectPostgres();
  // role_id 조회 (admin)
  const roleRes = await pgQuery("SELECT role_id FROM roles WHERE name = 'admin' LIMIT 1");
  if (!roleRes.rows.length) throw new Error('roles 테이블에 admin 역할이 없습니다.');
  const roleId = roleRes.rows[0].role_id;
  const loginId = id || username;
  if (!loginId) throw new Error('id 또는 username이 필요합니다.');
  const hash = password ? (password.startsWith('$2') ? password : await bcrypt.hash(password, 10)) : null;
  const sql = `
    INSERT INTO users (id, email, password, role_id)
    VALUES ($1, $2, COALESCE($3, (SELECT password FROM users WHERE id=$1)), $4)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      password = EXCLUDED.password,
      role_id = EXCLUDED.role_id
  `;
  await pgQuery(sql, [loginId, email || null, hash, roleId]);
  return { id: loginId, username: loginId, email };
}

// ===== 추가 Upsert Helper들 =====
async function upsertTeacherMongo({ id, name, email, password }) {
  const conn = await ensureMongo();
  const col = conn.collection('users');
  const update = { $set: { username: id, role: 'teacher' } };
  if (typeof name !== 'undefined') update.$set.fullName = name;
  if (typeof email !== 'undefined') update.$set.email = email;
  if (password) {
    const hash = password.startsWith('$2') ? password : await bcrypt.hash(password, 10);
    update.$set.password = hash;
  }
  await col.updateOne({ username: id }, update, { upsert: true });
  return { id, name, email };
}

async function upsertTeacherPostgres({ id, name, email, password }) {
  await connectPostgres();
  // role_id 조회 (teacher 우선)
  const roleRes = await pgQuery("SELECT role_id FROM roles WHERE name IN ('teacher','instructor') ORDER BY CASE WHEN name='teacher' THEN 0 ELSE 1 END LIMIT 1");
  if (!roleRes.rows.length) throw new Error('roles 테이블에 teacher/ instructor 역할이 없습니다.');
  const roleId = roleRes.rows[0].role_id;
  const loginId = id || name;
  if (!loginId) throw new Error('id 또는 name이 필요합니다.');
  const hash = password ? (password.startsWith('$2') ? password : await bcrypt.hash(password, 10)) : null;
  const sql = `
    INSERT INTO users (id, name, email, password, role_id)
    VALUES ($1, $2, $3, COALESCE($4, (SELECT password FROM users WHERE id=$1)), $5)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      password = EXCLUDED.password,
      role_id = EXCLUDED.role_id
  `;
  await pgQuery(sql, [loginId, name || null, email || null, hash, roleId]);
  return { id: loginId, name: name || loginId, email };
}

async function upsertCourseMongo({ code, title, description, teacherId }) {
  const conn = await ensureMongo();
  const col = conn.collection('courses');
  const { Types } = require('mongoose');
  const set = { code, name: title, description };
  if (teacherId && Types.ObjectId.isValid(teacherId)) set.teacherId = Types.ObjectId(teacherId);
  await col.updateOne({ code }, { $set: set }, { upsert: true });
  return { code, title, description, teacherId };
}

async function upsertCoursePostgres({ code, title, description, teacherId }) {
  await connectPostgres();
  const sql = `
    INSERT INTO courses (code, name, description, teacher_id)
    VALUES ($1, $2, $3, (SELECT user_id FROM users WHERE id = $4))
    ON CONFLICT (code) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      teacher_id = EXCLUDED.teacher_id
  `;
  await pgQuery(sql, [code, title, description || null, teacherId || null]);
  return { code, title, description, teacherId };
}

async function upsertTopicMongo({ id, courseCode, name, description }) {
  const conn = await ensureMongo();
  const courses = conn.collection('courses');
  const topics = conn.collection('topics');
  const course = await courses.findOne({ code: courseCode });
  if (!course) throw new Error('해당 code의 course가 없습니다.');
  const update = { $set: { courseId: course._id, name, description } };
  // 보조 식별자 저장(선택)
  update.$set.legacyId = id;
  await topics.updateOne({ legacyId: id }, update, { upsert: true });
  return { id, courseCode, name, description };
}

async function upsertTopicPostgres({ id, courseCode, name, description }) {
  await connectPostgres();
  const sql = `
    WITH c AS (
      SELECT course_id FROM courses WHERE code = $2
    )
    INSERT INTO topics (topic_id, course_id, name, description)
    VALUES ($1, (SELECT course_id FROM c), $3, $4)
    ON CONFLICT (topic_id) DO UPDATE SET
      course_id = EXCLUDED.course_id,
      name = EXCLUDED.name,
      description = EXCLUDED.description
  `;
  await pgQuery(sql, [id, courseCode, name, description || null]);
  return { id, courseCode, name, description };
}

async function upsertQuestionMongo({ id, type, difficulty, topicId, text, choices, answer, explanation }) {
  const conn = await ensureMongo();
  const col = conn.collection('questionBank');
  const { Types } = require('mongoose');
  if (!Types.ObjectId.isValid(topicId)) throw new Error('MongoDB에서는 topicId가 ObjectId여야 합니다.');
  const update = { $set: { type, difficulty, topicId: Types.ObjectId(topicId), prompt: text, choices, answer, explanation } };
  // 보조 식별자 저장(선택)
  update.$set.legacyId = id;
  await col.updateOne({ legacyId: id }, update, { upsert: true });
  return { id, type, difficulty, topicId, text, choices, answer, explanation };
}

async function upsertQuestionPostgres({ id, type, difficulty, topicId, text, choices, answer, explanation }) {
  await connectPostgres();
  const sql = `
    INSERT INTO question_bank (question_id, type, difficulty, topic_id, prompt, choices, answer, explanation)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (question_id) DO UPDATE SET
      type = EXCLUDED.type,
      difficulty = EXCLUDED.difficulty,
      topic_id = EXCLUDED.topic_id,
      prompt = EXCLUDED.prompt,
      choices = EXCLUDED.choices,
      answer = EXCLUDED.answer,
      explanation = EXCLUDED.explanation
  `;
  await pgQuery(sql, [id, type, difficulty, topicId, text, choices || null, answer || null, explanation || null]);
  return { id, type, difficulty, topicId, text, choices, answer, explanation };
}

async function ensureMongo() {
  if (!isMongoConnected()) {
    await connectMongoDB();
  }
  const mongoose = require('mongoose');
  return mongoose.connection;
}

// ===== 조회 전용 핸들러들 =====
async function listAdminsFromMongo() {
  const conn = await ensureMongo();
  const col = conn.collection('users');
  const docs = await col.find({ role: 'admin' }).project({ password: 0 }).toArray();
  return docs.map(d => ({ id: d.username, username: d.username, email: d.email }));
}

async function listAdminsFromPostgres() {
  await connectPostgres();
  const sql = `
    SELECT u.id AS login_id, u.email
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    WHERE r.name = 'admin'
    ORDER BY u.id
  `;
  const { rows } = await pgQuery(sql);
  return rows.map(r => ({ id: r.login_id, username: r.login_id, email: r.email }));
}

async function listStudentsFromMongo() {
  const conn = await ensureMongo();
  const students = conn.collection('students');
  const users = conn.collection('users');
  const profs = await students.find({}).toArray();
  const userIds = profs.map(p => p.userId).filter(Boolean);
  const userMap = new Map();
  if (userIds.length) {
    const us = await users.find({ _id: { $in: userIds } }).project({ username: 1, email: 1, fullName: 1 }).toArray();
    us.forEach(u => userMap.set(String(u._id), u));
  }
  return profs.map(p => {
    const u = userMap.get(String(p.userId));
    return { id: u?.username, name: u?.fullName, email: u?.email, classroom: p.classGroup };
  });
}

async function listStudentsFromPostgres() {
  await connectPostgres();
  const { rows } = await pgQuery(`
    SELECT u.id AS id, u.name AS name, u.email AS email, s.class_group AS "classroom"
    FROM students s
    JOIN users u ON s.student_id = u.user_id
    ORDER BY u.id
  `);
  return rows;
}

async function listTeachersFromMongo() {
  const conn = await ensureMongo();
  const col = conn.collection('users');
  const docs = await col.find({ role: 'teacher' }).project({ password: 0 }).toArray();
  return docs.map(d => ({ id: d.username, name: d.fullName || d.username, email: d.email }));
}

async function listTeachersFromPostgres() {
  await connectPostgres();
  const sql = `
    SELECT u.id AS id, COALESCE(u.name, u.id) AS name, u.email
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    WHERE r.name IN ('teacher','instructor')
    ORDER BY u.id
  `;
  const { rows } = await pgQuery(sql);
  return rows;
}

async function listCoursesFromMongo() {
  const conn = await ensureMongo();
  const col = conn.collection('courses');
  const docs = await col.find({}).toArray();
  return docs.map(d => ({ code: d.code, title: d.name, description: d.description, teacherId: d.teacherId ? String(d.teacherId) : undefined }));
}

async function listCoursesFromPostgres() {
  await connectPostgres();
  const { rows } = await pgQuery('SELECT code, name AS title, description, teacher_id AS "teacherId" FROM courses ORDER BY code');
  return rows;
}

async function listTopicsFromMongo() {
  const conn = await ensureMongo();
  const topics = conn.collection('topics');
  const courses = conn.collection('courses');
  const docs = await topics.find({}).toArray();
  const courseIds = docs.map(d => d.courseId).filter(Boolean);
  const courseMap = new Map();
  if (courseIds.length) {
    const crs = await courses.find({ _id: { $in: courseIds } }).project({ code: 1 }).toArray();
    crs.forEach(c => courseMap.set(String(c._id), c.code));
  }
  return docs.map(d => ({ id: d.legacyId || String(d._id), courseCode: courseMap.get(String(d.courseId)) || undefined, name: d.name, description: d.description }));
}

async function listTopicsFromPostgres() {
  await connectPostgres();
  const { rows } = await pgQuery(`
    SELECT t.topic_id AS id, c.code AS "courseCode", t.name, t.description
    FROM topics t
    JOIN courses c ON t.course_id = c.course_id
    ORDER BY t.topic_id
  `);
  return rows;
}

async function listQuestionsFromMongo() {
  const conn = await ensureMongo();
  const col = conn.collection('questionBank');
  const docs = await col.find({}).toArray();
  return docs.map(d => ({
    id: d.legacyId || String(d._id),
    type: d.type,
    difficulty: d.difficulty,
    topicId: String(d.topicId),
    text: d.prompt,
    choices: d.choices,
    answer: d.answer,
    explanation: d.explanation,
  }));
}

async function listQuestionsFromPostgres() {
  await connectPostgres();
  const { rows } = await pgQuery(`
    SELECT question_id AS id, type, difficulty, topic_id AS "topicId", prompt AS text, choices, answer, explanation
    FROM question_bank
    ORDER BY question_id
  `);
  return rows;
}

// 관리자 계정 관리 (READ)
router.get('/admins', async (req, res) => {
  try {
    const src = getDataSource();
    let items = [];
    if (src === 'mongo') items = await listAdminsFromMongo();
    else if (src === 'postgres') items = await listAdminsFromPostgres();
    else {
      // auto: Mongo 우선, 실패 시 Postgres
      try { items = await listAdminsFromMongo(); } catch (_) {}
      if (!items || items.length === 0) items = await listAdminsFromPostgres();
    }
    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ message: '관리자 목록을 불러오지 못했습니다.', error: String(err?.message || err) });
  }
});

// 쓰기 API는 스키마 변동 여지로 인해 일단 비활성화(필요 시 구현)
router.post('/admins', async (req, res) => {
  try {
    const { id, username, email, password } = req.body || {};
    if (!id && !username) return res.status(400).json({ message: 'id 또는 username은 필수입니다.' });
    const src = getDataSource();
    let created;
    if (src === 'mongo') created = await upsertAdminMongo({ id, username, email, password });
    else if (src === 'postgres') created = await upsertAdminPostgres({ id, username, email, password });
    else {
      try { created = await upsertAdminMongo({ id, username, email, password }); } catch (_) {}
      if (!created) created = await upsertAdminPostgres({ id, username, email, password });
    }
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: '관리자 생성/수정 실패', error: String(err?.message || err) });
  }
});

router.delete('/admins/:id', async (req, res) => {
  try {
    const loginId = req.params.id;
    const src = getDataSource();
    let deleted = false;
    if (src === 'mongo') {
      const conn = await ensureMongo();
      const r = await conn.collection('users').deleteOne({ $and: [{ role: 'admin' }, { $or: [{ id: loginId }, { username: loginId }] }] });
      deleted = r.deletedCount > 0;
    } else if (src === 'postgres') {
      await connectPostgres();
      const sql = `DELETE FROM users WHERE id = $1 AND role_id = (SELECT role_id FROM roles WHERE name='admin')`;
      const r = await pgQuery(sql, [loginId]);
      deleted = r.rowCount > 0;
    } else {
      try {
        const conn = await ensureMongo();
        const r = await conn.collection('users').deleteOne({ $and: [{ role: 'admin' }, { $or: [{ id: loginId }, { username: loginId }] }] });
        deleted = r.deletedCount > 0;
      } catch (_) {}
      if (!deleted) {
        await connectPostgres();
        const sql = `DELETE FROM users WHERE id = $1 AND role_id = (SELECT role_id FROM roles WHERE name='admin')`;
        const r = await pgQuery(sql, [loginId]);
        deleted = r.rowCount > 0;
      }
    }
    return deleted ? res.json({ ok: true }) : res.status(404).json({ message: '존재하지 않습니다.' });
  } catch (err) {
    res.status(500).json({ message: '관리자 삭제 실패', error: String(err?.message || err) });
  }
});

// 학생 관리 (READ)
router.get('/students', async (req, res) => {
  try {
    const src = getDataSource();
    let items = [];
    if (src === 'mongo') items = await listStudentsFromMongo();
    else if (src === 'postgres') items = await listStudentsFromPostgres();
    else {
      try { items = await listStudentsFromMongo(); } catch (_) {}
      if (!items || items.length === 0) items = await listStudentsFromPostgres();
    }
    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ message: '학생 목록을 불러오지 못했습니다.', error: String(err?.message || err) });
  }
});

router.post('/students', async (req, res) => {
  try {
    const { id, name, email, classroom, password } = req.body || {};
    if (!id || !name) return res.status(400).json({ message: 'id와 name은 필수입니다.' });
    const src = getDataSource();
    let created;
    if (src === 'mongo') {
      const conn = await ensureMongo();
      const users = conn.collection('users');
      const students = conn.collection('students');
      const pwd = password || Math.random().toString(36).slice(2, 12);
      const hash = await bcrypt.hash(pwd, 10);
      await users.updateOne(
        { username: id },
        { $set: { username: id, fullName: name, email, role: 'student', password: hash } },
        { upsert: true }
      );
      const u = await users.findOne({ username: id }, { projection: { _id: 1 } });
      await students.updateOne(
        { userId: u._id },
        { $set: { userId: u._id, classGroup: classroom || null, status: 'active' } },
        { upsert: true }
      );
      created = { id, name, email, classroom };
    } else if (src === 'postgres') {
      await connectPostgres();
      const pwd = password || null;
      const hash = pwd ? (pwd.startsWith('$2') ? pwd : await bcrypt.hash(pwd, 10)) : null;
      // 1. users 테이블에 먼저 INSERT/UPDATE 후 user_id를 받아옴
      // role_id를 무조건 3(학생)으로 지정
      // 플레이스홀더를 각 컬럼마다 별도로 사용하고, 명시적 캐스팅 적용
      const userSql = `
        INSERT INTO users (id, name, email, password, role_id)
        VALUES ($1::varchar, $2::varchar, $3::varchar, COALESCE($4::varchar, (SELECT password FROM users WHERE id=$5::varchar)), 3)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          password = EXCLUDED.password,
          role_id = 3
        RETURNING user_id;
      `;
      const userRes = await pgQuery(userSql, [id, name, email || null, hash, id]);
      const userId = userRes.rows[0]?.user_id;
      if (!userId) throw new Error('user_id 생성 실패');
      // 2. students 테이블에 user_id(INT)로 INSERT/UPDATE
      const studentSql = `
        INSERT INTO students (student_id, class_group)
        VALUES ($1, $2)
        ON CONFLICT (student_id) DO UPDATE SET
          class_group = EXCLUDED.class_group;
      `;
      await pgQuery(studentSql, [userId, classroom || null]);
      created = { id, name, email, classroom };
    } else {
      // fallback: students 테이블에 id, name, email, classroom을 직접 넣는 쿼리 제거 (스키마 불일치 방지)
      return res.status(500).json({ message: '학생 생성/수정 실패', error: '데이터베이스 스키마 불일치: students 테이블에 id, name, email, classroom 컬럼이 없습니다.' });
    }
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: '학생 생성/수정 실패', error: String(err?.message || err) });
  }
});

router.delete('/students/:id', async (req, res) => {
  try {
    const sid = req.params.id;
    const src = getDataSource();
    let deleted = false;
    if (src === 'mongo') {
      const conn = await ensureMongo();
      const users = conn.collection('users');
      const students = conn.collection('students');
      const u = await users.findOne({ username: sid, role: 'student' }, { projection: { _id: 1 } });
      if (u) {
        await students.deleteOne({ userId: u._id });
        const r2 = await users.deleteOne({ _id: u._id });
        deleted = r2.deletedCount > 0;
      }
    } else if (src === 'postgres') {
      await connectPostgres();
      const r1 = await pgQuery('DELETE FROM students WHERE student_id = (SELECT user_id FROM users WHERE id = $1)', [sid]);
      const r2 = await pgQuery("DELETE FROM users WHERE id = $1 AND role_id = (SELECT role_id FROM roles WHERE name='student')", [sid]);
      deleted = (r1.rowCount > 0) || (r2.rowCount > 0);
    } else {
      try {
        const conn = await ensureMongo();
        const r = await conn.collection('students').deleteOne({ id: sid });
        deleted = r.deletedCount > 0;
      } catch (_) {}
      if (!deleted) {
        await connectPostgres();
        const r1 = await pgQuery('DELETE FROM students WHERE student_id = (SELECT user_id FROM users WHERE id = $1)', [sid]);
        const r2 = await pgQuery("DELETE FROM users WHERE id = $1 AND role_id = (SELECT role_id FROM roles WHERE name='student')", [sid]);
        deleted = (r1.rowCount > 0) || (r2.rowCount > 0);
      }
    }
    return deleted ? res.json({ ok: true }) : res.status(404).json({ message: '존재하지 않습니다.' });
  } catch (err) {
    res.status(500).json({ message: '학생 삭제 실패', error: String(err?.message || err) });
  }
});

// 강사 관리 (READ)
router.get('/teachers', async (req, res) => {
  try {
    const src = getDataSource();
    let items = [];
    if (src === 'mongo') items = await listTeachersFromMongo();
    else if (src === 'postgres') items = await listTeachersFromPostgres();
    else {
      try { items = await listTeachersFromMongo(); } catch (_) {}
      if (!items || items.length === 0) items = await listTeachersFromPostgres();
    }
    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ message: '강사 목록을 불러오지 못했습니다.', error: String(err?.message || err) });
  }
});

router.post('/teachers', async (req, res) => {
  try {
    const { id, name, email, password } = req.body || {};
    if (!id && !name) return res.status(400).json({ message: 'id 또는 name은 필수입니다.' });
    const src = getDataSource();
    let created;
    if (src === 'mongo') created = await upsertTeacherMongo({ id, name, email, password });
    else if (src === 'postgres') created = await upsertTeacherPostgres({ id, name, email, password });
    else {
      try { created = await upsertTeacherMongo({ id, name, email, password }); } catch (_) {}
      if (!created) created = await upsertTeacherPostgres({ id, name, email, password });
    }
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: '강사 생성/수정 실패', error: String(err?.message || err) });
  }
});

router.delete('/teachers/:id', async (req, res) => {
  try {
    const tid = req.params.id;
    const src = getDataSource();
    let deleted = false;
    if (src === 'mongo') {
      const conn = await ensureMongo();
      const r = await conn.collection('users').deleteOne({ $and: [{ role: { $in: ['teacher','instructor'] } }, { username: tid }] });
      deleted = r.deletedCount > 0;
    } else if (src === 'postgres') {
      await connectPostgres();
      const sql = `DELETE FROM users WHERE id = $1 AND role_id IN (SELECT role_id FROM roles WHERE name IN ('teacher','instructor'))`;
      const r = await pgQuery(sql, [tid]);
      deleted = r.rowCount > 0;
    } else {
      try {
        const conn = await ensureMongo();
        const r = await conn.collection('users').deleteOne({ $and: [{ role: { $in: ['teacher','instructor'] } }, { username: tid }] });
        deleted = r.deletedCount > 0;
      } catch (_) {}
      if (!deleted) {
        await connectPostgres();
        const sql = `DELETE FROM users WHERE id = $1 AND role_id IN (SELECT role_id FROM roles WHERE name IN ('teacher','instructor'))`;
        const r = await pgQuery(sql, [tid]);
        deleted = r.rowCount > 0;
      }
    }
    return deleted ? res.json({ ok: true }) : res.status(404).json({ message: '존재하지 않습니다.' });
  } catch (err) {
    res.status(500).json({ message: '강사 삭제 실패', error: String(err?.message || err) });
  }
});

// 과목 관리 (READ)
router.get('/courses', async (req, res) => {
  try {
    const src = getDataSource();
    let items = [];
    if (src === 'mongo') items = await listCoursesFromMongo();
    else if (src === 'postgres') items = await listCoursesFromPostgres();
    else {
      try { items = await listCoursesFromMongo(); } catch (_) {}
      if (!items || items.length === 0) items = await listCoursesFromPostgres();
    }
    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ message: '과목 목록을 불러오지 못했습니다.', error: String(err?.message || err) });
  }
});

router.post('/courses', async (req, res) => {
  try {
    const { code, title, description, teacherId } = req.body || {};
    if (!code || !title) return res.status(400).json({ message: 'code와 title은 필수입니다.' });
    const src = getDataSource();
    let created;
    if (src === 'mongo') created = await upsertCourseMongo({ code, title, description, teacherId });
    else if (src === 'postgres') created = await upsertCoursePostgres({ code, title, description, teacherId });
    else {
      try { created = await upsertCourseMongo({ code, title, description, teacherId }); } catch (_) {}
      if (!created) created = await upsertCoursePostgres({ code, title, description, teacherId });
    }
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: '과목 생성/수정 실패', error: String(err?.message || err) });
  }
});

router.delete('/courses/:code', async (req, res) => {
  try {
    const code = req.params.code;
    const src = getDataSource();
    let deleted = false;
    if (src === 'mongo') {
      const conn = await ensureMongo();
      const r = await conn.collection('courses').deleteOne({ code });
      deleted = r.deletedCount > 0;
    } else if (src === 'postgres') {
      await connectPostgres();
      const r = await pgQuery('DELETE FROM courses WHERE code = $1', [code]);
      deleted = r.rowCount > 0;
    } else {
      try {
        const conn = await ensureMongo();
        const r = await conn.collection('courses').deleteOne({ code });
        deleted = r.deletedCount > 0;
      } catch (_) {}
      if (!deleted) {
        await connectPostgres();
        const r = await pgQuery('DELETE FROM courses WHERE code = $1', [code]);
        deleted = r.rowCount > 0;
      }
    }
    return deleted ? res.json({ ok: true }) : res.status(404).json({ message: '존재하지 않습니다.' });
  } catch (err) {
    res.status(500).json({ message: '과목 삭제 실패', error: String(err?.message || err) });
  }
});

// 주제 관리 (READ)
router.get('/topics', async (req, res) => {
  try {
    const src = getDataSource();
    let items = [];
    if (src === 'mongo') items = await listTopicsFromMongo();
    else if (src === 'postgres') items = await listTopicsFromPostgres();
    else {
      try { items = await listTopicsFromMongo(); } catch (_) {}
      if (!items || items.length === 0) items = await listTopicsFromPostgres();
    }
    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ message: '주제 목록을 불러오지 못했습니다.', error: String(err?.message || err) });
  }
});

router.post('/topics', async (req, res) => {
  try {
    const { id, courseCode, name, description } = req.body || {};
    if (!id || !courseCode || !name) return res.status(400).json({ message: 'id, courseCode, name은 필수입니다.' });
    const src = getDataSource();
    let created;
    if (src === 'mongo') created = await upsertTopicMongo({ id, courseCode, name, description });
    else if (src === 'postgres') created = await upsertTopicPostgres({ id, courseCode, name, description });
    else {
      try { created = await upsertTopicMongo({ id, courseCode, name, description }); } catch (_) {}
      if (!created) created = await upsertTopicPostgres({ id, courseCode, name, description });
    }
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: '주제 생성/수정 실패', error: String(err?.message || err) });
  }
});

router.delete('/topics/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const src = getDataSource();
    let deleted = false;
    if (src === 'mongo') {
      const conn = await ensureMongo();
      const { Types } = require('mongoose');
      let r = await conn.collection('topics').deleteOne({ legacyId: id });
      deleted = r.deletedCount > 0;
      if (!deleted && Types.ObjectId.isValid(id)) {
        r = await conn.collection('topics').deleteOne({ _id: Types.ObjectId(id) });
        deleted = r.deletedCount > 0;
      }
    } else if (src === 'postgres') {
      await connectPostgres();
      const r = await pgQuery('DELETE FROM topics WHERE topic_id = $1', [id]);
      deleted = r.rowCount > 0;
    } else {
      try {
        const conn = await ensureMongo();
        const { Types } = require('mongoose');
        let r = await conn.collection('topics').deleteOne({ legacyId: id });
        deleted = r.deletedCount > 0;
        if (!deleted && Types.ObjectId.isValid(id)) {
          r = await conn.collection('topics').deleteOne({ _id: Types.ObjectId(id) });
          deleted = r.deletedCount > 0;
        }
      } catch (_) {}
      if (!deleted) {
        await connectPostgres();
        const r = await pgQuery('DELETE FROM topics WHERE topic_id = $1', [id]);
        deleted = r.rowCount > 0;
      }
    }
    return deleted ? res.json({ ok: true }) : res.status(404).json({ message: '존재하지 않습니다.' });
  } catch (err) {
    res.status(500).json({ message: '주제 삭제 실패', error: String(err?.message || err) });
  }
});

// 문제은행 관리 (READ)
router.get('/questions', async (req, res) => {
  try {
    const src = getDataSource();
    let items = [];
    if (src === 'mongo') items = await listQuestionsFromMongo();
    else if (src === 'postgres') items = await listQuestionsFromPostgres();
    else {
      try { items = await listQuestionsFromMongo(); } catch (_) {}
      if (!items || items.length === 0) items = await listQuestionsFromPostgres();
    }
    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ message: '문제 목록을 불러오지 못했습니다.', error: String(err?.message || err) });
  }
});

router.post('/questions', async (req, res) => {
  try {
    const { id, type, difficulty, topicId, text, choices, answer, explanation } = req.body || {};
    if (!id || !type || !difficulty || !topicId || !text) {
      return res.status(400).json({ message: 'id, type, difficulty, topicId, text는 필수입니다.' });
    }
    const src = getDataSource();
    let created;
    if (src === 'mongo') created = await upsertQuestionMongo({ id, type, difficulty, topicId, text, choices, answer, explanation });
    else if (src === 'postgres') created = await upsertQuestionPostgres({ id, type, difficulty, topicId, text, choices, answer, explanation });
    else {
      try { created = await upsertQuestionMongo({ id, type, difficulty, topicId, text, choices, answer, explanation }); } catch (_) {}
      if (!created) created = await upsertQuestionPostgres({ id, type, difficulty, topicId, text, choices, answer, explanation });
    }
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: '문제 생성/수정 실패', error: String(err?.message || err) });
  }
});

router.delete('/questions/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const src = getDataSource();
    let deleted = false;
    if (src === 'mongo') {
      const conn = await ensureMongo();
      const { Types } = require('mongoose');
      let r = await conn.collection('questionBank').deleteOne({ legacyId: id });
      deleted = r.deletedCount > 0;
      if (!deleted && Types.ObjectId.isValid(id)) {
        r = await conn.collection('questionBank').deleteOne({ _id: Types.ObjectId(id) });
        deleted = r.deletedCount > 0;
      }
    } else if (src === 'postgres') {
      await connectPostgres();
      const r = await pgQuery('DELETE FROM question_bank WHERE question_id = $1', [id]);
      deleted = r.rowCount > 0;
    } else {
      try {
        const conn = await ensureMongo();
        const { Types } = require('mongoose');
        let r = await conn.collection('questionBank').deleteOne({ legacyId: id });
        deleted = r.deletedCount > 0;
        if (!deleted && Types.ObjectId.isValid(id)) {
          r = await conn.collection('questionBank').deleteOne({ _id: Types.ObjectId(id) });
          deleted = r.deletedCount > 0;
        }
      } catch (_) {}
      if (!deleted) {
        await connectPostgres();
        const r = await pgQuery('DELETE FROM question_bank WHERE question_id = $1', [id]);
        deleted = r.rowCount > 0;
      }
    }
    return deleted ? res.json({ ok: true }) : res.status(404).json({ message: '존재하지 않습니다.' });
  } catch (err) {
    res.status(500).json({ message: '문제 삭제 실패', error: String(err?.message || err) });
  }
});

// 시스템 설정
router.get('/settings', (req, res) => {
  res.json({ ...settings });
});

router.post('/settings', (req, res) => {
  const { siteTitle, allowSelfSignup, announcement } = req.body || {};
  if (typeof siteTitle !== 'undefined') settings.siteTitle = String(siteTitle);
  if (typeof allowSelfSignup !== 'undefined') settings.allowSelfSignup = !!allowSelfSignup;
  if (typeof announcement !== 'undefined') settings.announcement = String(announcement);
  res.status(201).json({ ...settings });
});

// 모니터링/메트릭
router.get('/metrics', async (req, res) => {
  try {
    const mem = process.memoryUsage();
    const src = getDataSource();
    let counts = { admins: 0, students: 0, teachers: 0, courses: 0, topics: 0, questions: 0 };

    if (src === 'mongo' || src === 'auto') {
      try {
        const conn = await ensureMongo();
        const db = conn;
        counts.admins = await db.collection('users').countDocuments({ role: 'admin' });
        counts.students = await db.collection('students').countDocuments({});
        counts.teachers = await db.collection('users').countDocuments({ role: { $in: ['teacher','instructor'] } });
        counts.courses = await db.collection('courses').countDocuments({});
        counts.topics = await db.collection('topics').countDocuments({});
        counts.questions = await db.collection('questionBank').countDocuments({});
      } catch (_) {
        if (src === 'mongo') throw _;
      }
    }

    if (src === 'postgres' || (src === 'auto' && counts.courses === 0)) {
      try {
        await connectPostgres();
        const q = async (sql) => (await pgQuery(sql)).rows[0].c;
        counts.admins = await q("SELECT COUNT(*)::int AS c FROM users u JOIN roles r ON u.role_id=r.role_id WHERE r.name='admin'");
        counts.students = await q("SELECT COUNT(*)::int AS c FROM students");
        counts.teachers = await q("SELECT COUNT(*)::int AS c FROM users u JOIN roles r ON u.role_id=r.role_id WHERE r.name IN ('teacher','instructor')");
        counts.courses = await q("SELECT COUNT(*)::int AS c FROM courses");
        counts.topics = await q("SELECT COUNT(*)::int AS c FROM topics");
        counts.questions = await q("SELECT COUNT(*)::int AS c FROM question_bank");
      } catch (_) {
        if (src === 'postgres') throw _;
      }
    }

    res.json({
      now: new Date().toISOString(),
      uptimeSec: process.uptime(),
      memory: {
        rss: mem.rss,
        heapTotal: mem.heapTotal,
        heapUsed: mem.heapUsed,
        external: mem.external,
      },
      counts,
    });
  } catch (err) {
    res.status(500).json({ message: '메트릭 수집 실패', error: String(err?.message || err) });
  }
});

module.exports = router;


