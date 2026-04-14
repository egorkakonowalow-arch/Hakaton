import { useMemo } from 'react';
import { useRole } from '../context/RoleContext';
import { mockApi, ASSIGNEES } from '../services/mockApi';

const ROLE_LABEL = {
  admin: 'Администратор',
  manager: 'Руководитель',
  executor: 'Сотрудник',
};

export default function UserProfile() {
  const {
    role,
    setRole,
    executorPerson,
    setExecutorPerson,
    displayName,
    filterTasks,
    filterPlans,
    filterResponses,
  } = useRole();

  const nameOptions = useMemo(() => {
    const n = mockApi.getEmployeeNames();
    return n.length ? n : [...ASSIGNEES];
  }, [role, executorPerson]);

  const tasks = useMemo(() => filterTasks(mockApi.getTasks()), [filterTasks]);
  const plans = useMemo(() => filterPlans(mockApi.getPlans()), [filterPlans]);
  const responses = useMemo(
    () => filterResponses(mockApi.getResponses()),
    [filterResponses]
  );

  const myPlans = useMemo(
    () => plans.filter((p) => p.responsible === executorPerson),
    [plans, executorPerson]
  );

  return (
    <div>
      <h2 className="app-title">Личный кабинет</h2>

      <div className="panel">
        <h2>Профиль</h2>
        <p>
          <strong>ФИО:</strong> {displayName}
        </p>
        <p>
          <strong>Роль (демо):</strong> {ROLE_LABEL[role]}
        </p>

        <div className="field" style={{ maxWidth: 320 }}>
          <label>Переключить роль</label>
          <select
            className="select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="admin">Администратор</option>
            <option value="manager">Руководитель</option>
            <option value="executor">Сотрудник</option>
          </select>
        </div>

        {role === 'executor' && (
          <div className="field" style={{ maxWidth: 320 }}>
            <label>Сотрудник (для фильтра задач)</label>
            <select
              className="select"
              value={executorPerson}
              onChange={(e) => setExecutorPerson(e.target.value)}
            >
              {nameOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {role !== 'admin' && (
        <div className="grid-2">
          <div className="panel">
            <h2>Мои задачи (в зоне видимости)</h2>
            <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {tasks.map((t) => (
                <li key={t.id}>
                  {t.title} —{' '}
                  <span className="badge badge--muted">{t.status}</span>
                </li>
              ))}
              {!tasks.length && <li>Нет задач</li>}
            </ul>
          </div>
          <div className="panel">
            <h2>Планы, где я ответственный</h2>
            <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {myPlans.map((p) => (
                <li key={p.id}>{p.title}</li>
              ))}
              {!myPlans.length && <li>Нет планов</li>}
            </ul>
          </div>
        </div>
      )}

      <div className="panel">
        <h2>Отправленные отчёты</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID ответа</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <tr key={r.id}>
                  <td>{r.id.slice(0, 12)}…</td>
                  <td>{new Date(r.submittedAt).toLocaleString('ru-RU')}</td>
                </tr>
              ))}
              {!responses.length && (
                <tr>
                  <td colSpan={2}>Нет отправок</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
