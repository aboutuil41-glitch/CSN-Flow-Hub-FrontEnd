import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../layouts/NavBar.css"

function NavBar(){
    const { user, logout } = useAuth()
    console.log(user)

    return(
    <nav>
        <NavLink to= "/Dashboard">Dashboard</NavLink>
        <NavLink to= "/Projects">Projects</NavLink>
        {user?.role !== "client" && <NavLink to= "/Tasks">Tasks</NavLink>}
        {user?.role === "admin" && <NavLink to= "/Admin">Admin</NavLink>}
        <span>Welcome, {user?.name}</span>
        <button onClick={logout}>Logout</button>
    </nav>


    )
}
export default NavBar