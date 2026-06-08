import { useQuery } from "@tanstack/react-query"
import { getDashboard } from "../api/dashboard"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../layouts/Dashboard.css"


const STATUS_DOT   = { pending: "pending", in_progress: "in_progress", completed: "completed", blocked: "blocked" }
const STATUS_BADGE = { pending: "gray", in_progress: "yellow", completed: "green", blocked: "red", on_hold: "red", planning: "blue" }
const STATUS_LABEL = { pending: "Pending", in_progress: "In progress", completed: "Completed", blocked: "Blocked", on_hold: "On hold", planning: "Planning" }
const AV_COLORS    = ["av-gold", "av-blue", "av-purple"]

function TaskRow({ name, status }) {
    return (
        <div className="task-row">
            <div className={`task-dot ${STATUS_DOT[status] ?? "pending"}`} />
            <span className="task-row-name">{name}</span>
            <span className={`badge ${STATUS_BADGE[status] ?? "gray"}`}>
                {STATUS_LABEL[status] ?? status}
            </span>
        </div>
    )
}

function ProjCard({ name, desc, status, members = [], taskCount }) {
    return (
        <div className="proj-card">
            <div className="proj-card-top">
                <span className="proj-card-name">{name}</span>
                <span className={`badge ${STATUS_BADGE[status] ?? "gray"}`}>
                    {STATUS_LABEL[status] ?? status}
                </span>
            </div>
            {desc && <div className="proj-card-desc">{desc}</div>}
            <div className="proj-card-footer">
                <div className="proj-members">
                    {members.slice(0, 3).map((m, i) => (
                        <div key={m.id ?? i} className={`avatar ${AV_COLORS[i % AV_COLORS.length]}`}>
                            {m.name.slice(0, 2).toUpperCase()}
                        </div>
                    ))}
                </div>
                {taskCount != null && (
                    <span className="proj-task-count">{taskCount} tasks</span>
                )}
            </div>
        </div>
    )
}

function Dashboard() {
    const { user } = useAuth()
    const { data, isLoading, error } = useQuery({
        queryKey: ["dashboard"],
        queryFn: () => getDashboard().then(res => res.data)
    })

    

    if (isLoading) return <div className="state-loading page">Loading...</div>
    if (error)     return <div className="state-error page">Failed to load</div>

    const projects = data?.projects  ?? []
    const myTasks  = data?.my_tasks  ?? []

    const myProjects = projects

    const completedProjects = projects.filter(
        p => p.status === "completed"
    ).length

    return (
        <div className="page dashboard-page">
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Dashboard<span>.</span></h1>
                </div>
                <div>
                    <div className="page-meta">{user?.name ?? "—"}</div>
                    <div className="page-meta" style={{ color: "#333", marginTop: 4 }}>{user?.role ?? ""}</div>
                </div>
            </div>

            <div className="dashboard-grid">
            {user?.role === "client" ? (
    <div className="panel">
        <div className="panel-header">
            <span className="panel-title">Welcome Back</span>
        </div>

        <div className="client-panel">
            <h3>Track your projects easily.</h3>
            <p>
                View project progress, check updates,
                and communicate with your team.
            </p>

            <div className="client-stats">
                <div>
                    <strong>{myProjects.length}</strong>
                    <span>Projects</span>
                </div>

                <div>
                    <strong>{completedProjects}</strong>
                    <span>Completed</span>
                </div>
            </div>
        </div>
    </div>
) : (
    <div className="panel">
        <div className="panel-header">
            <span className="panel-title">Current Tasks</span>
            <span className="panel-sub">{myTasks.length} tasks</span>
        </div>

        {myTasks.length > 0 ? (
            myTasks.map(t => (
                <TaskRow
                    key={t.id}
                    name={t.title}
                    status={t.status}
                />
            ))
        ) : (
            <div className="state-empty">
                No tasks assigned
            </div>
        )}
    </div>
)}
                <div className="panel">
                    <div className="panel-header">
                        <span className="panel-title">Recent Projects</span>
                        <span className="panel-sub">not completed</span>
                    </div>
                    <div className="projects-grid">
                        {projects.length > 0
                            ? projects.map(p => (
                                <ProjCard
                                    key={p.id}
                                    name={p.name}
                                    desc={p.description}
                                    status={p.status}
                                    members={p.users ?? []}
                                    taskCount={p.tasks_count}
                                />
                              ))
                            : <div className="state-empty" style={{ gridColumn: "1/-1" }}>No projects</div>
                        }
                    </div>
                </div>
            </div>


            <div className="dash-nav-label label" style={{ marginTop: 48, marginBottom: 16 }}>Quick Access</div>
            <div className="dash-nav">
                <Link className="dash-nav-item" to="/Projects">
                    <span className="dash-nav-title">Projects</span>
                    <span className="dash-nav-arrow">→</span>
                </Link>
                {user?.role !== "client" && (
                    <Link className="dash-nav-item" to="/Tasks">
                        <span className="dash-nav-title">My Tasks</span>
                        <span className="dash-nav-arrow">→</span>
                    </Link>
                )}
            </div>
        </div>
    )
}

export default Dashboard