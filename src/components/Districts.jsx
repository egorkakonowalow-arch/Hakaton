import { useState } from 'react';
import { mockApi } from '../services/mockApi';

export default function Districts() {
  const [list, setList] = useState(() => mockApi.getDistricts());
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  function refresh() {
    setList(mockApi.getDistricts());
  }

  function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    mockApi.saveDistrict({ name, code });
    setName('');
    setCode('');
    refresh();
  }

  function handleDelete(id) {
    if (!confirm('Удалить район?')) return;
    mockApi.deleteDistrict(id);
    refresh();
  }

  return (
    <div>
      <h2 className="app-title">Справочник: районы / муниципалитеты</h2>
      <p style={{ color: 'var(--color-gray)', marginTop: 0 }}>
        Администратор заводит районы, в которых работают сотрудники (сценарий 1).
      </p>

      <div className="panel">
        <h2>Добавить район</h2>
        <form
          onSubmit={handleAdd}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'flex-end',
          }}
        >
          <div className="field" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            <label>Название</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Город Чита"
              required
            />
          </div>
          <div className="field" style={{ flex: '1 1 160px', marginBottom: 0 }}>
            <label>Код</label>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="chita"
            />
          </div>
          <div style={{ flex: '0 0 auto', paddingBottom: 2 }}>
            <button type="submit" className="btn btn--primary">
              Добавить
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h2>Районы</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Код</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.code}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--outline"
                      style={{ padding: '0.35rem 0.75rem' }}
                      onClick={() => handleDelete(d.id)}
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
