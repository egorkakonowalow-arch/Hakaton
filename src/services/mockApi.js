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
  districts: `${PREFIX}districts`,
  users: `${PREFIX}users`,
  projects: `${PREFIX}projects`,
};

let memorySession = { loggedIn: false };

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
    let required =
      f.required !== undefined
        ? Boolean(f.required)
        : type !== 'photo';
    if (type === 'photo') required = false;
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

  const uKuzmin = uid();
  const uIvanov = uid();
  const uPetrov = uid();
  const uSidorova = uid();

  const users = [
    {
      id: uKuzmin,
      fullName: 'Кузмин В.Б.',
      email: 'kuzmin@example.org',
      role: 'manager',
      allDistricts: true,
      districtIds: [],
      projectIds: [],
    },
    {
      id: uIvanov,
      fullName: 'Иванов',
      email: 'ivanov@example.org',
      role: 'employee',
      allDistricts: false,
      districtIds: [districtId],
      projectIds: [],
    },
    {
      id: uPetrov,
      fullName: 'Петров',
      email: 'petrov@example.org',
      role: 'employee',
      allDistricts: false,
      districtIds: [districtId],
      projectIds: [],
    },
    {
      id: uSidorova,
      fullName: 'Сидорова',
      email: 'sidorova@example.org',
      role: 'employee',
      allDistricts: false,
      districtIds: [districtId],
      projectIds: [],
    },
  ];

  const projectId = uid();
  users[0].projectIds = [projectId];
  users[1].projectIds = [projectId];
  users[2].projectIds = [projectId];
  users[3].projectIds = [projectId];

  const projects = [
    {
      id: projectId,
      name: 'Патриотическое воспитание',
      description: 'Демо-проект',
      employeeIds: [uIvanov, uPetrov, uSidorova],
      managerIds: [uKuzmin],
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
      employeeStage: 'получена',
      reviewState: null,
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
      employeeStage: 'выполняется',
      reviewState: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      title: 'Архив отчётов',
      dueDate: y(new Date(today.getTime() - 86400000 * 5)),
      assignee: 'Сидорова',
      description: 'Проверка документов',
      group: 'HR',
      status: 'в работе',
      employeeStage: 'выполнена',
      reviewState: 'проверено',
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
  write(K.projects, projects);
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
        projectIds: [],
      },
      {
        id: uid(),
        fullName: 'Иванов',
        email: 'ivanov@example.org',
        role: 'employee',
        allDistricts: false,
        districtIds: [d0],
        projectIds: [],
      },
      {
        id: uid(),
        fullName: 'Петров',
        email: 'petrov@example.org',
        role: 'employee',
        allDistricts: false,
        districtIds: [d0],
        projectIds: [],
      },
      {
        id: uid(),
        fullName: 'Сидорова',
        email: 'sidorova@example.org',
        role: 'employee',
        allDistricts: false,
        districtIds: [d0],
        projectIds: [],
      },
    ]);
  }
  if (read(K.projects, null) === null) write(K.projects, []);
}

function migrateTask(t) {
  let reviewState =
    t.reviewState === 'на проверке' || t.reviewState === 'проверено'
      ? t.reviewState
      : null;
  if (reviewState == null && t.status === 'выполнено') reviewState = 'проверено';
  return {
    ...t,
    employeeStage: t.employeeStage || 'получена',
    reviewState,
  };
}

function normalizeTask(t) {
  const m = migrateTask(t);
  const due = m.dueDate;
  const today = new Date().toISOString().slice(0, 10);
  let status = m.status || 'в работе';
  if (m.reviewState === 'проверено') {
    status = 'проверено';
  } else if (m.reviewState === 'на проверке') {
    status = 'на проверке';
  } else if (due < today && m.reviewState !== 'проверено') {
    status = 'просрочено';
  } else {
    status = 'в работе';
  }
  return { ...m, status };
}

function migrateUsersList(list) {
  return list.map((u) => ({
    ...u,
    projectIds: Array.isArray(u.projectIds) ? u.projectIds : [],
  }));
}

function syncProjectMembership(projectId, employeeIds, managerIds) {
  const users = migrateUsersList(read(K.users, []));
  const empSet = new Set(employeeIds || []);
  const mgrSet = new Set(managerIds || []);
  users.forEach((u) => {
    const pids = new Set(u.projectIds || []);
    if (u.role === 'employee') {
      if (empSet.has(u.id)) pids.add(projectId);
      else pids.delete(projectId);
    } else if (u.role === 'manager') {
      if (mgrSet.has(u.id)) pids.add(projectId);
      else pids.delete(projectId);
    }
    u.projectIds = [...pids];
  });
  write(K.users, users);
}

