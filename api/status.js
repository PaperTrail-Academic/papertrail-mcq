// api/status.js
// Public endpoint — returns exam status and roster. No secrets exposed.
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { data: exam, error } = await supabase
      .from('exams')
      .select('status, start_code, duration_minutes')
      .eq('name', 'AP Lang PE2')
      .single();

    if (error) throw error;

    // Never return answer_key
    return res.status(200).json({
      status: exam.status,           // 'waiting' | 'active' | 'paused' | 'stopped'
      start_code: exam.start_code,
      duration_minutes: exam.duration_minutes
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
