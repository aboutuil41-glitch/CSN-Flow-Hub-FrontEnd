import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { getStatistics, updateRole, getLogs } from "../api/admin"
import { assignTask, createTask, getTasks } from "../api/tasks"
import { assignMember, getProjects } from "../api/projects"
import { getUser } from "../api/users"
import "../layouts/Admin.css"
import {
    Users,
    Folder,
    CircleCheck,
    Clock,
    CheckCheck,
    Paperclip,
    MessageCircle,
    Shield,
    UserPlus,
    Plus,
    UserCheck,
    Activity,
    ChevronLeft,
    ChevronRight,
    X,
} from "lucide-react"

const ACTION_COLORS = {
    created: "green",
    updated: "blue",
    deleted: "red",
    assigned: "yellow",
}

const roleSchema = z.object({
    userId: z.string().min(1, "Select a user"),
    role:   z.enum(["client", "team", "admin"]),
})

const memberSchema = z.object({
    projectId: z.string().min(1, "Select a project"),
    userId:    z.string().min(1, "Select a user"),
})

const taskSchema = z.object({
    projectId:   z.string().min(1, "Select a project"),
    title:       z.string().min(1, "Title is required").max(255, "Title is too long"),
    description: z.string().optional(),
})

const assignSchema = z.object({
    projectId: z.string().min(1, "Select a project"),
    taskId:    z.string().min(1, "Select a task"),
    userId:    z.string().min(1, "Select a user"),
})

function AdminBlock({ icon: Icon, title, children }) {
    return (
        <div className="admin-block">
            <div className="admin-block-header">
                <Icon size={18} />
                <span className="admin-block-title">{title}</span>
            </div>
            <div className="admin-block-body">
                {children}
            </div>
        </div>
    )
}