/** После сохранения пользователя — обновить составы project.employeeIds / managerIds */
function syncUserProjectsFromUserRow(user) {
  if (user.role !== 'employee' && user.role !== 'manager') return;
  const projects = read(K.projects, []);
  const want = new Set(user.projectIds || []);
  projects.forEach((p) => {
    const eids = new Set(p.employeeIds || []);
    const mids = new Set(p.managerIds || []);
    if (user.role === 'employee') {
      if (want.has(p.id)) eids.add(user.id);
      else eids.delete(user.id);
    } else {
      if (want.has(p.id)) mids.add(user.id);
      else mids.delete(user.id);
    }
    p.employeeIds = [...eids];
    p.managerIds = [...mids];
  });
  write(K.projects, projects);
}

export const mockApi = {
  getSession() {
    return memorySession;
  },
  setSession(s) {
    memorySession = { ...s };
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
    const raw = read(K.users, []);
    const list = migrateUsersList(raw);
    if (JSON.stringify(list) !== JSON.stringify(raw)) {
      write(K.users, list);
    }
    return list;
  },
  getProjects() {
    ensureDirectories();
    return read(K.projects, []);
  },
  saveProject(payload) {
    ensureDirectories();
    const list = read(K.projects, []);
    const row = {
      id: payload.id || uid(),
      name: (payload.name || '').trim(),
      description: (payload.description || '').trim(),
      employeeIds: Array.isArray(payload.employeeIds) ? payload.employeeIds : [],
      managerIds: Array.isArray(payload.managerIds) ? payload.managerIds : [],
    };
    if (!row.name) throw new Error('Укажите название проекта');
    const i = list.findIndex((p) => p.id === row.id);
    if (i >= 0) list[i] = row;
    else list.push(row);
    write(K.projects, list);
    syncProjectMembership(row.id, row.employeeIds, row.managerIds);
    return row;
  },
  deleteProject(id) {
    ensureDirectories();
    write(
      K.projects,
      read(K.projects, []).filter((p) => p.id !== id)
    );
    const users = migrateUsersList(read(K.users, []));
    users.forEach((u) => {
      u.projectIds = (u.projectIds || []).filter((pid) => pid !== id);
    });
    write(K.users, users);
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
      projectIds: Array.isArray(payload.projectIds) ? payload.projectIds : [],
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
    syncUserProjectsFromUserRow(row);
    return row;
  },
  deleteUser(id) {
    ensureDirectories();
    write(
      K.users,
      read(K.users, []).filter((u) => u.id !== id)
    );
    const projects = read(K.projects, []);
    projects.forEach((p) => {
      p.employeeIds = (p.employeeIds || []).filter((x) => x !== id);
      p.managerIds = (p.managerIds || []).filter((x) => x !== id);
    });
    write(K.projects, projects);
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
      fields: fields.map((f) => {
        const type = ['text', 'date', 'photo'].includes(f.type) ? f.type : 'text';
        const required = type === 'photo' ? false : Boolean(f.required);
        return {
          id: f.id || uid(),
          label: (f.label || '').trim(),
          type,
          required,
        };
      }),
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
      employeeStage: 'получена',
      reviewState: null,
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
  deleteTask(id) {
    ensureDirectories();
    const tasks = read(K.tasks, []).filter((t) => t.id !== id);
    write(K.tasks, tasks);
  },

  setTaskEmployeeStage(id, employeeStage) {
    const allowed = ['получена', 'выполняется', 'выполнена'];
    if (!allowed.includes(employeeStage)) return null;
    return this.updateTask(id, { employeeStage });
  },

  submitTaskForReview(id) {
    ensureDirectories();
    const tasks = read(K.tasks, []);
    const i = tasks.findIndex((t) => t.id === id);
    if (i < 0) return null;
    const t = tasks[i];
    if (t.reviewState === 'проверено') return normalizeTask(t);
    if (t.employeeStage !== 'выполнена') {
      throw new Error('Сначала отметьте этап «Выполнена»');
    }
    tasks[i] = {
      ...t,
      reviewState: 'на проверке',
      employeeStage: 'выполнена',
    };
    write(K.tasks, tasks);
    return normalizeTask(tasks[i]);
  },

  approveTask(id) {
    ensureDirectories();
    const tasks = read(K.tasks, []);
    const i = tasks.findIndex((t) => t.id === id);
    if (i < 0) return null;
    const t = tasks[i];
    if (t.reviewState !== 'на проверке') return normalizeTask(t);
    tasks[i] = {
      ...t,
      reviewState: 'проверено',
      completedAt: new Date().toISOString(),
    };
    write(K.tasks, tasks);
    return normalizeTask(tasks[i]);
  },

  getEmployeeNames() {
    return this.getUsers()
      .filter((u) => u.role === 'employee')
      .map((u) => u.fullName);
  },

  assignees: ASSIGNEES,
};

export { ASSIGNEES };
