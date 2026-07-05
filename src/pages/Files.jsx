import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getFiles, uploadFile, downloadFile, deleteFile } from "../api/files"
import { getFeedback, createFeedback, simplifyFeedback } from "../api/feedback"
import { useParams } from "react-router-dom"
import { useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useAuth } from "../context/AuthContext"
import FilePreview from "../components/FilePreview"
import "../layouts/Files.css"

const TYPE_LABELS = { comment: "Comment", approval: "Approval", change_request: "Change", blocked: "Blocked" }
const TYPE_CLASS  = { comment: "fb-type--comment", approval: "fb-type--approval", change_request: "fb-type--change", blocked: "fb-type--blocked" }
const SENTIMENT_CLASS = { positive: "ai-sentiment--positive", neutral: "ai-sentiment--neutral", negative: "ai-sentiment--negative" }
const PRIORITY_CLASS  = { low: "ai-priority--low", medium: "ai-priority--medium", high: "ai-priority--high" }

const MAX_FILE_SIZE = 102400 * 1024 // matches backend: file => required|file|max:102400 (KB)

const feedbackSchema = z.object({
    message: z.string().min(3, "Message must be at least 3 characters"),
    type:    z.enum(["comment", "approval", "change_request", "blocked"]),
})

const uploadSchema = z.object({
    file: z
        .custom((val) => val instanceof FileList && val.length > 0, { message: "Choose a file to upload" })
        .refine((val) => !val?.[0] || val[0].size <= MAX_FILE_SIZE, { message: "File must be under 100MB" }),
    version: z.string().optional(),
})

