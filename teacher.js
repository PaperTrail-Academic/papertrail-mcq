// api/teacher.js
// All teacher actions — protected by TEACHER_PASSWORD env var
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function auth(req) {
  const token = req.headers['x-teacher-token'];
  return token === process.env.TEACHER_PASSWORD;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-teacher-token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!auth(req)) return res.status(401).json({ error: 'Unauthorized' });

  const action = req.query.action;

  try {
    // ── GET submissions (live monitor) ──────────────────────────
    if (req.method === 'GET' && action === 'submissions') {
      const { data, error } = await supabase
        .from('submissions')
        .select('id, student_name, answers, score, percent, time_used, tab_switches, status, flagged_questions, last_updated, camera_used, snapshot_count')
        .order('last_updated', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ submissions: data });
    }

    // ── GET exam state ──────────────────────────────────────────
    if (req.method === 'GET' && action === 'exam') {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('name', 'AP Lang PE2')
        .single();
      if (error) throw error;
      return res.status(200).json({ exam: data });
    }

    // ── POST: set exam status ───────────────────────────────────
    if (req.method === 'POST' && action === 'set-status') {
      const { status, start_code, duration_minutes } = req.body;
      const update = { status, last_updated: new Date().toISOString() };
      if (start_code !== undefined) update.start_code = start_code;
      if (duration_minutes !== undefined) update.duration_minutes = duration_minutes;
      if (status === 'active') update.started_at = new Date().toISOString();
      if (status === 'stopped') update.stopped_at = new Date().toISOString();

      const { error } = await supabase
        .from('exams')
        .update(update)
        .eq('name', 'AP Lang PE2');
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    // ── POST: upload roster ─────────────────────────────────────
    if (req.method === 'POST' && action === 'upload-roster') {
      const { students } = req.body; // [{ first_name, last_name }]
      // Clear existing roster first
      await supabase.from('roster').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (students && students.length > 0) {
        const { error } = await supabase.from('roster').insert(students);
        if (error) throw error;
      }
      return res.status(200).json({ ok: true, count: students?.length || 0 });
    }

    // ── POST: reset submissions ─────────────────────────────────
    if (req.method === 'POST' && action === 'reset') {
      await supabase.from('submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('teacher error:', err);
    return res.status(500).json({ error: err.message });
  }
};
