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
      { key: 'budget', label: 'Бюджет', type: 'number' },
    ],
  },
];

const ASSIGNEES = ['Иванов', 'Петров', 'Сидорова'];
export const MANAGER_DEPARTMENT = 'Отдел продаж';

function seedIfEmpty() {
  if (read(K.forms, null) !== null) return;

  const demoFormId = uid();
  const demoForm = {
    id: demoFormId,
    title: 'Отчёт о результатах',
    fields: [
      { id: 'f1', label: 'Название', type: 'text' },
      { id: 'f2', label: 'Сумма', type: 'number' },
      { id: 'f3', label: 'Дата', type: 'date' },
    ],
    createdAt: new Date().toISOString(),
  };

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
      extra: { goal: 'Рост участия', budget: 120000 },
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
}

function normalizeTask(t) {
  const due = t.dueDate;
  const today = new Date().toISOString().slice(0, 10);
  let status = t.status;
  if (status !== 'выполнено' && due < today) status = 'просрочено';
  return { ...t, status };
}

export const mockApi = {
  /* --- session (демо-вход) --- */
  getSession() {
    return read(K.session, { loggedIn: false });
  },
  setSession(s) {
    write(K.session, s);
  },

  /* --- формы --- */
  getForms() {
    seedIfEmpty();
    return read(K.forms, []);
  },
  saveForm({ title, fields }) {
    seedIfEmpty();
    const forms = read(K.forms, []);
    const row = {
      id: uid(),
      title: title.trim(),
      fields: fields.map((f) => ({
        id: f.id || uid(),
        label: f.label,
        type: f.type,
      })),
      createdAt: new Date().toISOString(),
    };
    forms.push(row);
    write(K.forms, forms);
    return row;
  },

  getResponses() {
    seedIfEmpty();
    return read(K.responses, []);
  },
  submitResponse({ formId, answers, submittedBy }) {
    seedIfEmpty();
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

  /* --- планы --- */
  getPlans() {
    seedIfEmpty();
    return read(K.plans, []);
  },
  createPlan(payload) {
    seedIfEmpty();
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
    seedIfEmpty();
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

  /* --- задачи --- */
  getTasksRaw() {
    seedIfEmpty();
    return read(K.tasks, []);
  },
  getTasks() {
    return this.getTasksRaw().map(normalizeTask);
  },
  createTask(payload) {
    seedIfEmpty();
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
    seedIfEmpty();
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
    seedIfEmpty();
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
