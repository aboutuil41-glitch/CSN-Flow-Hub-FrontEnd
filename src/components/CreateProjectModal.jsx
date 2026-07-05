import { useQueryClient, useMutation } from "@tanstack/react-query"
import { createProject } from "../api/projects"
import { useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import "../layouts/Projects.css"

const projectSchema = z.object({
    name:        z.string().min(1, "Project name is required").max(255, "Project name is too long"),
    description: z.string().optional(),
})

const MAX_FILE_SIZE = 102400 * 1024 // matches backend: files.* => file|max:102400 (KB)

function CreateProjectModal({ onClose }) {
    const queryClient          = useQueryClient()
    const [files, setFiles]    = useState([])
    const [fileError, setFileError] = useState("")
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(projectSchema),
        defaultValues: { name: "", description: "" },
    })

    const newProject = useMutation({
        mutationFn: (data) => createProject(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] })
            onClose()
        },
    })

    const onSubmit = (data) => {
        const payload = new FormData()
        payload.append("name", data.name)
        if (data.description) payload.append("description", data.description)
        files.forEach(f => payload.append("files[]", f))

        newProject.mutate(payload)
    }

    const handleFiles = (e) => {
        const incoming = Array.from(e.target.files)
        const tooBig = incoming.filter(f => f.size > MAX_FILE_SIZE)
        const okFiles = incoming.filter(f => f.size <= MAX_FILE_SIZE)

        setFileError(tooBig.length > 0 ? `${tooBig.map(f => f.name).join(", ")} exceed${tooBig.length === 1 ? "s" : ""} the 100MB limit` : "")

        setFiles(prev => {
            const existingNames = new Set(prev.map(f => f.name))
            const unique = okFiles.filter(f => !existingNames.has(f.name))
            return [...prev, ...unique]
        })
        e.target.value = ""
    }

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    return (
        <div
            className="modal-overlay"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <form
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                onSubmit={handleSubmit(onSubmit)}
            >

                <div className="modal-head">
                    <h2 className="modal-title" id="modal-title">
                        New project<span>.</span>
                    </h2>
                    <button type="button" className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 14 }} onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                <div className="modal-body">
                    <div className="modal-field">
                        <label className="label" htmlFor="project-name">Project name</label>
                        <input
                            id="project-name"
                            className={`input${errors.name ? " input-error" : ""}`}
                            type="text"
                            placeholder="e.g. Brand Refresh Q3"
                            autoComplete="off"
                            {...register("name")}
                        />
                        {errors.name && <p className="error-text">{errors.name.message}</p>}
                    </div>

                    <div className="modal-field">
                        <label className="label" htmlFor="project-description">Description</label>
                        <textarea
                            id="project-description"
                            className={`input textarea${errors.description ? " input-error" : ""}`}
                            placeholder="What is this project about?"
                            {...register("description")}
                        />
                        {errors.description && <p className="error-text">{errors.description.message}</p>}
                    </div>

                    <div className="modal-field">
                        <label className="label">
                            Attachments <span className="label-optional">(optional)</span>
                        </label>
                        <label className="file-drop-zone" htmlFor="project-files">
                            <span className="file-drop-icon">⌀</span>
                            <span className="file-drop-text">Click to attach files</span>
                            <input
                                id="project-files"
                                type="file"
                                multiple
                                style={{ display: "none" }}
                                onChange={handleFiles}
                            />
                        </label>
                        {fileError && <p className="error-text">{fileError}</p>}
                        {files.length > 0 && (
                            <ul className="file-list">
                                {files.map((f, i) => (
                                    <li className="file-list-item" key={i}>
                                        <span className="file-list-name">{f.name}</span>
                                        <span className="file-list-size">{(f.size / 1024).toFixed(1)} KB</span>
                                        <button
                                            type="button"
                                            className="file-list-remove"
                                            onClick={() => removeFile(i)}
                                            aria-label="Remove file"
                                        >✕</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="modal-foot">
                    <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting || newProject.isPending}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting || newProject.isPending}>
                        {newProject.isPending ? "Creating…" : "Create →"}
                    </button>
                </div>

            </form>
        </div>
    )
}

export default CreateProjectModal