import api from "./axios"

export const getComments = (taskId) => api.get(`/comment/${taskId}`)
export const createComment = (taskId, data) => api.post(`/comment/${taskId}`, data)
export const deleteComment = (commentId) => api.delete(`/comment/${commentId}`)