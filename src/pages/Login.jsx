import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate, Link } from "react-router-dom"
import "../layouts/Login.css"

const schema = z.object({
    email:    z.string().email("Invalid email"),
    password: z.string().min(8, "Min 8 characters"),
})

function Login() {
    const { login } = useAuth()
    const navigate  = useNavigate()
    const [serverError, setServerError] = useState("")
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema)
    })

    const onSubmit = async (data) => {
        setServerError("")
        try {
            await login(data.email, data.password)
            navigate("/Dashboard")
        } catch (err) {
            setServerError(err?.response?.data?.message || "Something went wrong. Please try again.")
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <h1 className="login-title">Sign In<span>.</span></h1>
                    <p className="login-sub label">Enter your credentials</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
                    {serverError && (
                        <div className="field-error" style={{ marginBottom: 8 }}>{serverError}</div>
                    )}

                    <div className="field">
                        <label className="field-label label">Email</label>
                        <input
                            className={`input ${errors.email ? "input-error" : ""}`}
                            type="email"
                            placeholder="you@example.com"
                            {...register("email")}
                        />
                        {errors.email && (
                            <span className="field-error">{errors.email.message}</span>
                        )}
                    </div>

                    <div className="field">
                        <label className="field-label label">Password</label>
                        <input
                            className={`input ${errors.password ? "input-error" : ""}`}
                            type="password"
                            placeholder="••••••••"
                            {...register("password")}
                        />
                        {errors.password && (
                            <span className="field-error">{errors.password.message}</span>
                        )}
                    </div>

                    <button
                        className="btn btn-primary login-btn"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Signing in..." : "Sign In"}
                    </button>

                    <p className="login-footer-link">
                        No account?{" "}
                        <Link to="/register">Create one</Link>
                    </p>
                </form>
            </div>

            <span className="login-wordmark">CSN Platform</span>
        </div>
    )
}

export default Login    