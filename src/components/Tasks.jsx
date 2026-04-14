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

const STAGES = [
  { value: 'получена', label: 'Получена' },
  { value: 'выполняется', label: 'Выполняется' },
  { value: 'выполнена', label: 'Выполнена' },
];

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function assigneeList() {
  const names = mockApi.getEmployeeNames();
  return names.length ? names : mockApi.assignees;
}

export default function Tasks() {
  const { filterTasks, role } = useRole();
  const isManager = role === 'manager';
  const isEmployee = role === 'executor';

  const [tasks, setTasks] = useState(() => mockApi.getTasks());
  const [toast, setToast] = useState('');
  const [sortBy, setSortBy] = useState('due');
  const [statusFilter, setStatusFilter] = useState('all'); // only for manager

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState(() => assigneeList()[0] || '');
  const [description, setDescription] = useState('');
  const [group, setGroup] = useState('Отдел продаж');
  const [editingTaskId, setEditingTaskId] = useState(null);

  const visible = useMemo(() => {
    let list = filterTasks(tasks);

    if (isManager && statusFilter !== 'all') {
      list = list.filter((t) => {
        if (statusFilter === 'done') {
          return t.reviewState === 'проверено';
        }
        if (statusFilter === 'received') {
          return (t.employeeStage || 'получена') === 'получена';
        }
        if (statusFilter === 'inprogress') {
          return (
            t.reviewState !== 'проверено' &&
            (t.employeeStage === 'выполняется' || !t.employeeStage)
          );
        }
        return true;
      });
    }

    const copy = [...list];
    if (sortBy === 'due') {
      copy.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    } else if (sortBy === 'title') {
      copy.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'stage') {
      copy.sort((a, b) =>
        (a.employeeStage || '').localeCompare(b.employeeStage || '')
      );
    }
    return copy;
  }, [tasks, filterTasks, sortBy, statusFilter, isManager]);

  function refresh() {
    setTasks(mockApi.getTasks());
    const list = assigneeList();
    if (list.length && !list.includes(assignee)) {
      setAssignee(list[0]);
    }
  }

  function resetForm() {
    setTitle('');
    setDueDate('');
    setDescription('');
    setGroup('Отдел продаж');
    const list = assigneeList();
    setAssignee(list[0] || '');
    setEditingTaskId(null);
  }

  function startEdit(task) {
    setEditingTaskId(task.id);
    setTitle(task.title || '');
    setDueDate(task.dueDate || '');
    setAssignee(task.assignee || assigneeList()[0] || '');
    setDescription(task.description || '');
    setGroup(task.group || 'Отдел продаж');
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!isManager || !title.trim() || !dueDate) return;
    if (editingTaskId) {
      mockApi.updateTask(editingTaskId, {
        title: title.trim(),
        dueDate,
        assignee,
        description,
        group,
      });
      setToast('Задача обновлена');
    } else {
      mockApi.createTask({
        title,
        dueDate,
        assignee,
        description,
        group,
      });
      setToast('Задача создана');
    }
    refresh();
    resetForm();
  }

  function handleDelete(id) {
    if (!confirm('Удалить задачу?')) return;
    mockApi.deleteTask(id);
    refresh();
    if (editingTaskId === id) resetForm();
    setToast('Задача удалена');
  }

  function setStage(id, employeeStage) {
    mockApi.setTaskEmployeeStage(id, employeeStage);
    refresh();
  }

  function handleFinish(id) {
    try {
      mockApi.submitTaskForReview(id);
      refresh();
      setToast('Отчёт сдан, задача отправлена руководителю на проверку');
    } catch (err) {
      alert(err.message || 'Ошибка');
    }
  }

  function handleApprove(id) {
    mockApi.approveTask(id);
    refresh();
    setToast('Задача завершена руководителем');
  }

  return (
    <div>
      <h2 className="app-title">Задачи</h2>
      {toast && <Toast message={toast} onClose={() => setToast('')} />}

      {isManager && (
        <div className="panel">
          <h2>{editingTaskId ? 'Изменить задачу' : 'Новая задача'}</h2>
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
              <label>Кто управляет / ответственный</label>
              <select
                className="select"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              >
                {assigneeList().map((a) => (
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
                {editingTaskId ? 'Сохранить изменения' : 'Создать задачу'}
              </button>
              {editingTaskId && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={resetForm}
                  style={{ marginLeft: 8 }}
                >
                  Отмена
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="panel">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '0.75rem',
          }}
        >
          <h2 style={{ margin: 0 }}>Текущие задачи</h2>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.9rem' }}>Сортировать по:</span>
              <select
                className="select"
                style={{ minWidth: 150 }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="due">Срок</option>
                <option value="title">Название</option>
                <option value="stage">Этап</option>
              </select>
            </label>
            {isManager && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.9rem' }}>Фильтр по статусу:</span>
                <select
                  className="select"
                  style={{ minWidth: 150 }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Все</option>
                  <option value="received">Только полученные</option>
                  <option value="inprogress">Выполняется</option>
                  <option value="done">Выполненные</option>
                </select>
              </label>
            )}
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {visible.map((t) => {
            const accent =
              t.reviewState === 'проверено'
                ? '#2a9d8f'
                : t.reviewState === 'на проверке'
                  ? '#f4a261'
                  : t.status === 'просрочено'
                    ? '#ca2629'
                    : '#00c2ff';
            const dueSoon =
              t.dueDate === tomorrowISO() && t.reviewState !== 'проверено';
            const locked =
              t.reviewState === 'на проверке' || t.reviewState === 'проверено';

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
                <span
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    opacity: 0.7,
                  }}
                >
                  {'\u2197'}
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
                <p style={{ fontSize: '0.9rem', margin: '0.75rem 0' }}>
                  {t.description}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  <span className="badge badge--muted">до {t.dueDate}</span>
                  <span className="badge badge--warn">
                    этап: {t.employeeStage || 'получена'}
                  </span>
                  <span
                    className={
                      t.reviewState === 'проверено'
                        ? 'badge badge--ok'
                        : t.reviewState === 'на проверке'
                          ? 'badge badge--warn'
                          : t.status === 'просрочено'
                            ? 'badge badge--danger'
                            : 'badge badge--muted'
                    }
                  >
                    {t.reviewState === 'проверено'
                      ? 'Проверено'
                      : t.reviewState === 'на проверке'
                        ? 'На проверке у руководителя'
                        : t.status}
                  </span>
                  {dueSoon && (
                    <span className="badge badge--warn">Дедлайн завтра</span>
                  )}
                </div>

                {isEmployee && !locked && (
                  <div className="field" style={{ marginTop: '0.75rem' }}>
                    <label style={{ color: '#ccc', fontSize: '0.85rem' }}>
                      Этап работы
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        background: '#111',
                        borderRadius: 10,
                        padding: '0.5rem 0.65rem',
                        border: '1px solid #2d2d2d',
                      }}
                    >
                      {STAGES.map((s) => (
                        <label
                          key={s.value}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: '0.92rem',
                            color: '#fff',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={(t.employeeStage || 'получена') === s.value}
                            onChange={() => setStage(t.id, s.value)}
                          />
                          {s.label}
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn btn--primary"
                      style={{ marginTop: '0.5rem', width: '100%' }}
                      onClick={() => handleFinish(t.id)}
                    >
                      Сдать отчёт
                    </button>
                  </div>
                )}

                {isManager && t.reviewState === 'на проверке' && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn btn--primary"
                      style={{ width: '100%' }}
                      onClick={() => handleApprove(t.id)}
                    >
                      Завершить задачу
                    </button>
                  </div>
                )}
                {isManager && (
                  <div
                    style={{
                      marginTop: '0.55rem',
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn--outline"
                      style={{ padding: '0.35rem 0.75rem' }}
                      onClick={() => startEdit(t)}
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      className="btn btn--outline"
                      style={{ padding: '0.35rem 0.75rem' }}
                      onClick={() => handleDelete(t.id)}
                    >
                      Удалить
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
                <th>Этап</th>
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
                  <td>{t.employeeStage || '—'}</td>
                  <td>
                    {t.reviewState === 'проверено'
                      ? 'Проверено'
                      : t.reviewState === 'на проверке'
                        ? 'На проверке'
                        : t.status}
                  </td>
                  <td>
                    {isEmployee &&
                      t.reviewState !== 'на проверке' &&
                      t.reviewState !== 'проверено' && (
                        <button
                          type="button"
                          className="btn btn--outline"
                          style={{ padding: '0.35rem 0.75rem' }}
                          onClick={() => handleFinish(t.id)}
                        >
                          Сдать отчёт
                        </button>
                      )}
                    {isManager && t.reviewState === 'на проверке' && (
                      <button
                        type="button"
                        className="btn btn--outline"
                        style={{ padding: '0.35rem 0.75rem' }}
                        onClick={() => handleApprove(t.id)}
                      >
                        Завершить задачу
                      </button>
                    )}
                    {isManager && (
                      <>
                        <button
                          type="button"
                          className="btn btn--outline"
                          style={{ padding: '0.35rem 0.75rem', marginLeft: 6 }}
                          onClick={() => startEdit(t)}
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          className="btn btn--outline"
                          style={{ padding: '0.35rem 0.75rem', marginLeft: 6 }}
                          onClick={() => handleDelete(t.id)}
                        >
                          Удалить
                        </button>
                      </>
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
