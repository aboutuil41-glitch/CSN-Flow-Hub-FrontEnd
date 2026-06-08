import { useState } from 'react'
import './App.css'
import { Routes, Route, useLocation } from 'react-router-dom'
import Tasks from './pages/Tasks'
import Admin from './pages/Admin'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Files from './pages/Files'
import Projects from './pages/Projects'
import NavBar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import MyTasks from './pages/MyTasks'
import Register from './pages/Register'

function App() {
  const location = useLocation()
  const hideNav = location.pathname === "/" || location.pathname === "/register"

  return (
    <>
      {!hideNav && <NavBar/>}

      <Routes>
        <Route path="/"              element={<Login/>}/>
        <Route path="/register"      element={<Register/>}/>
        <Route path="/Dashboard"     element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
        <Route path="/Admin"         element={<ProtectedRoute allowedRoles= {["admin"]}><Admin/></ProtectedRoute>}/>
        <Route path="/Projects"      element={<ProtectedRoute><Projects/></ProtectedRoute>}/>
        <Route path="/Tasks/:projectId"         element={<ProtectedRoute allowedRoles= {["admin", "team"]}><Tasks/></ProtectedRoute>}/>
        <Route path="/Files/:projectId"         element={<ProtectedRoute><Files/></ProtectedRoute>}/>
        <Route path="/Tasks"         element={<ProtectedRoute allowedRoles= {["admin", "team"]}><MyTasks/></ProtectedRoute>}/>
      </Routes>
    </>
  )
}

export default App