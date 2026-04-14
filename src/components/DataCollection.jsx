import { useMemo, useState } from 'react';
import { mockApi } from '../services/mockApi';
import { useRole } from '../context/RoleContext';

const FIELD_TYPES = [
  { value: 'text', label: 'Текст' },
  { value: 'number', label: 'Число' },
  { value: 'date', label: 'Дата' },
  { value: 'file', label: 'Файл (имя)' },
];

export default function DataCollection() {
  const { displayName } = useRole();
  const [forms, setForms] = useState(() => mockApi.getForms());
  const [responses, setResponses] = useState(() => mockApi.getResponses());

  const [title, setTitle] = useState('');
  const [rows, setRows] = useState([
    { label: 'Поле 1', type: 'text' },
  ]);

  const [fillFormId, setFillFormId] = useState('');
  const [answers, setAnswers] = useState({});

  const formToFill = useMemo(
    () => forms.find((f) => f.id === fillFormId),
    [forms, fillFormId]
  );

  function addFieldRow() {
    setRows((r) => [...r, { label: `Поле ${r.length + 1}`, type: 'text' }]);
  }

  function updateRow(i, patch) {
    setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }

  function removeRow(i) {
    setRows((r) => r.filter((_, j) => j !== i));
  }

  function handleCreateForm(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const saved = mockApi.saveForm({
      title,
      fields: rows.map((x) => ({
        label: x.label,
        type: x.type,
      })),
    });
    setForms(mockApi.getForms());
    setTitle('');
    setRows([{ label: 'Поле 1', type: 'text' }]);
    setFillFormId(saved.id);
  }

  function handleFileChange(fieldId, fileList) {
    const f = fileList?.[0];
    setAnswers((a) => ({
      ...a,
      [fieldId]: f ? f.name : '',
    }));
  }

  function submitFill(e) {
    e.preventDefault();
    if (!formToFill) return;
    mockApi.submitResponse({
      formId: formToFill.id,
      answers,
      submittedBy: displayName,
    });
    setResponses(mockApi.getResponses());
    setAnswers({});
  }

  return (
    <div>
      <h2 className="app-title">Сбор и хранение данных</h2>

      <div className="panel">
        <h2>Конструктор формы</h2>
        <form onSubmit={handleCreateForm}>
          <div className="field">
            <label>Название формы</label>
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
              style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
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
              Создать форму
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h2>Созданные формы</h2>
        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
          {forms.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'inherit',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
                onClick={() => {
                  setFillFormId(f.id);
                  setAnswers({});
                }}
              >
                {f.title}
              </button>{' '}
              <span style={{ color: 'var(--color-gray)', fontSize: '0.85rem' }}>
                ({f.fields.length} полей)
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel panel--accent">
        <h2>Заполнение формы</h2>
        <div className="field">
          <label>Выберите форму</label>
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
                <label>{field.label}</label>
                {field.type === 'text' && (
                  <input
                    className="input"
                    value={answers[field.id] || ''}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, [field.id]: e.target.value }))
                    }
                  />
                )}
                {field.type === 'number' && (
                  <input
                    type="number"
                    className="input"
                    value={answers[field.id] ?? ''}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, [field.id]: e.target.value }))
                    }
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
                  />
                )}
                {field.type === 'file' && (
                  <input
                    type="file"
                    onChange={(e) =>
                      handleFileChange(field.id, e.target.files)
                    }
                  />
                )}
              </div>
            ))}
            <button type="submit" className="btn btn--primary">
              Отправить
            </button>
          </form>
        )}
      </div>

      <div className="panel">
        <h2>Ответы</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Форма</th>
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
    </div>
  );
}
