// api/student-time.js
// Students poll this to detect if teacher added time to their allotment
// Returns only allotted_seconds for their submission — no sensitive data
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

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('allotted_seconds')
      .eq('id', id)
      .single();

    if (error) throw error;
    return res.status(200).json({ allotted_seconds: data.allotted_seconds });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
