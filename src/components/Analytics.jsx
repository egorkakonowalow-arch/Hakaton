import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { mockApi } from '../services/mockApi';
import { useRole } from '../context/RoleContext';

function parseNum(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function exportCsv(rows, filename) {
  const header = Object.keys(rows[0] || {}).join(';');
  const body = rows
    .map((r) =>
      Object.values(r)
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(';')
    )
    .join('\n');
  const blob = new Blob([header + '\n' + body], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Analytics() {
  const { filterTasks, filterPlans, filterResponses, role } = useRole();

  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');

  const [chartFormId, setChartFormId] = useState('');
  const [chartFieldId, setChartFieldId] = useState('');

  const forms = useMemo(() => mockApi.getForms(), []);
  const allTasks = useMemo(() => mockApi.getTasks(), []);
  const allPlans = useMemo(() => mockApi.getPlans(), []);
  const allResponses = useMemo(() => mockApi.getResponses(), []);

  const tasks = useMemo(
    () => filterTasks(allTasks),
    [allTasks, filterTasks]
  );
  const plans = useMemo(
    () => filterPlans(allPlans),
    [allPlans, filterPlans]
  );
  const responses = useMemo(
    () => filterResponses(allResponses),
    [allResponses, filterResponses]
  );

  const inPeriod = (isoDate) => {
    if (!isoDate) return false;
    if (!periodFrom && !periodTo) return true;
    const d = isoDate.slice(0, 10);
    if (periodFrom && d < periodFrom) return false;
    if (periodTo && d > periodTo) return false;
    return true;
  };

  const tasksFiltered = useMemo(() => {
    return tasks.filter((t) => {
      if (filterAssignee && t.assignee !== filterAssignee) return false;
      const ref =
        t.status === 'выполнено' && t.completedAt
          ? t.completedAt
          : t.createdAt;
      return inPeriod(ref);
    });
  }, [tasks, filterAssignee, periodFrom, periodTo]);

  const stats = useMemo(() => {
    const totalTasks = tasksFiltered.length;
    const done = tasksFiltered.filter((t) => t.status === 'выполнено').length;
    const overdue = tasksFiltered.filter((t) => t.status === 'просрочено').length;
    const totalPlans = plans.length;
    const totalForms = responses.length;
    return { totalTasks, done, overdue, totalPlans, totalForms };
  }, [tasksFiltered, plans, responses]);

  const formForChart = forms.find((f) => f.id === chartFormId);
  const numericFields = formForChart
    ? formForChart.fields.filter((f) => f.type === 'number')
    : [];

  const barData = useMemo(() => {
    if (!chartFormId || !chartFieldId) return [];
    const nums = responses
      .filter((r) => r.formId === chartFormId)
      .map((r, idx) => ({
        name: `#${idx + 1}`,
        value: parseNum(r.answers[chartFieldId]),
      }))
      .filter((x) => x.value != null);
    return nums;
  }, [chartFormId, chartFieldId, responses]);

  const lineData = useMemo(() => {
    const doneTasks = tasks.filter(
      (t) =>
        t.status === 'выполнено' &&
        t.completedAt &&
        (!filterAssignee || t.assignee === filterAssignee)
    );
    const byDay = {};
    doneTasks.forEach((t) => {
      const day = t.completedAt.slice(0, 10);
      if (!inPeriod(t.completedAt)) return;
      byDay[day] = (byDay[day] || 0) + 1;
    });
    return Object.keys(byDay)
      .sort()
      .map((d) => ({ date: d, count: byDay[d] }));
  }, [tasks, filterAssignee, periodFrom, periodTo]);

  function handleExport() {
    exportCsv(
      [
        {
          metric: 'Всего задач (в фильтре)',
          value: stats.totalTasks,
        },
        { metric: 'Выполнено', value: stats.done },
        { metric: 'Просрочено', value: stats.overdue },
        { metric: 'Всего планов', value: stats.totalPlans },
        { metric: 'Отправлено форм', value: stats.totalForms },
        { metric: 'Роль', value: role },
      ],
      `dashboard-${new Date().toISOString().slice(0, 10)}.csv`
    );
  }

  return (
    <div>
      <h2 className="app-title">Аналитика и отчётность</h2>

      <div className="panel">
        <h2>Фильтры дашборда</h2>
        <div className="grid-2">
          <div className="field">
            <label>Период с</label>
            <input
              type="date"
              className="input"
              value={periodFrom}
              onChange={(e) => setPeriodFrom(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Период по</label>
            <input
              type="date"
              className="input"
              value={periodTo}
              onChange={(e) => setPeriodTo(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Ответственный</label>
            <select
              className="select"
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
            >
              <option value="">Все</option>
              {mockApi.assignees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ alignSelf: 'end' }}>
            <button type="button" className="btn btn--primary" onClick={handleExport}>
              Экспорт CSV
            </button>
          </div>
        </div>
      </div>

      <div className="cards-row">
        <div className="stat-card">
          <span style={{ color: 'var(--color-gray)', fontSize: '0.85rem' }}>
            Всего задач
          </span>
          <strong>{stats.totalTasks}</strong>
        </div>
        <div className="stat-card">
          <span style={{ color: 'var(--color-gray)', fontSize: '0.85rem' }}>
            Выполнено
          </span>
          <strong>{stats.done}</strong>
        </div>
        <div className="stat-card">
          <span style={{ color: 'var(--color-gray)', fontSize: '0.85rem' }}>
            Просрочено
          </span>
          <strong>{stats.overdue}</strong>
        </div>
        <div className="stat-card">
          <span style={{ color: 'var(--color-gray)', fontSize: '0.85rem' }}>
            Планов
          </span>
          <strong>{stats.totalPlans}</strong>
        </div>
        <div className="stat-card">
          <span style={{ color: 'var(--color-gray)', fontSize: '0.85rem' }}>
            Отправок форм
          </span>
          <strong>{stats.totalForms}</strong>
        </div>
      </div>

      <div className="panel">
        <h2>Диаграмма 1: числовые ответы форм</h2>
        <div className="grid-2">
          <div className="field">
            <label>Форма</label>
            <select
              className="select"
              value={chartFormId}
              onChange={(e) => {
                setChartFormId(e.target.value);
                setChartFieldId('');
              }}
            >
              <option value="">—</option>
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Числовое поле</label>
            <select
              className="select"
              value={chartFieldId}
              onChange={(e) => setChartFieldId(e.target.value)}
              disabled={!numericFields.length}
            >
              <option value="">—</option>
              {numericFields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#00c2ff" name="Значение" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel">
        <h2>Диаграмма 2: выполненные задачи по дням</h2>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#ca2629"
                name="Завершено"
                strokeWidth={2}
                dot
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
