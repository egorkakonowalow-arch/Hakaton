import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { mockApi, MANAGER_DEPARTMENT, ASSIGNEES } from '../services/mockApi';

function employeeNamesForDemo() {
  try {
    const n = mockApi.getEmployeeNames();
    return n.length ? n : [...ASSIGNEES];
  } catch {
    return [...ASSIGNEES];
  }
}

const RoleContext = createContext(null);

const ROLE_KEY = 'mgmt_role';
const EXEC_KEY = 'mgmt_exec';

function loadRole() {
  try {
    const r = localStorage.getItem(ROLE_KEY);
    if (r === 'admin' || r === 'manager' || r === 'executor') return r;
  } catch {
    /* ignore */
  }
  return 'admin';
}

function loadExec() {
  const names = employeeNamesForDemo();
  try {
    const e = localStorage.getItem(EXEC_KEY);
    if (names.includes(e)) return e;
  } catch {
    /* ignore */
  }
  return names[0];
}

export function RoleProvider({ children }) {
  const [role, setRoleState] = useState(loadRole);
  const [executorPerson, setExecutorPersonState] = useState(loadExec);

  const setRole = useCallback((r) => {
    setRoleState(r);
    localStorage.setItem(ROLE_KEY, r);
  }, []);

  const setExecutorPerson = useCallback((name) => {
    setExecutorPersonState(name);
    localStorage.setItem(EXEC_KEY, name);
  }, []);

  const displayName = 'Демо Пользователь';

  const filterTasks = useCallback(
    (tasks) => {
      if (role === 'admin') return [];
      if (role === 'manager') return tasks;
      return tasks.filter((t) => t.assignee === executorPerson);
    },
    [role, executorPerson]
  );

  const filterPlans = useCallback(
    (plans) => {
      if (role === 'admin') return plans;
      if (role === 'manager')
        return plans.filter((p) => p.department === MANAGER_DEPARTMENT);
      return plans.filter((p) => p.responsible === executorPerson);
    },
    [role, executorPerson]
  );

  const filterResponses = useCallback(
    (rows) => {
      if (role === 'admin' || role === 'manager') return rows;
      return rows.filter((r) => r.submittedBy === displayName);
    },
    [role, displayName]
  );

  /** Навигация по сценариям: админ — районы, пользователи, шаблоны отчётов; руководитель — планы/задачи/аналитика; сотрудник — задачи и отчёты. */
  const canSeeModule = useCallback((moduleId) => {
    if (moduleId === 'profile') return true;
    if (role === 'admin')
      return ['districts', 'users', 'data'].includes(moduleId);
    if (role === 'manager')
      return ['tasks', 'plans', 'analytics', 'data', 'projects'].includes(
        moduleId
      );
    if (role === 'executor') return ['tasks', 'data'].includes(moduleId);
    return false;
  }, [role]);

  const value = useMemo(
    () => ({
      role,
      setRole,
      executorPerson,
      setExecutorPerson,
      displayName,
      filterTasks,
      filterPlans,
      filterResponses,
      canSeeModule,
      ASSIGNEES,
      MANAGER_DEPARTMENT,
    }),
    [
      role,
      setRole,
      executorPerson,
      setExecutorPerson,
      displayName,
      filterTasks,
      filterPlans,
      filterResponses,
      canSeeModule,
    ]
  );

  return (
    <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole outside RoleProvider');
  return ctx;
}
