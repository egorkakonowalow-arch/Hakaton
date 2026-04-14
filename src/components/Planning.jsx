import { useState } from 'react';
import {
  mockApi,
  PLAN_TEMPLATES,
  MANAGER_DEPARTMENT,
} from '../services/mockApi';

const PLAN_TYPES = [
  { value: 'отделение', label: 'Отделение' },
  { value: 'мероприятие', label: 'Мероприятие' },
  { value: 'проект', label: 'Проект' },
];

export default function Planning() {
  const [plans, setPlans] = useState(() => mockApi.getPlans());
  const [editingId, setEditingId] = useState(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState('проект');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [responsible, setResponsible] = useState('Иванов');
  const [department, setDepartment] = useState(MANAGER_DEPARTMENT);
  const [templateId, setTemplateId] = useState('blank');
  const [extra, setExtra] = useState({});

  const tpl = PLAN_TEMPLATES.find((t) => t.id === templateId);

  function resetForm() {
    setTitle('');
    setType('проект');
    setStart('');
    setEnd('');
    setResponsible('Иванов');
    setDepartment(MANAGER_DEPARTMENT);
    setTemplateId('blank');
    setExtra({});
    setEditingId(null);
  }

  function startEdit(p) {
    setEditingId(p.id);
    setTitle(p.title);
    setType(p.type);
    setStart(p.start);
    setEnd(p.end);
    setResponsible(p.responsible);
    setDepartment(p.department || MANAGER_DEPARTMENT);
    setTemplateId(p.templateId || 'blank');
    setExtra(p.extra || {});
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !start || !end) return;
    if (editingId) {
      mockApi.updatePlan(editingId, {
        title: title.trim(),
        type,
        start,
        end,
        responsible,
        department,
        templateId,
        extra,
      });
    } else {
      mockApi.createPlan({
        title: title.trim(),
        type,
        start,
        end,
        responsible,
        department,
        templateId,
        extra,
      });
    }
    setPlans(mockApi.getPlans());
    resetForm();
  }

  return (
    <div>
      <h2 className="app-title">Планирование деятельности</h2>

      <div className="panel">
        <h2>{editingId ? 'Редактирование плана' : 'Конструктор планов'}</h2>
        <form onSubmit={handleSubmit} className="grid-2">
          <div className="field">
            <label>Название</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Тип</label>
            <select
              className="select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {PLAN_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Дата начала</label>
            <input
              type="date"
              className="input"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Дата окончания</label>
            <input
              type="date"
              className="input"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Ответственный</label>
            <select
              className="select"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
            >
              {mockApi.assignees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Подразделение / зона</label>
            <input
              className="input"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>Шаблон плана</label>
            <select
              className="select"
              value={templateId}
              onChange={(e) => {
                setTemplateId(e.target.value);
                setExtra({});
              }}
            >
              {PLAN_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          {tpl?.fields?.map((f) => (
            <div key={f.key} className="field">
              <label>{f.label}</label>
              <input
                className="input"
                value={extra[f.key] || ''}
                onChange={(e) =>
                  setExtra((x) => ({ ...x, [f.key]: e.target.value }))
                }
              />
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn--primary">
              {editingId ? 'Сохранить' : 'Создать план'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={resetForm}
              >
                Отмена
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="panel">
        <h2>Планы</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Тип</th>
                <th>Сроки</th>
                <th>Ответственный</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>{p.type}</td>
                  <td>
                    {p.start} — {p.end}
                  </td>
                  <td>{p.responsible}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--outline"
                      style={{ padding: '0.35rem 0.75rem' }}
                      onClick={() => startEdit(p)}
                    >
                      Изменить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h2>История изменений</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Пользователь</th>
                <th>Событие</th>
                <th>План</th>
              </tr>
            </thead>
            <tbody>
              {plans.flatMap((p) =>
                (p.history || []).map((h, i) => (
                  <tr key={`${p.id}-${i}`}>
                    <td>{new Date(h.at).toLocaleString('ru-RU')}</td>
                    <td>{h.user}</td>
                    <td>{h.change}</td>
                    <td>{p.title}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
