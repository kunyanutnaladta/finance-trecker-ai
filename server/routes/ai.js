const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.post('/analyze', async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);

  const transactions = (await pool.query(`
    SELECT type, amount, category, description, date
    FROM transactions
    WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2
    ORDER BY date
  `, [req.user.id, month])).rows;

  if (transactions.length === 0)
    return res.status(400).json({ error: 'ไม่มีข้อมูลรายรับ-รายจ่ายในเดือนนี้' });

  const income  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const byCat = {};
  transactions.forEach(t => {
    if (!byCat[t.category]) byCat[t.category] = { income: 0, expense: 0 };
    byCat[t.category][t.type] += Number(t.amount);
  });

  const prompt = `
คุณเป็นผู้เชี่ยวชาญด้านการเงินส่วนบุคคล วิเคราะห์ข้อมูลการเงินของฉันในเดือน ${month}:

รายรับรวม: ${income.toLocaleString()} บาท
รายจ่ายรวม: ${expense.toLocaleString()} บาท
คงเหลือ: ${(income - expense).toLocaleString()} บาท

รายจ่ายแยกตามหมวดหมู่:
${Object.entries(byCat)
  .filter(([, v]) => v.expense > 0)
  .sort(([, a], [, b]) => b.expense - a.expense)
  .map(([cat, v]) => `- ${cat}: ${v.expense.toLocaleString()} บาท`)
  .join('\n')}

กรุณาวิเคราะห์ใน 3 หัวข้อ:
1. สรุปภาพรวม (2-3 ประโยค)
2. จุดที่ควรระวัง
3. คำแนะนำ 3 ข้อที่ทำได้จริง

ตอบเป็นภาษาไทย กระชับ เข้าใจง่าย
  `.trim();

 try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));

    const analysis = data.choices[0].message.content;

    await pool.query(
      'INSERT INTO ai_analyses (user_id, month, prompt, response) VALUES ($1, $2, $3, $4)',
      [req.user.id, month, prompt, analysis]
    );

    res.json({ month, analysis, summary: { income, expense, balance: income - expense } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ไม่สามารถติดต่อ AI ได้' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, month, response, created_at
      FROM ai_analyses WHERE user_id = $1
      ORDER BY created_at DESC LIMIT 12
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;