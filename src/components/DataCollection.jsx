import { useMemo, useState } from 'react';
import { mockApi } from '../services/mockApi';
import { useRole } from '../context/RoleContext';

const FIELD_TYPES = [
  { value: 'text', label: 'Текст' },
  { value: 'date', label: 'Дата' },
  { value: 'photo', label: 'Фото' },
];

function defaultRows() {
  return [
    { label: 'Поле 1', type: 'text', required: true },
    { label: 'Поле 2', type: 'date', required: true },
    { label: 'Фото', type: 'photo', required: false },
  ];
}

export default function DataCollection() {
  const { displayName, role } = useRole();
  const isAdmin = role === 'admin';
  const isEmployee = role === 'executor';
  const isManager = role === 'manager';

  const [forms, setForms] = useState(() => mockApi.getForms());
  const [responses, setResponses] = useState(() => mockApi.getResponses());

  const [title, setTitle] = useState('');
  const [rows, setRows] = useState(defaultRows);

  const [fillFormId, setFillFormId] = useState('');
  const [answers, setAnswers] = useState({});

  const formToFill = useMemo(
    () => forms.find((f) => f.id === fillFormId),
    [forms, fillFormId]
  );

  function addFieldRow() {
    setRows((r) => [
      ...r,
      { label: `Поле ${r.length + 1}`, type: 'text', required: true },
    ]);
  }

  function updateRow(i, patch) {
    setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }

  function removeRow(i) {
    setRows((r) => r.filter((_, j) => j !== i));
  }

  function handleCreateTemplate(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const saved = mockApi.saveForm({
      title,
      fields: rows.map((x) => ({
        label: x.label,
        type: x.type,
        required: Boolean(x.required),
      })),
    });
    setForms(mockApi.getForms());
    setTitle('');
    setRows(defaultRows());
    setFillFormId(saved.id);
  }

  function handlePhotoChange(fieldId, fileList) {
    const f = fileList?.[0];
    setAnswers((a) => ({
      ...a,
      [fieldId]: f ? f.name : '',
    }));
  }

  function submitFill(e) {
    e.preventDefault();
    if (!formToFill) return;
    for (const field of formToFill.fields) {
      if (!field.required) continue;
      const v = answers[field.id];
      if (v === undefined || v === null || String(v).trim() === '') {
        alert(`Обязательное поле: «${field.label}»`);
        return;
      }
    }
    mockApi.submitResponse({
      formId: formToFill.id,
      answers,
      submittedBy: displayName,
    });
    setResponses(mockApi.getResponses());
    setAnswers({});
    alert('Отчёт отправлен');
  }

  return (
    <div>
      <h2 className="app-title">Отчётность</h2>

      {isAdmin && (
        <>
          <div className="panel">
            <h2>Конструктор отчётов</h2>
            <form onSubmit={handleCreateTemplate}>
              <div className="field">
                <label>Название шаблона отчёта</label>
                <input
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              {rows.map((row, i) => (
                <div
                  key={i}
                  className="field"
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <input
                    className="input"
                    style={{ flex: 2, minWidth: 120 }}
                    value={row.label}
                    onChange={(e) => updateRow(i, { label: e.target.value })}
                  />
                  <select
                    className="select"
                    style={{ flex: 1, minWidth: 100 }}
                    value={row.type}
                    onChange={(e) => updateRow(i, { type: e.target.value })}
                  >
                    {FIELD_TYPES.map((ft) => (
                      <option key={ft.value} value={ft.value}>
                        {ft.label}
                      </option>
                    ))}
                  </select>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(row.required)}
                      onChange={(e) =>
                        updateRow(i, { required: e.target.checked })
                      }
                    />
                    Обязательное
                  </label>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => removeRow(i)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn--outline" onClick={addFieldRow}>
                + Поле
              </button>
              <div style={{ marginTop: '0.75rem' }}>
                <button type="submit" className="btn btn--primary">
                  Создать шаблон отчёта
                </button>
              </div>
            </form>
          </div>

          <div className="panel">
            <h2>Шаблоны отчётов</h2>
            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
              {forms.map((f) => (
                <li key={f.id}>
                  <strong>{f.title}</strong>{' '}
                  <span style={{ color: 'var(--color-gray)', fontSize: '0.85rem' }}>
                    ({f.fields.length} полей)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {(isEmployee || isManager || isAdmin) && (
        <div className="panel panel--accent">
          <h2>{isAdmin ? 'Проверка заполнения (демо)' : 'Заполнить отчёт'}</h2>
          <div className="field">
            <label>Шаблон</label>
            <select
              className="select"
              value={fillFormId}
              onChange={(e) => {
                setFillFormId(e.target.value);
                setAnswers({});
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
          {formToFill && (
            <form onSubmit={submitFill}>
              {formToFill.fields.map((field) => (
                <div key={field.id} className="field">
                  <label>
                    {field.label}
                    {field.required ? (
                      <span style={{ color: 'var(--color-red)' }}> *</span>
                    ) : (
                      <span style={{ color: 'var(--color-gray)', fontSize: '0.85rem' }}>
                        {' '}
                        (необязательно)
                      </span>
                    )}
                  </label>
                  {field.type === 'text' && (
                    <input
                      className="input"
                      value={answers[field.id] || ''}
                      onChange={(e) =>
                        setAnswers((a) => ({ ...a, [field.id]: e.target.value }))
                      }
                      required={field.required}
                    />
                  )}
                  {field.type === 'date' && (
                    <input
                      type="date"
                      className="input"
                      value={answers[field.id] || ''}
                      onChange={(e) =>
                        setAnswers((a) => ({ ...a, [field.id]: e.target.value }))
                      }
                      required={field.required}
                    />
                  )}
                  {field.type === 'photo' && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handlePhotoChange(field.id, e.target.files)
                        }
                      />
                      {answers[field.id] ? (
                        <div style={{ fontSize: '0.85rem', marginTop: 4 }}>
                          Файл: {answers[field.id]}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
              <button type="submit" className="btn btn--primary">
                Отправить отчёт
              </button>
            </form>
          )}
        </div>
      )}

      {(isAdmin || isManager) && (
        <div className="panel">
          <h2>{isAdmin ? 'Все отправленные отчёты' : 'Отчёты сотрудников'}</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Шаблон</th>
                  <th>Когда</th>
                  <th>Кто</th>
                  <th>Данные</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => {
                  const f = forms.find((x) => x.id === r.formId);
                  return (
                    <tr key={r.id}>
                      <td>{f?.title || r.formId}</td>
                      <td>{new Date(r.submittedAt).toLocaleString('ru-RU')}</td>
                      <td>{r.submittedBy}</td>
                      <td>
                        <code style={{ fontSize: '0.8rem' }}>
                          {JSON.stringify(r.answers)}
                        </code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isEmployee && responses.filter((r) => r.submittedBy === displayName).length > 0 && (
        <div className="panel">
          <h2>Мои отправленные отчёты</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Шаблон</th>
                  <th>Когда</th>
                  <th>Данные</th>
                </tr>
              </thead>
              <tbody>
                {responses
                  .filter((r) => r.submittedBy === displayName)
                  .map((r) => {
                    const f = forms.find((x) => x.id === r.formId);
                    return (
                      <tr key={r.id}>
                        <td>{f?.title || r.formId}</td>
                        <td>{new Date(r.submittedAt).toLocaleString('ru-RU')}</td>
                        <td>
                          <code style={{ fontSize: '0.8rem' }}>
                            {JSON.stringify(r.answers)}
                          </code>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