function AiModal({ result, onClose }) {
    return (
        <div className="ai-overlay" onClick={onClose}>
            <div className="ai-modal" onClick={e => e.stopPropagation()}>
                <div className="ai-modal-head">
                    <span className="ai-modal-label">AI Simplification</span>
                    <button className="ai-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="ai-modal-body">
                    <p className="ai-simplified">{result.simplified_feedback}</p>
                    <div className="ai-chips">
                        <span className={`ai-chip ${SENTIMENT_CLASS[result.sentiment] ?? ""}`}>{result.sentiment}</span>
                        <span className={`ai-chip ${PRIORITY_CLASS[result.priority] ?? ""}`}>{result.priority} priority</span>
                    </div>
                    {result.suggested_action && (
                        <div className="ai-action">
                            <span className="ai-action-label">Suggested action</span>
                            <p className="ai-action-text">{result.suggested_action}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function FeedbackPanel({ fileId }) {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [aiResult, setAiResult] = useState(null)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(feedbackSchema),
        defaultValues: { message: "", type: "comment" },
    })

    const { data: feedback = [], isLoading } = useQuery({
        queryKey: ["feedback", fileId],
        queryFn: () => getFeedback(fileId).then(res => res.data.feedback),
        enabled: open,
    })

    const createMutation = useMutation({
        mutationFn: (data) => createFeedback(fileId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["feedback", fileId] })
            reset({ message: "", type: "comment" })
        },
    })

    const simplifyMutation = useMutation({
        mutationFn: (feedbackId) => simplifyFeedback(feedbackId).then(res => res.data.message),
        onSuccess: (data) => setAiResult(data),
    })

    return (
        <div className="feedback-section">
            <button className="feedback-toggle" onClick={() => setOpen(o => !o)}>
                <span className="feedback-toggle-label">Feedback</span>
                <span className={`feedback-toggle-arrow ${open ? "open" : ""}`}>↓</span>
            </button>

            {open && (
                <div className="feedback-panel">
                    {isLoading && <p className="label" style={{ padding: "8px 0" }}>Loading...</p>}
                    {!isLoading && feedback.length === 0 && <p className="label" style={{ padding: "8px 0" }}>No feedback yet.</p>}

                    {!isLoading && feedback.map(fb => (
                        <div className="fb-item" key={fb.id}>
                            <div className="fb-item-header">
                                <span className="fb-author">{fb.user?.name ?? "Unknown"}</span>
                                <div className="fb-item-right">
                                    <span className={`fb-type ${TYPE_CLASS[fb.type]}`}>{TYPE_LABELS[fb.type]}</span>
                                    {user?.role !== "client" && (
                                        <button
                                            className="fb-simplify-btn"
                                            onClick={() => simplifyMutation.mutate(fb.id)}
                                            disabled={simplifyMutation.isPending && simplifyMutation.variables === fb.id}
                                        >
                                            {simplifyMutation.isPending && simplifyMutation.variables === fb.id ? "···" : "Simplify"}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="fb-message">{fb.message}</p>
                        </div>
                    ))}

                    {user?.role === "client" && (
                        <form className="fb-compose" onSubmit={handleSubmit(data => createMutation.mutate(data))}>
                            <textarea
                                className={`input textarea ${errors.message ? "input-error" : ""}`}
                                placeholder="Leave feedback..."
                                rows={2}
                                {...register("message")}
                            />
                            {errors.message && <span className="field-error">{errors.message.message}</span>}
                            <div className="fb-compose-actions">
                                <select
                                    className="fb-type-select"
                                    {...register("type")}
                                >
                                    <option value="comment">Comment</option>
                                    <option value="approval">Approval</option>
                                    <option value="change_request">Change Request</option>
                                    <option value="blocked">Blocked</option>
                                </select>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSubmitting || createMutation.isPending}
                                >
                                    {createMutation.isPending ? "..." : "Post"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {aiResult && <AiModal result={aiResult} onClose={() => setAiResult(null)} />}
        </div>
    )
}

function Files() {
    const { projectId } = useParams()
    const { user } = useAuth()
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(uploadSchema),
        defaultValues: { version: "" },
    })
    const watchedFile = watch("file")
    const selectedFileName = watchedFile?.[0]?.name

    const { data, isLoading, error } = useQuery({
        queryKey: ["files", projectId],
        queryFn: () => getFiles(projectId).then(res => res.data.files.files)
    })

    const uploadMutation = useMutation({
        mutationFn: (data) => uploadFile(projectId, data.file[0], data.version),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["files", projectId] })
            reset({ version: "" })
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (fileId) => deleteFile(fileId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files", projectId] })
    })

    const handleDownload = async (file) => {
        const res = await downloadFile(file.id)
        const url = window.URL.createObjectURL(new Blob([res.data]))
        const a = document.createElement("a")
        a.href = url
        a.download = file.name
        a.click()
        window.URL.revokeObjectURL(url)
    }

    if (isLoading) return <div className="state-loading">Loading...</div>
    if (error)     return <div className="state-error">Failed to load files</div>

    return (
        <div className="files-page page">
            <div className="page-header">
                <h1 className="files-title">Files<span>.</span></h1>
                <span className="page-meta">{data?.length ?? 0} {data?.length === 1 ? "file" : "files"}</span>
            </div>

            {user?.role !== "client" && (
                <form className="upload-section" onSubmit={handleSubmit(data => uploadMutation.mutate(data))}>
                    <span className="label">Upload</span>
                    <div className="file-input-wrapper">
                        <input type="file" {...register("file")} />
                        <div className={`file-input-display ${selectedFileName ? "has-file" : ""}`}>
                            {selectedFileName ?? "Choose a file..."}
                        </div>
                    </div>
                    {errors.file && <span className="field-error">{errors.file.message}</span>}
                    <input
                        className={`input ${errors.version ? "input-error" : ""}`}
                        style={{ width: 140 }}
                        type="text"
                        placeholder="Version (e.g. v1.0)"
                        {...register("version")}
                    />
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting || uploadMutation.isPending}
                    >
                        {uploadMutation.isPending ? "Uploading..." : "Upload"}
                    </button>
                </form>
            )}

            <div className="files-grid">
                {data?.length === 0 && <div className="state-empty">No files uploaded yet</div>}
                {data?.map(file => (
                    <div className="card" key={file.id}>
                        <FilePreview file={file} />
                        <div className="file-info">
                            <p className="file-name">{file.name}</p>
                            <span className="file-version">{file.version ?? "no version"}</span>
                            <div className="file-actions">
                                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => handleDownload(file)}>Download</button>
                                {user?.role === "admin" && (
                                    <button className="btn btn-danger" onClick={() => deleteMutation.mutate(file.id)}>Delete</button>
                                )}
                            </div>
                        </div>
                        <FeedbackPanel fileId={file.id} />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Files