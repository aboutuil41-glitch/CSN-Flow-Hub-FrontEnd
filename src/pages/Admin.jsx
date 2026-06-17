import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getStatistics, updateRole, getLogs } from "../api/admin"
import { assignTask, createTask, getTasks } from "../api/tasks"
import { assignMember, getProjects } from "../api/projects"
import { getUser } from "../api/users"
import "../layouts/Admin.css"

const STAT_ICONS = {
    users:     "ti ti-users",
    projects:  "ti ti-folder",
    completed: "ti ti-circle-check",
    pending:   "ti ti-clock",
    done:      "ti ti-checks",
    files:     "ti ti-paperclip",
    feedback:  "ti ti-message",
}

const ACTION_COLORS = {
    created: "green",
    updated: "blue",
    deleted: "red",
    assigned: "yellow",
}

function AdminBlock({ icon, title, children }) {
    return (
        <div className="admin-block">
            <div className="admin-block-header">
                <i className={icon} />
                <span className="admin-block-title">{title}</span>
            </div>
            <div className="admin-block-body">
                {children}
            </div>
        </div>
    )
}

function FieldGroup({ label, children }) {
    return (
        <div className="admin-field-group">
            <span className="admin-field-label">{label}</span>
            {children}
        </div>
    )
}

function Admin() {
    const ACTION_MAP = {
    created: ["project.created", "task.created"],
    updated: ["project.update", "task.update"],
    deleted: ["project.delete", "task.delete"],
    assigned: ["task.assign", "project.assign"],
    }

    const queryClient = useQueryClient()
    const [msg, setMsg] = useState("")

    const [roleForm,    setRoleForm]    = useState({ userId: "", role: "client" })
    const [memberForm,  setMemberForm]  = useState({ projectId: "", userId: "" })
    const [taskForm,    setTaskForm]    = useState({ projectId: "", title: "", description: "" })
    const [assignForm,  setAssignForm]  = useState({ taskId: "", userId: "" })
    const [taskProject, setTaskProject] = useState("")

    const [logFilters, setLogFilters] = useState({ action: "", subject_type: "", user_id: "" })
    const [logPage,    setLogPage]    = useState(1)

    const notify = (text) => { setMsg(text); setTimeout(() => setMsg(""), 3000) }

    const { data: stats } = useQuery({
        queryKey: ["admin", "statistics"],
        queryFn: () => getStatistics().then(r => r.data),
    })

    const { data: users = [] } = useQuery({
        queryKey: ["users"],
        queryFn: () => getUser().then(r => r.data.users),
    })

    const { data: projects = [] } = useQuery({
        queryKey: ["projects"],
        queryFn: () => getProjects().then(r => r.data.projects),
    })

    const { data: projectTasks = [] } = useQuery({
        queryKey: ["tasks", taskProject],
        queryFn: () => getTasks(taskProject).then(r => r.data.tasks),
        enabled: !!taskProject,
    })

    const { data: logsData, isLoading: logsLoading } = useQuery({
        queryKey: ["activity-logs", logFilters, logPage],
        queryFn: () => getLogs({ ...logFilters, action: ACTION_MAP[logFilters.action] ?? logFilters.action, page: logPage, per_page: 15 }).then(r => r.data.logs),
        keepPreviousData: true,
    })

    const updateRoleMutation = useMutation({
        mutationFn: ({ userId, role }) => updateRole(userId, role),
        onSuccess: () => { notify("Role updated"); setRoleForm({ userId: "", role: "client" }) },
    })

    const assignMemberMutation = useMutation({
        mutationFn: ({ projectId, userId }) => assignMember(projectId, userId),
        onSuccess: () => { notify("Member assigned"); setMemberForm({ projectId: "", userId: "" }) },
    })

    const createTaskMutation = useMutation({
        mutationFn: ({ projectId, title, description }) => createTask(projectId, { title, description }),
        onSuccess: () => { notify("Task created"); setTaskForm({ projectId: "", title: "", description: "" }) },
    })

    const assignTaskMutation = useMutation({
        mutationFn: ({ taskId, userId }) => assignTask(taskId, userId),
        onSuccess: () => { notify("Task assigned"); setAssignForm({ taskId: "", userId: "" }); setTaskProject("") },
    })

    const teamUsers = users.filter(u => u.role === "team")

    const unassignedTasks = projectTasks.filter(task => !task.assigned_to);

    const selectedProject = projects.find(
        p => p.id === Number(memberForm.projectId)
    );

    const availableUsers = teamUsers.filter(
        user => !selectedProject?.users.some(
            projectUser => projectUser.id === user.id
        )
    );

    const selectedTaskProject = projects.find(
        p => p.id === Number(taskProject)
    );

    const projectUsers = selectedTaskProject
        ? selectedTaskProject.users.filter(u => u.role === "team")
        : [];

    const logs      = logsData?.data ?? []
    const logsMeta  = logsData ?? {}
    const totalPages = logsMeta.last_page ?? 1

    const applyLogFilters = (newFilters) => {
        setLogFilters(newFilters)
        setLogPage(1)
    }

    return (
        <div className="page admin-page">

            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Admin<span>.</span></h1>
                </div>
            </div>

            {/* ── Stats ── */}
            {stats && (
                <div className="admin-stats">
                    <div className="admin-stat">
                        <i className={STAT_ICONS.users} />
                        <strong>{stats.users?.total ?? "—"}</strong>
                        <span>Users</span>
                    </div>
                    <div className="admin-stat">
                        <i className={STAT_ICONS.projects} />
                        <strong>{stats.projects?.total ?? "—"}</strong>
                        <span>Projects</span>
                    </div>
                    <div className="admin-stat">
                        <i className={STAT_ICONS.completed} />
                        <strong>{stats.projects?.completed ?? "—"}</strong>
                        <span>Completed</span>
                    </div>
                    <div className="admin-stat">
                        <i className={STAT_ICONS.pending} />
                        <strong>{stats.tasks?.pending ?? "—"}</strong>
                        <span>Pending tasks</span>
                    </div>
                    <div className="admin-stat">
                        <i className={STAT_ICONS.done} />
                        <strong>{stats.tasks?.completed ?? "—"}</strong>
                        <span>Done tasks</span>
                    </div>
                    <div className="admin-stat">
                        <i className={STAT_ICONS.files} />
                        <strong>{stats.files?.total ?? "—"}</strong>
                        <span>Files</span>
                    </div>
                    <div className="admin-stat">
                        <i className={STAT_ICONS.feedback} />
                        <strong>{stats.feedback?.total ?? "—"}</strong>
                        <span>Feedback</span>
                    </div>
                </div>
            )}

            {/* ── Action blocks ── */}
            <div className="admin-grid">

                <AdminBlock icon="ti ti-shield" title="Update user role">
                    <FieldGroup label="User">
                        <select className="input" value={roleForm.userId} onChange={e => setRoleForm({ ...roleForm, userId: e.target.value })}>
                            <option value="">Select user...</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
                        </select>
                    </FieldGroup>
                    <FieldGroup label="New role">
                        <select className="input" value={roleForm.role} onChange={e => setRoleForm({ ...roleForm, role: e.target.value })}>
                            <option value="client">Client</option>
                            <option value="team">Team</option>
                            <option value="admin">Admin</option>
                        </select>
                    </FieldGroup>
                    <button
                        className="btn btn-primary"
                        onClick={() => updateRoleMutation.mutate(roleForm)}
                        disabled={!roleForm.userId || updateRoleMutation.isPending}
                    >
                        {updateRoleMutation.isPending ? "Updating..." : "Update role"}
                    </button>
                </AdminBlock>

                <AdminBlock icon="ti ti-user-plus" title="Assign member to project">
                    <FieldGroup label="Project">
                        <select className="input" value={memberForm.projectId} onChange={e => setMemberForm({ ...memberForm, projectId: e.target.value })}>
                            <option value="">Select project...</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </FieldGroup>
                    <FieldGroup label="Member">
                        <select className="input" value={memberForm.userId} onChange={e => setMemberForm({ ...memberForm, userId: e.target.value })}>
                            <option value="">Select user...</option>
                            {availableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </FieldGroup>
                    <button
                        className="btn btn-primary"
                        onClick={() => assignMemberMutation.mutate(memberForm)}
                        disabled={!memberForm.projectId || !memberForm.userId || assignMemberMutation.isPending}
                    >
                        {assignMemberMutation.isPending ? "Assigning..." : "Assign member"}
                    </button>
                </AdminBlock>

                <AdminBlock icon="ti ti-plus" title="Create task">
                    <FieldGroup label="Project">
                        <select className="input" value={taskForm.projectId} onChange={e => setTaskForm({ ...taskForm, projectId: e.target.value })}>
                            <option value="">Select project...</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </FieldGroup>
                    <FieldGroup label="Title">
                        <input
                            className="input"
                            placeholder="Task title"
                            value={taskForm.title}
                            onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                        />
                    </FieldGroup>
                    <FieldGroup label="Description">
                        <textarea
                            className="input textarea"
                            placeholder="Description (optional)"
                            value={taskForm.description}
                            onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                        />
                    </FieldGroup>
                    <button
                        className="btn btn-primary"
                        onClick={() => createTaskMutation.mutate(taskForm)}
                        disabled={!taskForm.projectId || !taskForm.title || createTaskMutation.isPending}
                    >
                        {createTaskMutation.isPending ? "Creating..." : "Create task"}
                    </button>
                </AdminBlock>

                <AdminBlock icon="ti ti-user-check" title="Assign task">
                    <FieldGroup label="Project">
                        <select
                            className="input"
                            value={taskProject}
                            onChange={e => { setTaskProject(e.target.value); setAssignForm({ ...assignForm, taskId: "" }) }}
                        >
                            <option value="">Select project...</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </FieldGroup>
                    <FieldGroup label="Task">
                        <select
                            key={taskProject}
                            className="input"
                            value={assignForm.taskId}
                            onChange={e => setAssignForm({ ...assignForm, taskId: e.target.value })}
                            disabled={!taskProject}
                        >
                            <option value="">Select task...</option>
                            {unassignedTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                        </select>
                    </FieldGroup>
                    <FieldGroup label="Assign to">
                        <select className="input" value={assignForm.userId} onChange={e => setAssignForm({ ...assignForm, userId: e.target.value })}>
                            <option value="">Select user...</option>
                            {projectUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </FieldGroup>
                    <button
                        className="btn btn-primary"
                        onClick={() => assignTaskMutation.mutate(assignForm)}
                        disabled={!assignForm.taskId || !assignForm.userId || assignTaskMutation.isPending}
                    >
                        {assignTaskMutation.isPending ? "Assigning..." : "Assign task"}
                    </button>
                </AdminBlock>

            </div>

            {/* ── Activity Log ── */}
            <div className="admin-log">
                <div className="admin-log-header">
                    <div className="admin-log-title-row">
                        <i className="ti ti-activity" />
                        <span className="admin-block-title">Activity log</span>
                    </div>
                    <div className="admin-log-filters">
                        <select
                            className="input"
                            value={logFilters.action}
                            onChange={e => applyLogFilters({ ...logFilters, action: e.target.value })}
                        >
                            <option value="">All actions</option>
                            <option value="created">Created</option>
                            <option value="updated">Updated</option>
                            <option value="deleted">Deleted</option>
                            <option value="assigned">Assigned</option>
                        </select>
                        <select
                            className="input"
                            value={logFilters.subject_type}
                            onChange={e => applyLogFilters({ ...logFilters, subject_type: e.target.value })}
                        >
                            <option value="">All types</option>
                            <option value="Task">Task</option>
                            <option value="Project">Project</option>
                            <option value="User">User</option>
                            <option value="File">File</option>
                        </select>
                        <select
                            className="input"
                            value={logFilters.user_id}
                            onChange={e => applyLogFilters({ ...logFilters, user_id: e.target.value })}
                        >
                            <option value="">All users</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        {(logFilters.action || logFilters.subject_type || logFilters.user_id) && (
                            <button
                                className="btn btn-ghost"
                                onClick={() => applyLogFilters({ action: "", subject_type: "", user_id: "" })}
                            >
                                <i className="ti ti-x" /> Clear
                            </button>
                        )}
                    </div>
                </div>

                {logsLoading ? (
                    <div className="state-loading" style={{ minHeight: 120 }}>Loading…</div>
                ) : logs.length === 0 ? (
                    <div className="state-empty">No activity found</div>
                ) : (
                    <div className="admin-log-table-wrap">
                        <table className="admin-log-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Subject</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td>
                                            <span className="log-user">{log.user?.name ?? "—"}</span>
                                            {log.user?.email && <span className="log-email">{log.user.email}</span>}
                                        </td>
                                        <td>
                                            <span className={`badge ${ACTION_COLORS[log.action] ?? "gray"}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td>
                                            {log.subject_type
                                                ? <span className="log-subject">{log.subject_type} <span className="log-subject-id">#{log.subject_id}</span></span>
                                                : <span className="log-none">—</span>
                                            }
                                        </td>
                                        <td className="log-date">
                                            {new Date(log.created_at).toLocaleString(undefined, {
                                                dateStyle: "medium",
                                                timeStyle: "short",
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="admin-log-pagination">
                        <button
                            className="btn btn-ghost"
                            onClick={() => setLogPage(p => Math.max(1, p - 1))}
                            disabled={logPage === 1}
                        >
                            <i className="ti ti-chevron-left" />
                        </button>
                        <span className="log-page-info">Page {logPage} of {totalPages}</span>
                        <button
                            className="btn btn-ghost"
                            onClick={() => setLogPage(p => Math.min(totalPages, p + 1))}
                            disabled={logPage === totalPages}
                        >
                            <i className="ti ti-chevron-right" />
                        </button>
                    </div>
                )}
            </div>

            {msg && <div className="admin-msg">{msg}</div>}

        </div>
    )
}

export default Admin