function FieldGroup({ label, error, children }) {
    return (
        <div className="admin-field-group">
            <span className="admin-field-label">{label}</span>
            {children}
            {error && <p className="error-text">{error}</p>}
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

    const { data: logsData, isLoading: logsLoading } = useQuery({
        queryKey: ["activity-logs", logFilters, logPage],
        queryFn: () => getLogs({ ...logFilters, action: ACTION_MAP[logFilters.action] ?? logFilters.action, page: logPage, per_page: 15 }).then(r => r.data.logs),
        keepPreviousData: true,
    })

    // ── Update role form ──
    const roleForm = useForm({
        resolver: zodResolver(roleSchema),
        defaultValues: { userId: "", role: "client" },
    })

    const updateRoleMutation = useMutation({
        mutationFn: ({ userId, role }) => updateRole(userId, role),
        onSuccess: () => { notify("Role updated"); roleForm.reset({ userId: "", role: "client" }) },
    })

    // ── Assign member form ──
    const memberForm = useForm({
        resolver: zodResolver(memberSchema),
        defaultValues: { projectId: "", userId: "" },
    })
    const memberProjectId = memberForm.watch("projectId")

    const assignMemberMutation = useMutation({
        mutationFn: ({ projectId, userId }) => assignMember(projectId, userId),
        onSuccess: () => { notify("Member assigned"); memberForm.reset({ projectId: "", userId: "" }) },
    })

    // ── Create task form ──
    const taskForm = useForm({
        resolver: zodResolver(taskSchema),
        defaultValues: { projectId: "", title: "", description: "" },
    })

    const createTaskMutation = useMutation({
        mutationFn: ({ projectId, title, description }) => createTask(projectId, { title, description }),
        onSuccess: () => { notify("Task created"); taskForm.reset({ projectId: "", title: "", description: "" }) },
    })

    // ── Assign task form ──
    const assignForm = useForm({
        resolver: zodResolver(assignSchema),
        defaultValues: { projectId: "", taskId: "", userId: "" },
    })
    const assignProjectId = assignForm.watch("projectId")

    const { data: projectTasks = [] } = useQuery({
        queryKey: ["tasks", assignProjectId],
        queryFn: () => getTasks(assignProjectId).then(r => r.data.tasks),
        enabled: !!assignProjectId,
    })

    const assignTaskMutation = useMutation({
        mutationFn: ({ taskId, userId }) => assignTask(taskId, userId),
        onSuccess: () => { notify("Task assigned"); assignForm.reset({ projectId: "", taskId: "", userId: "" }) },
    })

    const teamUsers = users.filter(u => u.role === "team")

    const unassignedTasks = projectTasks.filter(task => !task.assigned_to)

    const selectedProject = projects.find(p => p.id === Number(memberProjectId))

    const availableUsers = teamUsers.filter(
        user => !selectedProject?.users.some(projectUser => projectUser.id === user.id)
    )

    const selectedAssignProject = projects.find(p => p.id === Number(assignProjectId))

    const projectUsers = selectedAssignProject
        ? selectedAssignProject.users.filter(u => u.role === "team")
        : []

    const logs      = logsData?.data ?? []
    const logsMeta  = logsData ?? {}
    const totalPages = logsMeta.last_page ?? 1

    const applyLogFilters = (newFilters) => {
        setLogFilters(newFilters)
        setLogPage(1)
    }

    const STATS = [
        { icon: Users,         value: stats?.users?.total,       label: "Users" },
        { icon: Folder,        value: stats?.projects?.total,    label: "Projects" },
        { icon: CircleCheck,   value: stats?.projects?.completed,label: "Completed" },
        { icon: Clock,         value: stats?.tasks?.pending,      label: "Pending tasks" },
        { icon: CheckCheck,    value: stats?.tasks?.completed,    label: "Done tasks" },
        { icon: Paperclip,     value: stats?.files?.total,        label: "Files" },
        { icon: MessageCircle, value: stats?.feedback?.total,     label: "Feedback" },
    ]

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
                    {STATS.map(({ icon: Icon, value, label }) => (
                        <div className="admin-stat" key={label}>
                            <Icon size={20} />
                            <strong>{value ?? "—"}</strong>
                            <span>{label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Action blocks ── */}
            <div className="admin-grid">

                <AdminBlock icon={Shield} title="Update user role">
                    <form onSubmit={roleForm.handleSubmit(data => updateRoleMutation.mutate(data))}>
                        <FieldGroup label="User" error={roleForm.formState.errors.userId?.message}>
                            <select className="input" {...roleForm.register("userId")}>
                                <option value="">Select user...</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
                            </select>
                        </FieldGroup>
                        <FieldGroup label="New role" error={roleForm.formState.errors.role?.message}>
                            <select className="input" {...roleForm.register("role")}>
                                <option value="client">Client</option>
                                <option value="team">Team</option>
                                <option value="admin">Admin</option>
                            </select>
                        </FieldGroup>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={updateRoleMutation.isPending}
                        >
                            {updateRoleMutation.isPending ? "Updating..." : "Update role"}
                        </button>
                    </form>
                </AdminBlock>

                <AdminBlock icon={UserPlus} title="Assign member to project">
                    <form onSubmit={memberForm.handleSubmit(data => assignMemberMutation.mutate(data))}>
                        <FieldGroup label="Project" error={memberForm.formState.errors.projectId?.message}>
                            <select
                                className="input"
                                {...memberForm.register("projectId", { onChange: () => memberForm.setValue("userId", "") })}
                            >
                                <option value="">Select project...</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </FieldGroup>
                        <FieldGroup label="Member" error={memberForm.formState.errors.userId?.message}>
                            <select className="input" {...memberForm.register("userId")}>
                                <option value="">Select user...</option>
                                {availableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </FieldGroup>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={assignMemberMutation.isPending}
                        >
                            {assignMemberMutation.isPending ? "Assigning..." : "Assign member"}
                        </button>
                    </form>
                </AdminBlock>

                <AdminBlock icon={Plus} title="Create task">
                    <form onSubmit={taskForm.handleSubmit(data => createTaskMutation.mutate(data))}>
                        <FieldGroup label="Project" error={taskForm.formState.errors.projectId?.message}>
                            <select className="input" {...taskForm.register("projectId")}>
                                <option value="">Select project...</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </FieldGroup>
                        <FieldGroup label="Title" error={taskForm.formState.errors.title?.message}>
                            <input
                                className="input"
                                placeholder="Task title"
                                {...taskForm.register("title")}
                            />
                        </FieldGroup>
                        <FieldGroup label="Description" error={taskForm.formState.errors.description?.message}>
                            <textarea
                                className="input textarea"
                                placeholder="Description (optional)"
                                {...taskForm.register("description")}
                            />
                        </FieldGroup>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={createTaskMutation.isPending}
                        >
                            {createTaskMutation.isPending ? "Creating..." : "Create task"}
                        </button>
                    </form>
                </AdminBlock>

                <AdminBlock icon={UserCheck} title="Assign task">
                    <form onSubmit={assignForm.handleSubmit(data => assignTaskMutation.mutate(data))}>
                        <FieldGroup label="Project" error={assignForm.formState.errors.projectId?.message}>
                            <select
                                className="input"
                                {...assignForm.register("projectId", { onChange: () => assignForm.setValue("taskId", "") })}
                            >
                                <option value="">Select project...</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </FieldGroup>
                        <FieldGroup label="Task" error={assignForm.formState.errors.taskId?.message}>
                            <select
                                className="input"
                                {...assignForm.register("taskId")}
                                disabled={!assignProjectId}
                            >
                                <option value="">Select task...</option>
                                {unassignedTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                            </select>
                        </FieldGroup>
                        <FieldGroup label="Assign to" error={assignForm.formState.errors.userId?.message}>
                            <select className="input" {...assignForm.register("userId")}>
                                <option value="">Select user...</option>
                                {projectUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </FieldGroup>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={assignTaskMutation.isPending}
                        >
                            {assignTaskMutation.isPending ? "Assigning..." : "Assign task"}
                        </button>
                    </form>
                </AdminBlock>

            </div>

            {/* ── Activity Log ── */}
            <div className="admin-log">
                <div className="admin-log-header">
                    <div className="admin-log-title-row">
                        <Activity size={18} />
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
                                <X size={14} /> Clear
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
                            <ChevronLeft size={16} />
                        </button>
                        <span className="log-page-info">Page {logPage} of {totalPages}</span>
                        <button
                            className="btn btn-ghost"
                            onClick={() => setLogPage(p => Math.min(totalPages, p + 1))}
                            disabled={logPage === totalPages}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            {msg && <div className="admin-msg">{msg}</div>}

        </div>
    )
}

export default Admin