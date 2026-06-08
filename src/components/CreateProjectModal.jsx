import { useQueryClient, useMutation } from "@tanstack/react-query"
import { createProject } from "../api/projects"
import { useState } from "react"
import { z } from "zod"
import "../layouts/Projects.css"

const projectSchema = z.object({
    name:        z.string().min(3, "Project name must be at least 3 characters"),
    description: z.string().min(5, "Description must be at least 5 characters").or(z.literal("")),
})

function CreateProjectModal({ onClose }) {
    const queryClient         = useQueryClient()
    const [form, setForm]     = useState({ name: "", description: "" })
    const [errors, setErrors] = useState({})
    const [files, setFiles]   = useState([])

    const newProject = useMutation({
        mutationFn: (data) => createProject(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] })
            onClose()
        },
    })

    const handleSubmit = () => {
        const result = projectSchema.safeParse(form)
        if (!result.success) {
            const fieldErrors = {}
            result.error.issues.forEach(err => { fieldErrors[err.path[0]] = err.message })
            setErrors(fieldErrors)
            return
        }
        setErrors({})

        const payload = new FormData()
        payload.append("name", form.name)
        if (form.description) payload.append("description", form.description)
        files.forEach(f => payload.append("files[]", f))

        newProject.mutate(payload)
    }

    const handleFiles = (e) => {
        const incoming = Array.from(e.target.files)
        setFiles(prev => {
            const existingNames = new Set(prev.map(f => f.name))
            const unique = incoming.filter(f => !existingNames.has(f.name))
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
            <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">

                <div className="modal-head">
                    <h2 className="modal-title" id="modal-title">
                        New project<span>.</span>
                    </h2>
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 14 }} onClick={onClose} aria-label="Close">
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
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            autoComplete="off"
                        />
                        {errors.name && <p className="error-text">{errors.name}</p>}
                    </div>

                    <div className="modal-field">
                        <label className="label" htmlFor="project-description">Description</label>
                        <textarea
                            id="project-description"
                            className={`input textarea${errors.description ? " input-error" : ""}`}
                            placeholder="What is this project about?"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                        {errors.description && <p className="error-text">{errors.description}</p>}
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
                    <button className="btn btn-ghost" onClick={onClose} disabled={newProject.isPending}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={newProject.isPending}>
                        {newProject.isPending ? "Creating…" : "Create →"}
                    </button>
                </div>

            </div>
        </div>
    )
}

export default CreateProjectModal