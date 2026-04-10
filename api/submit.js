// api/submit.js
// Server-side scoring — answer key NEVER reaches the browser
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getAnswerKey() {
  try { return JSON.parse(process.env.ANSWER_KEY); }
  catch { return {}; }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      submissionId, studentName, answers,
      answerHistory, gazeLog,
      timeUsed, tabSwitches, activityLog,
      cameraUsed, snapshotCount, flaggedQuestions, status,
      startedAt, allottedSeconds
    } = req.body;

    const key = getAnswerKey();
    let correct = 0, incorrect = 0, blank = 0;
    const perQuestion = {};

    for (let n = 1; n <= 45; n++) {
      const given = answers[n];
      const correct_ans = key[n];
      if (!given) { blank++; perQuestion[n] = { given: null, correct: correct_ans, result: 'blank' }; }
      else if (given === correct_ans) { correct++; perQuestion[n] = { given, correct: correct_ans, result: 'correct' }; }
      else { incorrect++; perQuestion[n] = { given, correct: correct_ans, result: 'incorrect' }; }
    }

    const score = correct;
    const percent = Math.round((correct / 45) * 100);

    const upsertData = {
      id: submissionId,
      student_name: studentName,
      answers,
      answer_history: answerHistory || {},
      gaze_log: gazeLog || [],
      score,
      percent,
      per_question: perQuestion,
      time_used: timeUsed,
      tab_switches: tabSwitches,
      activity_log: activityLog,
      camera_used: cameraUsed,
      snapshot_count: snapshotCount,
      flagged_questions: flaggedQuestions,
      status,
      last_updated: new Date().toISOString()
    };

    // Only set on initial save — don't overwrite if teacher added time
    if (startedAt)       upsertData.started_at = startedAt;
    if (allottedSeconds) upsertData.allotted_seconds = allottedSeconds;

    const { error } = await supabase
      .from('submissions')
      .upsert(upsertData, { onConflict: 'id', ignoreDuplicates: false });

    if (error) throw error;

    return res.status(200).json({ ok: true, score, percent, correct, incorrect, blank, perQuestion });
  } catch (err) {
    console.error('submit error:', err);
    return res.status(500).json({ error: err.message });
  }
};
