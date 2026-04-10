// api/roster.js
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
    const { data, error } = await supabase
      .from('roster')
      .select('id, first_name, last_name')
      .order('last_name');

    if (error) throw error;

    return res.status(200).json({ students: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
