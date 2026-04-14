import { useMemo, useState } from 'react';
import { mockApi } from '../services/mockApi';
import { useRole } from '../context/RoleContext';
import { Toast } from './Toast';
import avIvanov from '../../img/face-young-handsome-man_251136-17557.jpg';
import avPetrov from '../../img/confused-shocked-guy-raising-eyebrows-standing-stupor_176420-19590.jpg';
import avSidorova from '../../img/portrait-charming-young-lady-looking-confidently-camera-showing-her-natural-beauty-against_680097-1094.jpg';

const AVATAR = {
  Иванов: avIvanov,
  Петров: avPetrov,
  Сидорова: avSidorova,
};

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function Tasks() {
  const { filterTasks } = useRole();
  const [tasks, setTasks] = useState(() => mockApi.getTasks());
  const [toast, setToast] = useState('');

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState('Иванов');
  const [description, setDescription] = useState('');
  const [group, setGroup] = useState('Отдел продаж');

  const visible = useMemo(() => filterTasks(tasks), [tasks, filterTasks]);

  function refresh() {
    setTasks(mockApi.getTasks());
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    mockApi.createTask({
      title,
      dueDate,
      assignee,
      description,
      group,
    });
    setTitle('');
    setDueDate('');
    setDescription('');
    refresh();
    setToast('Задача создана');
  }

  function handleComplete(id) {
    mockApi.completeTask(id);
    refresh();
    setToast('Задача отмечена выполненной');
  }

  return (
    <div>
      <h2 className="app-title">Задачи</h2>
      {toast && <Toast message={toast} onClose={() => setToast('')} />}

      <div className="panel">
        <h2>Новая задача</h2>
        <form onSubmit={handleCreate} className="grid-2">
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
            <label>Срок</label>
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Ответственный</label>
            <select
              className="select"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            >
              {mockApi.assignees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Группа / отдел</label>
            <input
              className="input"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>Описание</label>
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <button type="submit" className="btn btn--primary">
              Создать задачу
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h2>Текущие задачи</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {visible.map((t) => {
            const accent =
              t.status === 'просрочено'
                ? '#ca2629'
                : t.status === 'выполнено'
                  ? '#2a9d8f'
                  : '#00c2ff';
            const dueSoon = t.dueDate === tomorrowISO() && t.status !== 'выполнено';
            return (
              <div
                key={t.id}
                style={{
                  background: '#1a1a1a',
                  color: '#fff',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  borderLeft: `4px solid ${accent}`,
                  position: 'relative',
                }}
              >
                <span style={{ position: 'absolute', top: 8, right: 8, opacity: 0.7 }}>
                  ↗
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img
                    src={AVATAR[t.assignee] || avIvanov}
                    alt=""
                    width={36}
                    height={36}
                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <strong>{t.title}</strong>
                    <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>
                      {t.assignee} · {t.group}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.9rem', margin: '0.75rem 0' }}>{t.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  <span className="badge badge--muted">до {t.dueDate}</span>
                  <span
                    className={
                      t.status === 'выполнено'
                        ? 'badge badge--ok'
                        : t.status === 'просрочено'
                          ? 'badge badge--danger'
                          : 'badge badge--warn'
                    }
                  >
                    {t.status}
                  </span>
                  {dueSoon && (
                    <span className="badge badge--warn">Дедлайн завтра</span>
                  )}
                </div>
                {t.status !== 'выполнено' && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => handleComplete(t.id)}
                    >
                      Выполнить
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <h2>Таблица задач</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Задача</th>
                <th>Срок</th>
                <th>Ответственный</th>
                <th>Группа</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.dueDate}</td>
                  <td>{t.assignee}</td>
                  <td>{t.group}</td>
                  <td>{t.status}</td>
                  <td>
                    {t.status !== 'выполнено' && (
                      <button
                        type="button"
                        className="btn btn--outline"
                        style={{ padding: '0.35rem 0.75rem' }}
                        onClick={() => handleComplete(t.id)}
                      >
                        Выполнить
                      </button>
                    )}
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
