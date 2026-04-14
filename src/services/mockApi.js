/**
 * mockApi — слой доступа к данным (localStorage).
 * Граница модуля: все ключи и сериализация сосредоточены здесь для замены на HTTP API.
 */

const PREFIX = 'mgmt_';

const K = {
  forms: `${PREFIX}forms`,
  responses: `${PREFIX}formResponses`,
  plans: `${PREFIX}plans`,
  tasks: `${PREFIX}tasks`,
  session: `${PREFIX}session`,
  districts: `${PREFIX}districts`,
  users: `${PREFIX}users`,
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

/** Предустановленные шаблоны планов */
export const PLAN_TEMPLATES = [
  {
    id: 'blank',
    name: 'Пустой',
    fields: [],
  },
  {
    id: 'event',
    name: 'Мероприятие',
    fields: [
      { key: 'goal', label: 'Цель', type: 'text' },
      { key: 'budget', label: 'Бюджет', type: 'text' },
    ],
  },
];

const ASSIGNEES = ['Иванов', 'Петров', 'Сидорова'];
export const MANAGER_DEPARTMENT = 'Отдел продаж';

function migrateReportFields(fields) {
  if (!Array.isArray(fields)) return [];
  return fields.map((f) => {
    let type = f.type;
    if (type === 'number' || type === 'file') type = 'photo';
    if (!['text', 'date', 'photo'].includes(type)) type = 'text';
    const required =
      f.required !== undefined
        ? Boolean(f.required)
        : type !== 'photo';
    return { ...f, type, required };
  });
}

function migrateFormsList(forms) {
  return forms.map((form) => ({
    ...form,
    fields: migrateReportFields(form.fields),
  }));
}

function seedIfEmpty() {
  if (read(K.forms, null) !== null) return;

  const demoFormId = uid();
  const demoForm = {
    id: demoFormId,
    title: 'Ежемесячный отчёт о мероприятии',
    fields: [
      { id: 'f1', label: 'Название мероприятия', type: 'text', required: true },
      { id: 'f2', label: 'Дата проведения', type: 'date', required: true },
      { id: 'f3', label: 'Фото мероприятия', type: 'photo', required: false },
    ],
    createdAt: new Date().toISOString(),
  };

  const districtId = uid();
  const districts = [
    { id: districtId, name: 'Город Чита', code: 'chita' },
    { id: uid(), name: 'Борозинский район', code: 'borozinsky' },
  ];

  const users = [
    {
      id: uid(),
      fullName: 'Кузмин В.Б.',
      email: 'kuzmin@example.org',
      role: 'manager',
      allDistricts: true,
      districtIds: [],
    },
    {
      id: uid(),
      fullName: 'Иванов',
      email: 'ivanov@example.org',
      role: 'employee',
      allDistricts: false,
      districtIds: [districtId],
    },
    {
      id: uid(),
      fullName: 'Петров',
      email: 'petrov@example.org',
      role: 'employee',
      allDistricts: false,
      districtIds: [districtId],
    },
    {
      id: uid(),
      fullName: 'Сидорова',
      email: 'sidorova@example.org',
      role: 'employee',
      allDistricts: false,
      districtIds: [districtId],
    },
  ];

  const today = new Date();
  const y = (d) => d.toISOString().slice(0, 10);

  const tasks = [
    {
      id: uid(),
      title: 'Подготовить сводку',
      dueDate: y(today),
      assignee: 'Иванов',
      description: 'Сбор цифр за квартал',
      group: MANAGER_DEPARTMENT,
      status: 'в работе',
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      title: 'Согласовать план',
      dueDate: y(new Date(today.getTime() - 86400000 * 2)),
      assignee: 'Петров',
      description: 'Встреча с командой',
      group: MANAGER_DEPARTMENT,
      status: 'в работе',
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      title: 'Архив отчётов',
      dueDate: y(new Date(today.getTime() - 86400000 * 5)),
      assignee: 'Сидорова',
      description: 'Проверка документов',
      group: 'HR',
      status: 'выполнено',
      completedAt: new Date(today.getTime() - 86400000 * 3).toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  const plans = [
    {
      id: uid(),
      title: 'Весенний проект',
      type: 'проект',
      start: y(new Date(today.getTime() - 86400000 * 10)),
      end: y(new Date(today.getTime() + 86400000 * 20)),
      responsible: 'Иванов',
      department: MANAGER_DEPARTMENT,
      templateId: 'event',
      extra: { goal: 'Рост участия', budget: '120000' },
      history: [
        {
          at: new Date().toISOString(),
          user: 'Admin',
          change: 'План создан',
        },
      ],
    },
  ];

  write(K.forms, [demoForm]);
  write(K.responses, []);
  write(K.plans, plans);
  write(K.tasks, tasks);
  write(K.districts, districts);
  write(K.users, users);
}

function ensureDirectories() {
  seedIfEmpty();
  if (read(K.districts, null) === null) write(K.districts, []);
  if (read(K.users, null) === null) write(K.users, []);

  const districts = read(K.districts, []);
  const users = read(K.users, []);
  const forms = read(K.forms, []);
  if (forms.length && !districts.length && !users.length) {
    const id = uid();
    write(K.districts, [
      { id, name: 'Город Чита', code: 'chita' },
      { id: uid(), name: 'Борозинский район', code: 'borozinsky' },
    ]);
    const d0 = read(K.districts, [])[0]?.id || id;
    write(K.users, [
      {
        id: uid(),
        fullName: 'Кузмин В.Б.',
        email: 'kuzmin@example.org',
        role: 'manager',
        allDistricts: true,
        districtIds: [],
      },
      {
        id: uid(),
        fullName: 'Иванов',
        email: 'ivanov@example.org',
        role: 'employee',
        allDistricts: false,
        districtIds: [d0],
      },
      {
        id: uid(),
        fullName: 'Петров',
        email: 'petrov@example.org',
        role: 'employee',
        allDistricts: false,
        districtIds: [d0],
      },
      {
        id: uid(),
        fullName: 'Сидорова',
        email: 'sidorova@example.org',
        role: 'employee',
        allDistricts: false,
        districtIds: [d0],
      },
    ]);
  }
}

function normalizeTask(t) {
  const due = t.dueDate;
  const today = new Date().toISOString().slice(0, 10);
  let status = t.status;
  if (status !== 'выполнено' && due < today) status = 'просрочено';
  return { ...t, status };
}

export const mockApi = {
  getSession() {
    return read(K.session, { loggedIn: false });
  },
  setSession(s) {
    write(K.session, s);
  },

  getDistricts() {
    ensureDirectories();
    return read(K.districts, []);
  },
  saveDistrict({ name, code }) {
    ensureDirectories();
    const list = read(K.districts, []);
    const row = {
      id: uid(),
      name: name.trim(),
      code: (code || '').trim().toLowerCase(),
    };
    list.push(row);
    write(K.districts, list);
    return row;
  },
  deleteDistrict(id) {
    ensureDirectories();
    const list = read(K.districts, []).filter((d) => d.id !== id);
    write(K.districts, list);
  },

  getUsers() {
    ensureDirectories();
    return read(K.users, []);
  },
  saveUser(payload) {
    ensureDirectories();
    const list = read(K.users, []);
    const row = {
      id: payload.id || uid(),
      fullName: payload.fullName.trim(),
      email: (payload.email || '').trim(),
      role: payload.role,
      allDistricts: Boolean(payload.allDistricts),
      districtIds: Array.isArray(payload.districtIds) ? payload.districtIds : [],
    };
    if (row.role === 'employee' && row.districtIds.length !== 1) {
      throw new Error('Сотруднику нужен ровно один район');
    }
    if (row.role === 'manager' && !row.allDistricts && !row.districtIds.length) {
      throw new Error('Укажите районы или «Все районы»');
    }
    const i = list.findIndex((u) => u.id === row.id);
    if (i >= 0) list[i] = row;
    else list.push(row);
    write(K.users, list);
    return row;
  },
  deleteUser(id) {
    ensureDirectories();
    write(
      K.users,
      read(K.users, []).filter((u) => u.id !== id)
    );
  },

  getForms() {
    seedIfEmpty();
    const forms = read(K.forms, []);
    const migrated = migrateFormsList(forms);
    if (JSON.stringify(migrated) !== JSON.stringify(forms)) {
      write(K.forms, migrated);
    }
    return migrated;
  },
  saveForm({ title, fields }) {
    ensureDirectories();
    const forms = read(K.forms, []);
    const row = {
      id: uid(),
      title: title.trim(),
      fields: fields.map((f) => ({
        id: f.id || uid(),
        label: (f.label || '').trim(),
        type: ['text', 'date', 'photo'].includes(f.type) ? f.type : 'text',
        required: Boolean(f.required),
      })),
      createdAt: new Date().toISOString(),
    };
    forms.push(row);
    write(K.forms, forms);
    return row;
  },

  getResponses() {
    ensureDirectories();
    return read(K.responses, []);
  },
  submitResponse({ formId, answers, submittedBy }) {
    ensureDirectories();
    const list = read(K.responses, []);
    const row = {
      id: uid(),
      formId,
      answers,
      submittedAt: new Date().toISOString(),
      submittedBy: submittedBy || 'Гость',
    };
    list.push(row);
    write(K.responses, list);
    return row;
  },

  getPlans() {
    ensureDirectories();
    return read(K.plans, []);
  },
  createPlan(payload) {
    ensureDirectories();
    const plans = read(K.plans, []);
    const row = {
      id: uid(),
      title: payload.title.trim(),
      type: payload.type,
      start: payload.start,
      end: payload.end,
      responsible: payload.responsible,
      department: payload.department || MANAGER_DEPARTMENT,
      templateId: payload.templateId || 'blank',
      extra: payload.extra || {},
      history: [
        {
          at: new Date().toISOString(),
          user: 'Admin',
          change: 'План создан',
        },
      ],
    };
    plans.push(row);
    write(K.plans, plans);
    return row;
  },
  updatePlan(id, payload) {
    ensureDirectories();
    const plans = read(K.plans, []);
    const i = plans.findIndex((p) => p.id === id);
    if (i < 0) return null;
    const prev = plans[i];
    const next = {
      ...prev,
      ...payload,
      history: [
        ...(prev.history || []),
        {
          at: new Date().toISOString(),
          user: 'Admin',
          change: `Обновление: ${JSON.stringify(payload)}`,
        },
      ],
    };
    plans[i] = next;
    write(K.plans, plans);
    return next;
  },

  getTasksRaw() {
    ensureDirectories();
    return read(K.tasks, []);
  },
  getTasks() {
    return this.getTasksRaw().map(normalizeTask);
  },
  createTask(payload) {
    ensureDirectories();
    const tasks = read(K.tasks, []);
    const row = {
      id: uid(),
      title: payload.title.trim(),
      dueDate: payload.dueDate,
      assignee: payload.assignee,
      description: payload.description || '',
      group: payload.group || MANAGER_DEPARTMENT,
      status: 'в работе',
      createdAt: new Date().toISOString(),
    };
    tasks.push(row);
    write(K.tasks, tasks);
    return normalizeTask(row);
  },
  completeTask(id) {
    ensureDirectories();
    const tasks = read(K.tasks, []);
    const i = tasks.findIndex((t) => t.id === id);
    if (i < 0) return null;
    tasks[i] = {
      ...tasks[i],
      status: 'выполнено',
      completedAt: new Date().toISOString(),
    };
    write(K.tasks, tasks);
    return normalizeTask(tasks[i]);
  },
  updateTask(id, patch) {
    ensureDirectories();
    const tasks = read(K.tasks, []);
    const i = tasks.findIndex((t) => t.id === id);
    if (i < 0) return null;
    tasks[i] = { ...tasks[i], ...patch };
    write(K.tasks, tasks);
    return normalizeTask(tasks[i]);
  },

  assignees: ASSIGNEES,
};

export { ASSIGNEES };
