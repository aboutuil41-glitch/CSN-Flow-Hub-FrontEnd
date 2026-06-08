import { useQuery } from "@tanstack/react-query"
import { getTasks } from "../api/tasks"
import { useParams } from "react-router-dom"
import "../layouts/Tasks.css"
import TaskCard from "../components/TaskCard"

function Tasks() {
    const { projectId } = useParams()
    const { data, isLoading, error } = useQuery({
        queryKey: ["tasks", projectId],
        queryFn: () => getTasks(projectId).then(res => res.data.tasks),
    })

    if (isLoading) return <div className="state-loading page">Loading...</div>
    if (error)     return <div className="state-error page">Error</div>

    return (
        <div className="page tasks-page">
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Tasks<span>.</span></h1>
                    <div className="page-meta">
                        {data?.length ?? 0} {data?.length === 1 ? "task" : "tasks"}
                    </div>
                </div>
            </div>

            {data?.length === 0 && <div className="state-empty">No tasks yet</div>}

            <div className="tasks-list">
                {data?.map(task => (
                    <TaskCard key={task.id} task={task} projectId={projectId} />
                ))}
            </div>
        </div>
    )
}

export default Tasks