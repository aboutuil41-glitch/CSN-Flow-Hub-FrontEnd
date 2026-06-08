import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getFiles, uploadFile, downloadFile, deleteFile } from "../api/files"
import { getFeedback, createFeedback, simplifyFeedback } from "../api/feedback"
import { useParams } from "react-router-dom"
import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import "../layouts/Files.css"

const BASE_URL = "http://127.0.0.1:8000/storage/"

function FilePreview({ file }) {
    const ext = file.name.split(".").pop().toLowerCase()

    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
        return <div className="file-preview"><img src={BASE_URL + file.path} alt={file.name} /></div>

    if (["mp4", "webm", "ogg"].includes(ext))
        return <div className="file-preview"><video controls><source src={BASE_URL + file.path} /></video></div>

    if (["mp3", "wav"].includes(ext))
        return <div className="file-preview"><audio controls><source src={BASE_URL + file.path} /></audio></div>

    if (ext === "pdf")
        return <div className="file-preview"><iframe src={BASE_URL + file.path} title={file.name} /></div>

    return (
        <div className="file-preview">
            <div className="no-preview-icon">
                <span className="ext">.{ext}</span>
                <span className="hint">No preview</span>
            </div>
        </div>
    )
}

export default FilePreview