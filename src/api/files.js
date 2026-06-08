import api from "./axios"

export const getFiles = (projectId) => api.get(`/projects/${projectId}/files`)
export const uploadFile = (projectId, file, version) => {
    const formData = new FormData()
    formData.append("file", file)
    if (version) formData.append("version", version)
    return api.post(`/projects/${projectId}/files`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
    })
}
export const downloadFile = (fileId) => api.get(`/files/${fileId}/download`, { responseType: "blob" })
export const deleteFile = (fileId) => api.delete(`/files/${fileId}`)