import { useMemo, useState } from 'react';
import { mockApi } from '../services/mockApi';

const empty = () => ({
  id: '',
  name: '',
  description: '',
  employeeIds: [],
  managerIds: [],
});

export default function Projects() {
  const [projects, setProjects] = useState(() => mockApi.getProjects());
  const [users, setUsers] = useState(() => mockApi.getUsers());
  const [form, setForm] = useState(empty);

  const employees = useMemo(
    () => users.filter((u) => u.role === 'employee'),
    [users]
  );
  const managers = useMemo(
    () => users.filter((u) => u.role === 'manager'),
    [users]
  );

  function refresh() {
    setProjects(mockApi.getProjects());
    setUsers(mockApi.getUsers());
  }

  function startEdit(p) {
    setForm({
      id: p.id,
      name: p.name,
      description: p.description || '',
      employeeIds: [...(p.employeeIds || [])],
      managerIds: [...(p.managerIds || [])],
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    try {
      mockApi.saveProject(form);
      setForm(empty());
      refresh();
    } catch (err) {
      alert(err.message || 'Ошибка');
    }
  }

  function handleDelete(id) {
    if (!confirm('Удалить проект?')) return;
    mockApi.deleteProject(id);
    refresh();
  }

  function toggleId(arr, id) {
    const s = new Set(arr);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    return [...s];
  }

  return (
    <div>
      <h2 className="app-title">Проекты</h2>
      <p style={{ color: 'var(--color-gray)', marginTop: 0 }}>
        Руководитель создаёт проекты и назначает в них сотрудников (и при
        необходимости других руководителей). Администратор может назначать проекты
        при редактировании пользователя.
      </p>

      <div className="panel">
        <h2>{form.id ? 'Редактирование проекта' : 'Новый проект'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Название</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="field">
            <label>Описание</label>
            <textarea
              className="textarea"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div className="field">
            <label>Сотрудники в проекте</label>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                maxHeight: 180,
                overflow: 'auto',
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: '0.5rem',
              }}
            >
              {employees.map((u) => (
                <label key={u.id} style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={form.employeeIds.includes(u.id)}
                    onChange={() =>
                      setForm((f) => ({
                        ...f,
                        employeeIds: toggleId(f.employeeIds, u.id),
                      }))
                    }
                  />
                  {u.fullName}
                </label>
              ))}
              {!employees.length && (
                <span style={{ color: 'var(--color-gray)' }}>
                  Нет сотрудников в справочнике
                </span>
              )}
            </div>
          </div>
          <div className="field">
            <label>Руководители проекта (необязательно)</label>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                maxHeight: 140,
                overflow: 'auto',
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: '0.5rem',
              }}
            >
              {managers.map((u) => (
                <label key={u.id} style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={form.managerIds.includes(u.id)}
                    onChange={() =>
                      setForm((f) => ({
                        ...f,
                        managerIds: toggleId(f.managerIds, u.id),
                      }))
                    }
                  />
                  {u.fullName}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn--primary">
              Сохранить
            </button>
            {form.id && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setForm(empty())}
              >
                Новый проект
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="panel">
        <h2>Список проектов</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Сотрудники</th>
                <th>Руководители</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>
                    {(p.employeeIds || [])
                      .map((id) => employees.find((u) => u.id === id)?.fullName)
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </td>
                  <td>
                    {(p.managerIds || [])
                      .map((id) => managers.find((u) => u.id === id)?.fullName)
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--outline"
                      style={{ padding: '0.35rem 0.75rem', marginRight: 4 }}
                      onClick={() => startEdit(p)}
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      className="btn btn--outline"
                      style={{ padding: '0.35rem 0.75rem' }}
                      onClick={() => handleDelete(p.id)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
