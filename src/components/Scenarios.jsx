const scenarioModules = import.meta.glob('../../img/**/*.{png,jpg,jpeg}', {
  eager: true,
  import: 'default',
});

function collectScenarioImages() {
  const entries = Object.entries(scenarioModules).filter(([path]) =>
    /сценарий|scenario/i.test(path)
  );
  entries.sort(([a], [b]) => a.localeCompare(b, 'ru'));
  return entries.map(([path, url]) => ({
    path,
    url,
    title: path.split('/').pop().replace(/\.[^.]+$/, ''),
  }));
}

export default function Scenarios() {
  const imgs = collectScenarioImages();

  return (
    <div>
      <h2 className="app-title">Сценарии работы</h2>
      <p style={{ color: 'var(--color-gray)', marginTop: 0 }}>
        Блок-схемы для ролей администратора, руководителя и сотрудника. Добавьте в
        папку <code>img</code> файлы PNG/JPEG, в имени которых есть «сценарий» или
        «scenario» (например <code>Сценарий 1.png</code>, <code>сценарий 3.png</code>
        ).
      </p>

      {imgs.length === 0 && (
        <div className="panel">
          <p>
            Изображения не найдены. Скопируйте файлы сценариев в{' '}
            <strong>img/</strong> проекта.
          </p>
        </div>
      )}

      {imgs.map((item, i) => (
        <div key={item.path} className="panel" style={{ marginBottom: '1rem' }}>
          <h2 style={{ marginTop: 0 }}>
            Сценарий {i + 1}
            <span
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-gray)',
                fontWeight: 400,
                marginLeft: 8,
              }}
            >
              ({item.title})
            </span>
          </h2>
          <img
            src={item.url}
            alt={item.title}
            style={{
              width: '100%',
              maxWidth: '100%',
              height: 'auto',
              borderRadius: 'var(--radius-md)',
            }}
          />
        </div>
      ))}
    </div>
  );
}
