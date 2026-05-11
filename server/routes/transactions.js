const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  const { month, type, category } = req.query;
  let sql = 'SELECT * FROM transactions WHERE user_id = $1';
  const params = [req.user.id];
  let i = 2;

  if (month)    { sql += ` AND TO_CHAR(date, 'YYYY-MM') = $${i++}`; params.push(month); }
  if (type)     { sql += ` AND type = $${i++}`;     params.push(type); }
  if (category) { sql += ` AND category = $${i++}`; params.push(category); }
  sql += ' ORDER BY date DESC, created_at DESC';

  try {
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

router.get('/summary', async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  try {
    const totals = await pool.query(`
      SELECT type, SUM(amount) as total, COUNT(*) as count
      FROM transactions
      WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2
      GROUP BY type
    `, [req.user.id, month]);

    const byCategory = await pool.query(`
      SELECT category, type, SUM(amount) as total, COUNT(*) as count
      FROM transactions
      WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2
      GROUP BY category, type
      ORDER BY total DESC
    `, [req.user.id, month]);

    const income  = totals.rows.find(r => r.type === 'income')?.total  || 0;
    const expense = totals.rows.find(r => r.type === 'expense')?.total || 0;

    res.json({
      month,
      income:     Number(income),
      expense:    Number(expense),
      balance:    Number(income) - Number(expense),
      byCategory: byCategory.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY type, name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

router.post('/', async (req, res) => {
  const { type, amount, category, description, date } = req.body;
  if (!type || !amount || !category)
    return res.status(400).json({ error: 'กรุณากรอก type, amount, category' });
  if (!['income', 'expense'].includes(type))
    return res.status(400).json({ error: 'type ต้องเป็น income หรือ expense' });
  if (isNaN(amount) || Number(amount) <= 0)
    return res.status(400).json({ error: 'amount ต้องเป็นตัวเลขที่มากกว่า 0' });

  try {
    const result = await pool.query(`
      INSERT INTO transactions (user_id, type, amount, category, description, date)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [req.user.id, type, Number(amount), category, description || null,
        date || new Date().toISOString().slice(0, 10)]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

router.put('/:id', async (req, res) => {
  const { type, amount, category, description, date } = req.body;
  try {
    const existing = await pool.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (existing.rows.length === 0)
      return res.status(404).json({ error: 'ไม่พบรายการนี้' });

    const old = existing.rows[0];
    const result = await pool.query(`
      UPDATE transactions
      SET type=$1, amount=$2, category=$3, description=$4, date=$5
      WHERE id=$6 AND user_id=$7 RETURNING *
    `, [
      type || old.type,
      amount ? Number(amount) : old.amount,
      category || old.category,
      description !== undefined ? description : old.description,
      date || old.date,
      req.params.id, req.user.id
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'ไม่พบรายการนี้' });
    res.json({ message: 'ลบสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;