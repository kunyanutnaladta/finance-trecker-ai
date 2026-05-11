import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './Dashboard.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [form, setForm] = useState({ type: 'expense', amount: '', category: '', description: '', date: new Date().toISOString().slice(0, 10) });
  const [categories, setCategories] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [sumRes, txRes, catRes] = await Promise.all([
        api.get(`/transactions/summary?month=${month}`),
        api.get(`/transactions?month=${month}`),
        api.get('/transactions/categories'),
      ]);
      setSummary(sumRes.data);
      setTransactions(txRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    }
  }, [month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/transactions', form);
    setShowForm(false);
    setForm({ type: 'expense', amount: '', category: '', description: '', date: new Date().toISOString().slice(0, 10) });
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm('ลบรายการนี้?')) return;
    await api.delete(`/transactions/${id}`);
    fetchData();
  };

  const handleAnalyze = async () => {
    setAiLoading(true);
    setAiAnalysis('');
    try {
      const res = await api.post(`/ai/analyze?month=${month}`);
      setAiAnalysis(res.data.analysis);
    } catch (err) {
      setAiAnalysis(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setAiLoading(false);
    }
  };

  const chartData = summary?.byCategory
    ?.filter(c => c.type === 'expense')
    ?.slice(0, 6)
    ?.map(c => ({ name: c.category, value: Number(c.total) })) || [];

  const COLORS = ['#6c63ff','#4ecdc4','#ff6b6b','#ffd93d','#a8e6cf','#ff8b94'];

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-logo">💰 Finance <span>Tracker</span></div>
        <div className="dash-user">
          <span>สวัสดี, {user?.name}</span>
          <button className="btn-logout" onClick={logout}>ออกจากระบบ</button>
        </div>
      </header>

      <main className="dash-main">
        <div className="dash-controls">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="month-picker" />
          <button className="btn-add" onClick={() => setShowForm(!showForm)}>+ เพิ่มรายการ</button>
        </div>

        {showForm && (
          <div className="form-card">
            <h3>เพิ่มรายการใหม่</h3>
            <form onSubmit={handleSubmit} className="tx-form">
              <div className="form-row">
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="expense">รายจ่าย</option>
                  <option value="income">รายรับ</option>
                </select>
                <input type="number" placeholder="จำนวนเงิน (บาท)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required min="1" />
              </div>
              <div className="form-row">
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
                  <option value="">เลือกหมวดหมู่</option>
                  {categories.filter(c => c.type === form.type || c.type === 'both').map(c => (
                    <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                  ))}
                </select>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <input type="text" placeholder="รายละเอียด (ไม่บังคับ)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>ยกเลิก</button>
                <button type="submit" className="btn-save">บันทึก</button>
              </div>
            </form>
          </div>
        )}

        <div className="summary-cards">
          <div className="summary-card income">
            <div className="summary-label">รายรับ</div>
            <div className="summary-amount">฿{summary?.income?.toLocaleString() || 0}</div>
          </div>
          <div className="summary-card expense">
            <div className="summary-label">รายจ่าย</div>
            <div className="summary-amount">฿{summary?.expense?.toLocaleString() || 0}</div>
          </div>
          <div className={`summary-card balance ${summary?.balance >= 0 ? 'positive' : 'negative'}`}>
            <div className="summary-label">คงเหลือ</div>
            <div className="summary-amount">฿{summary?.balance?.toLocaleString() || 0}</div>
          </div>
        </div>

        <div className="dash-grid">
          <div className="chart-card">
            <h3>รายจ่ายตามหมวดหมู่</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: 'none', borderRadius: 8, color: '#fff' }} />
                  <Bar dataKey="value" radius={[6,6,0,0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="no-data">ยังไม่มีข้อมูล</p>}
          </div>

          <div className="ai-card">
            <h3>🤖 AI วิเคราะห์การเงิน</h3>
            <button className="btn-ai" onClick={handleAnalyze} disabled={aiLoading}>
              {aiLoading ? 'กำลังวิเคราะห์...' : 'วิเคราะห์เดือนนี้'}
            </button>
            {aiAnalysis && <div className="ai-result">{aiAnalysis}</div>}
          </div>
        </div>

        <div className="tx-list">
          <h3>รายการทั้งหมด</h3>
          {transactions.length === 0 ? (
            <p className="no-data">ยังไม่มีรายการในเดือนนี้</p>
          ) : transactions.map(tx => (
            <div key={tx.id} className={`tx-item ${tx.type}`}>
              <div className="tx-info">
                <span className="tx-category">{tx.category}</span>
                <span className="tx-desc">{tx.description || tx.date}</span>
              </div>
              <div className="tx-right">
                <span className="tx-amount">{tx.type === 'income' ? '+' : '-'}฿{Number(tx.amount).toLocaleString()}</span>
                <button className="btn-delete" onClick={() => handleDelete(tx.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}