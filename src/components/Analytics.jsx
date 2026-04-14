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

function chartValueForField(field, raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  if (!field) return null;
  if (field.type === 'text') return String(raw).length;
  if (field.type === 'date') {
    const t = new Date(raw).getTime();
    return Number.isFinite(t) ? Math.round(t / 86400000) : null;
  }
  if (field.type === 'photo') return String(raw).trim() ? 1 : 0;
  return null;
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
  const [filterDistrictId, setFilterDistrictId] = useState('');

  const [chartFormId, setChartFormId] = useState('');
  const [chartFieldId, setChartFieldId] = useState('');

  const forms = mockApi.getForms();
  const districts = useMemo(() => mockApi.getDistricts(), []);
  const users = useMemo(() => mockApi.getUsers(), []);
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

  const getUserByName = (name) => users.find((u) => u.fullName === name);

  const inDistrictByAssignee = (assigneeName) => {
    if (!filterDistrictId) return true;
    const u = getUserByName(assigneeName);
    if (!u) return false;
    return (u.districtIds || []).includes(filterDistrictId);
  };

  const inDistrictBySubmitter = (submitterName) => {
    if (!filterDistrictId) return true;
    const u = getUserByName(submitterName);
    if (!u) return false;
    return (u.districtIds || []).includes(filterDistrictId);
  };

  const tasksFiltered = useMemo(() => {
    return tasks.filter((t) => {
      if (filterAssignee && t.assignee !== filterAssignee) return false;
      if (!inDistrictByAssignee(t.assignee)) return false;
      const ref =
        t.status === 'выполнено' && t.completedAt
          ? t.completedAt
          : t.createdAt;
      return inPeriod(ref);
    });
  }, [tasks, filterAssignee, filterDistrictId, periodFrom, periodTo, users]);

  const responsesFiltered = useMemo(
    () => responses.filter((r) => inDistrictBySubmitter(r.submittedBy)),
    [responses, filterDistrictId, users]
  );

  const stats = useMemo(() => {
    const totalTasks = tasksFiltered.length;
    const done = tasksFiltered.filter(
      (t) =>
        t.status === 'проверено' ||
        t.reviewState === 'проверено' ||
        t.status === 'выполнено'
    ).length;
    const overdue = tasksFiltered.filter((t) => t.status === 'просрочено').length;
    const donePercent = totalTasks ? Math.round((done / totalTasks) * 100) : 0;
    const totalPlans = plans.length;
    const totalForms = responsesFiltered.length;
    return { totalTasks, done, overdue, donePercent, totalPlans, totalForms };
  }, [tasksFiltered, plans, responsesFiltered]);

  const formForChart = forms.find((f) => f.id === chartFormId);
  const chartFieldDef = formForChart?.fields?.find((x) => x.id === chartFieldId);
  const chartFields = formForChart?.fields || [];

  const barData = useMemo(() => {
    if (!chartFormId || !chartFieldId || !chartFieldDef) return [];
    return responsesFiltered
      .filter((r) => r.formId === chartFormId)
      .map((r, idx) => ({
        name: `#${idx + 1}`,
        value: chartValueForField(chartFieldDef, r.answers[chartFieldId]),
      }))
      .filter((x) => x.value != null);
  }, [chartFormId, chartFieldId, chartFieldDef, responsesFiltered]);

  const lineData = useMemo(() => {
    const doneTasks = tasks.filter(
      (t) =>
        t.status === 'выполнено' &&
        t.completedAt &&
        (!filterAssignee || t.assignee === filterAssignee) &&
        inDistrictByAssignee(t.assignee)
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
  }, [tasks, filterAssignee, filterDistrictId, periodFrom, periodTo, users]);

  const progressData = useMemo(
    () => [
      {
        name: 'Выполнение',
        percent: stats.donePercent,
      },
    ],
    [stats.donePercent]
  );

  function handleExport() {
    exportCsv(
      [
        {
          metric: 'Всего задач (в фильтре)',
          value: stats.totalTasks,
        },
        {
          metric: 'Район',
          value:
            districts.find((d) => d.id === filterDistrictId)?.name || 'Все районы',
        },
        { metric: 'Выполнено', value: stats.done },
        { metric: 'Процент выполнения задач', value: `${stats.donePercent}%` },
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
          <div className="field">
            <label>Район</label>
            <select
              className="select"
              value={filterDistrictId}
              onChange={(e) => setFilterDistrictId(e.target.value)}
            >
              <option value="">Все районы</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
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
            Выполнение задач, %
          </span>
          <strong>{stats.donePercent}%</strong>
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
        <h2>Диаграмма: процент выполнения задач</h2>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend />
              <Bar dataKey="percent" fill="#ca2629" name="Процент выполнения" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel">
        <h2>Диаграмма 1: ответы по полю шаблона отчёта</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-gray)', marginTop: 0 }}>
          Текст — длина строки; дата — условный «день»; фото — 1 если файл указан,
          иначе 0.
        </p>
        <div className="grid-2">
          <div className="field">
            <label>Шаблон отчёта</label>
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
            <label>Поле</label>
            <select
              className="select"
              value={chartFieldId}
              onChange={(e) => setChartFieldId(e.target.value)}
              disabled={!chartFields.length}
            >
              <option value="">—</option>
              {chartFields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label} ({f.type})
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
              <Bar dataKey="value" fill="#00c2ff" name="Показатель" />
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
