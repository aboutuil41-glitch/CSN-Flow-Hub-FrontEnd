import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query"
import { createProject, getProjects, deleteProject, completeProject, holdProject, downloadFile } from "../api/projects"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../layouts/Projects.css"
import { useState } from "react"
import CreateProjectModal from "../components/CreateProjectModal"
import { viewFile } from "../utils/viewFile"
import {
    FileText,
    Image,
    Video,
    Music,
    FileSpreadsheet,
    Archive,
    File,
    Plus,
    CheckCheck,
    Folders,
    CircleCheck,
    PauseCircle,
    Trash2,
    Download,
    Eye,
} from "lucide-react"

const STATUS_BADGE = {
    planning:    "blue",
    completed:   "green",
    in_progress: "yellow",
    on_hold:     "red",
}

const ROLE_BADGE = {
    client: "blue",
    team:   "gray",
    admin:  "yellow",
}

const FILE_ICON_MAP = {
    pdf:  FileText,
    jpg:  Image, jpeg: Image, png: Image, gif: Image, webp: Image, svg: Image,
    mp4:  Video, webm: Video,
    mp3:  Music, wav:  Music,
    doc:  FileText, docx: FileText,
    xls:  FileSpreadsheet, xlsx: FileSpreadsheet,
    zip:  Archive, rar:  Archive,
}

function getIcon(filename) {
    const ext = filename.split(".").pop().toLowerCase()
    const Icon = FILE_ICON_MAP[ext] ?? File
    return <Icon size={16} />
}

function Projects() {
    const queryClient     = useQueryClient()
    const { user }        = useAuth()
    const [open, setOpen] = useState(false)

    const { data, isLoading, error } = useQuery({
        queryKey: ["projects"],
        queryFn: () => getProjects().then(res => res.data.projects),
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteProject(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
    })

    const completeMutation = useMutation({
        mutationFn: (id) => completeProject(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
    })

    const holdMutation = useMutation({
        mutationFn: (id) => holdProject(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
    })

    const handleDownload = async (fileId, name) => {
        const res = await downloadFile(fileId)
        const url = URL.createObjectURL(res.data)
        const a = document.createElement("a")
        a.href = url
        a.download = name
        a.click()
        URL.revokeObjectURL(url)
    }

    if (isLoading) return <div className="state-loading page">Loading...</div>
    if (error)     return <div className="state-error page">Error</div>

    return (
        <div className="page projects-page">

            {open && <CreateProjectModal onClose={() => setOpen(false)} />}

            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Projects<span>.</span></h1>
                    <div className="page-meta">
                        {data?.length ?? 0} {data?.length === 1 ? "project" : "projects"}
                    </div>
                </div>
                {user?.role === "client" && (
                    <button className="btn btn-primary" onClick={() => setOpen(true)}>
                        <Plus size={15} /> New project
                    </button>
                )}
            </div>

            {data?.length === 0 && <div className="state-empty">No projects yet</div>}

            <div className="projects-list">
                {data?.map(project => (
                    <div className="card project-card" key={project.id}>

                        <div className="project-card-header">
                            <div>
                                <h2 className="project-name">{project.name}</h2>
                                {project.description && (
                                    <p className="project-desc">{project.description}</p>
                                )}
                            </div>
                            <span className={`badge ${STATUS_BADGE[project.statue] ?? "gray"}`}>
                                {project.statue?.replace("_", " ") ?? "—"}
                            </span>
                        </div>

                        {/* Members */}
                        {project.users?.length > 0 && (
                            <>
                                <hr className="divider" />
                                <div className="project-members-label label">Members</div>
                                <ul className="project-members">
                                    {project.users.map(u => (
                                        <li className="project-member" key={u.id}>
                                            <span className="member-name">{u.name}</span>
                                            <span className="member-email">{u.email}</span>
                                            <span className={`badge ${ROLE_BADGE[u.pivot?.role] ?? "gray"}`}>
                                                {u.pivot?.role ?? "—"}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}

                        {/* Attachments */}
                        {project.project_files?.length > 0 && (
                            <>
                                <hr className="divider" />
                                <div className="label" style={{ marginBottom: 8 }}>Attachments</div>
                                <ul className="project-attachments">
                                    {project.project_files.map(f => (
                                        <li className="attachment-item" key={f.id}>
                                            <span className="attachment-icon">{getIcon(f.name)}</span>
                                            <span className="attachment-name">{f.name}</span>
                                            <div className="attachment-actions">
                                                <a
                                                    className="btn-attachment"
                                                    onClick={() => viewFile(downloadFile, f.id)}
                                                >
                                                    <Eye size={13} /> View
                                                </a>
                                                <a
                                                    className="btn-attachment"
                                                    onClick={() => handleDownload(f.id, f.name)}
                                                >
                                                    <Download size={13} /> Download
                                                </a>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}

                        {/* Actions */}
                        <hr className="divider" />
                        <div className="project-actions">
                            {user?.role !== "client" && (
                                <Link className="btn-tasks" to={`/Tasks/${project.id}`}>
                                    <CheckCheck size={14} /> Tasks
                                </Link>
                            )}
                            <Link className="btn-files" to={`/Files/${project.id}`}>
                                <Folders size={14} /> Files
                            </Link>
                            {user?.role === "admin" && (
                                <>
                                    <button
                                        className="btn-complete"
                                        onClick={() => completeMutation.mutate(project.id)}
                                        disabled={completeMutation.isPending}
                                    >
                                        <CircleCheck size={14} /> Mark complete
                                    </button>
                                    <button
                                        className="btn-hold"
                                        onClick={() => holdMutation.mutate(project.id)}
                                        disabled={holdMutation.isPending}
                                    >
                                        <PauseCircle size={14} /> Put on hold
                                    </button>
                                </>
                            )}
                            {user?.role !== "team" && (
                                <button
                                    className="btn-delete-proj"
                                    onClick={() => deleteMutation.mutate(project.id)}
                                    disabled={deleteMutation.isPending}
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            )}
                        </div>

                    </div>
                ))}
            </div>

        </div>
    )
}

export default Projects