import { useMemo, useState } from 'react';
import { mockApi } from '../services/mockApi';

const emptyForm = () => ({
  id: '',
  fullName: '',
  email: '',
  role: 'employee',
  allDistricts: false,
  districtIds: [],
  projectIds: [],
});

export default function UsersAdmin() {
  const [users, setUsers] = useState(() => mockApi.getUsers());
  const [districts, setDistricts] = useState(() => mockApi.getDistricts());
  const [projects, setProjects] = useState(() => mockApi.getProjects());
  const [form, setForm] = useState(emptyForm);

  function refresh() {
    setUsers(mockApi.getUsers());
    setDistricts(mockApi.getDistricts());
    setProjects(mockApi.getProjects());
  }

  function startEdit(u) {
    setForm({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      allDistricts: Boolean(u.allDistricts),
      districtIds: [...(u.districtIds || [])],
      projectIds: [...(u.projectIds || [])],
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    try {
      mockApi.saveUser(form);
      setForm(emptyForm());
      refresh();
    } catch (err) {
      alert(err.message || 'Ошибка сохранения');
    }
  }

  function handleDelete(id) {
    if (!confirm('Удалить пользователя?')) return;
    mockApi.deleteUser(id);
    refresh();
  }

  const districtOptions = useMemo(() => districts, [districts]);

  return (
    <div>
      <h2 className="app-title">Пользователи и роли</h2>
      <p style={{ color: 'var(--color-gray)', marginTop: 0 }}>
        Руководитель или сотрудник; сотруднику назначается один район; руководителю —
        все районы или выбранные (сценарий 1).
      </p>

      <div className="panel">
        <h2>{form.id ? 'Редактирование' : 'Создание'} учётной записи</h2>
        <form onSubmit={handleSubmit} className="grid-2">
          <div className="field">
            <label>ФИО</label>
            <input
              className="input"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              required
            />
          </div>
          <div className="field">
            <label>Электронная почта</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Роль</label>
            <select
              className="select"
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  role: e.target.value,
                  districtIds: [],
                  allDistricts: false,
                  projectIds: [],
                }))
              }
            >
              <option value="manager">Руководитель</option>
              <option value="employee">Сотрудник</option>
            </select>
          </div>

          {form.role === 'manager' && (
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>
                <input
                  type="checkbox"
                  checked={form.allDistricts}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      allDistricts: e.target.checked,
                      districtIds: e.target.checked ? [] : f.districtIds,
                    }))
                  }
                />{' '}
                Доступ ко всем районам
              </label>
            </div>
          )}

          {form.role === 'manager' && !form.allDistricts && (
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Районы руководителя (несколько)</label>
              <select
                className="select"
                multiple
                size={Math.min(6, Math.max(3, districtOptions.length))}
                value={form.districtIds}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map(
                    (o) => o.value
                  );
                  setForm((f) => ({ ...f, districtIds: selected }));
                }}
              >
                {districtOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.role === 'employee' && (
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Район сотрудника (один)</label>
              <select
                className="select"
                value={form.districtIds[0] || ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    districtIds: e.target.value ? [e.target.value] : [],
                  }))
                }
                required
              >
                <option value="">— выберите —</option>
                {districtOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {(form.role === 'employee' || form.role === 'manager') && (
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Проекты участия (несколько)</label>
              <select
                className="select"
                multiple
                size={Math.min(6, Math.max(3, projects.length || 3))}
                value={form.projectIds}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map(
                    (o) => o.value
                  );
                  setForm((f) => ({ ...f, projectIds: selected }));
                }}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn--primary">
              Сохранить
            </button>
            {form.id && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setForm(emptyForm())}
              >
                Новый
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="panel">
        <h2>Список пользователей</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ФИО</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Районы</th>
                <th>Проекты</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.role === 'manager' ? 'Руководитель' : 'Сотрудник'}</td>
                  <td>
                    {u.allDistricts
                      ? 'Все'
                      : (u.districtIds || [])
                          .map(
                            (id) =>
                              districtOptions.find((d) => d.id === id)?.name || id
                          )
                          .join(', ') || '—'}
                  </td>
                  <td>
                    {(u.projectIds || [])
                      .map(
                        (id) => projects.find((p) => p.id === id)?.name || id
                      )
                      .join(', ') || '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--outline"
                      style={{ padding: '0.35rem 0.75rem', marginRight: 4 }}
                      onClick={() => startEdit(u)}
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      className="btn btn--outline"
                      style={{ padding: '0.35rem 0.75rem' }}
                      onClick={() => handleDelete(u.id)}
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
