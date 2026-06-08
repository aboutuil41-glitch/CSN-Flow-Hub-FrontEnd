import api from "./axios"

export const myTasks = () => api.get("/tasks")
export const getTasks = (projectId) => api.get(`/tasks/${projectId}`)
export const createTask = (projectId, data) => api.post(`/task/${projectId}`, data)
export const assignTask = (taskId, userId) => api.put(`/task/${taskId}/assign/${userId}`)
export const updateTask = (taskId, data) => api.put(`/task/${taskId}`, data)
export const deleteTask = (taskId) => api.delete(`/task/${taskId}`)