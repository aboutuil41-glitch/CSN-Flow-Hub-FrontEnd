import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate, Link } from "react-router-dom"
import axios from "../api/axios"
import "../layouts/Login.css"

const schema = z.object({
    name:                 z.string().min(2, "Min 2 characters"),
    email:                z.string().email("Invalid email"),
    password:             z.string().min(8, "Min 8 characters"),
    password_confirmation: z.string().min(8, "Min 8 characters"),
}).refine(data => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
})

function Register() {
    const { login } = useAuth()
    const navigate  = useNavigate()
    const [serverError, setServerError] = useState("")
    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema)
    })

    const onSubmit = async (data) => {
        setServerError("")
        try {
            const res = await axios.post("/register", data)
            localStorage.setItem("token", res.data.token)
            await login(data.email, data.password)
            navigate("/Dashboard")
        } catch (err) {
            const backendErrors = err?.response?.data?.errors

            if (backendErrors) {
                // Laravel validation errors (e.g. "email has already been taken") -
                // map them onto the matching field instead of a generic banner
                Object.entries(backendErrors).forEach(([field, messages]) => {
                    setError(field, { type: "server", message: messages[0] })
                })
            } else {
                setServerError(err?.response?.data?.message || "Something went wrong. Please try again.")
            }
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <h1 className="login-title">Sign Up<span>.</span></h1>
                    <p className="login-sub label">Create your account</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
                    {serverError && (
                        <div className="field-error" style={{ marginBottom: 8 }}>{serverError}</div>
                    )}

                    <div className="field">
                        <label className="field-label label">Name</label>
                        <input
                            className={`input ${errors.name ? "input-error" : ""}`}
                            type="text"
                            placeholder="John Doe"
                            {...register("name")}
                        />
                        {errors.name && (
                            <span className="field-error">{errors.name.message}</span>
                        )}
                    </div>

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

                    <div className="field">
                        <label className="field-label label">Confirm Password</label>
                        <input
                            className={`input ${errors.password_confirmation ? "input-error" : ""}`}
                            type="password"
                            placeholder="••••••••"
                            {...register("password_confirmation")}
                        />
                        {errors.password_confirmation && (
                            <span className="field-error">{errors.password_confirmation.message}</span>
                        )}
                    </div>

                    <button
                        className="btn btn-primary login-btn"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Creating account..." : "Create Account"}
                    </button>

                    <p className="login-sub label" style={{ textAlign: "center", marginTop: 4 }}>
                        Already have an account?{" "}
                        <Link to="/" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    )
}

export default Register