import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateTask, deleteTask } from "../api/tasks"
import { useAuth } from "../context/AuthContext"
import "../layouts/MyTasks.css"

const STATUS_BADGE = {
    completed:   "green",
    in_progress: "yellow",
    pending:     "gray",
    blocked:     "red",
}

const STATUSES = [{value: "in_progress", key: "Progress"}, {value: "completed", key: "Complete"}, {value: "blocked", key:"Block"}]

function MyTaskCard({ task }) {
    const { user }        = useAuth()
    const queryClient     = useQueryClient()
    const [open, setOpen] = useState(false)
    const [status, setStatus] = useState(task.status)

    const update = useMutation({
        mutationFn: () => updateTask(task.id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["my-tasks"] })
            setOpen(false)
        },
    })

    const remove = useMutation({
        mutationFn: () => deleteTask(task.id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-tasks"] }),
    })

    const isAssignee = task.assignee?.id === user?.id

    return (
        <div className="task-card card">
            <div className="task-card-inner">

                <div className="task-main">
                    <h2 className="task-title">{task.title}</h2>
                    {task.description && <p className="task-desc">{task.description}</p>}

                    {open && (
                        <div className="task-edit">
                            <select
                                className="input task-status-select"
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                            >
                                {STATUSES.map(s => <option key={s.key} value={s.value}>{s.key}</option>)}
                            </select>
                            <div className="task-edit-actions">
                                <button className="btn btn-primary" onClick={() => update.mutate()} disabled={update.isPending}>
                                    Save
                                </button>
                                <button className="btn btn-ghost" onClick={() => setOpen(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="task-side">
                    <span className={`badge ${STATUS_BADGE[task.status] ?? "gray"}`}>
                        {task.status?.replace("_", " ") ?? "—"}
                    </span>
                    <span className="task-assignee label">You</span>
                    <div className="task-actions">
                        {isAssignee && (
                            <button className="btn btn-ghost" onClick={() => setOpen(o => !o)}>
                                Edit
                            </button>
                        )}
                        {user?.role === "admin" && (
                            <button className="btn btn-danger" onClick={() => remove.mutate()} disabled={remove.isPending}>
                                Delete
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}

export default MyTaskCard