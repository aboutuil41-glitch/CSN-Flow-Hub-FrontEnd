import api from "./axios"

export const getProjects  = ()               => api.get("/projects")
export const getProject   = (id)             => api.get(`/project/${id}`)
export const createProject = (data)          => api.post("/project", data)
export const assignMember  = (projectId, userId) => api.post(`/project/${projectId}/assign/${userId}`)
export const completeProject = (id)          => api.put(`/projects/${id}/complete`)
export const holdProject     = (id)          => api.put(`/projects/${id}/hold`)
export const deleteProject   = (id)          => api.delete(`/project/${id}`)
export const downloadFile = (fileId) => api.get(`project/file/${fileId}/download`, { responseType: "blob" })
