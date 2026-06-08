import api from "./axios"

export const getFeedback = (fileId) => api.get(`/file/${fileId}/feedback`)
export const createFeedback = (fileId, data) => api.post(`/file/${fileId}/feedback`, data)
export const simplifyFeedback = (feedbackId) => api.post(`/feedback/${feedbackId}/simplify`)