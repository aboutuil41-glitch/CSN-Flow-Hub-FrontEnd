import { useQuery } from "@tanstack/react-query"
import { myTasks } from "../api/tasks"
import "../layouts/MyTasks.css"
import MyTaskCard from "../components/MyTaskCard"

function MyTasks() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["my-tasks"],
        queryFn: () => myTasks().then(res => res.data.tasks),
    })

    if (isLoading) return <div className="state-loading page">Loading...</div>
    if (error)     return <div className="state-error page">Error</div>

    return (
        <div className="page mytasks-page">
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">My Tasks<span>.</span></h1>
                    <div className="page-meta">
                        {data?.length ?? 0} {data?.length === 1 ? "task" : "tasks"}
                    </div>
                </div>
            </div>

            {data?.length === 0 && <div className="state-empty">No tasks assigned to you</div>}

            <div className="tasks-list">
                {data?.map(task => (
                    <MyTaskCard key={task.id} task={task} />
                ))}
            </div>
        </div>
    )
}

export default MyTasks