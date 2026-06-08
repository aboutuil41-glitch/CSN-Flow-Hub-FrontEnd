import { createContext, useContext, useEffect, useState } from "react"
import api from "../api/axios"

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem("token") || null)
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    const login = async (email, password) => {
        const res = await api.post("/login", { email, password })

        localStorage.setItem("token", res.data.token)

        setToken(res.data.token)
        setUser(res.data.user)
    }

    const logout = async () => {
        await api.post("/logout")

        localStorage.removeItem("token")

        setToken(null)
        setUser(null)
    }

    const getMe = async () => {
        try {
            const res = await api.get("/me")
            setUser(res.data.user)
        } catch (err) {
            console.log(err)
            localStorage.removeItem("token")
            setToken(null)
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (token) {
            getMe()
        } else {
            setLoading(false)
        }
    }, [])

    return (
        <AuthContext.Provider
            value={{ token, user, login, logout, getMe, loading }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}