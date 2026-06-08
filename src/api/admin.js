import api from "./axios"

export const getStatistics = () => api.get("/admin/statistic")
export const updateRole = (userId, role) => api.put(`/admin/${userId}`, { role })