import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Dashboard from '../screens/Dashboard'
import Signup from '../screens/Signup'
import Login from '../screens/Login'

const App = () => {
  return (
   <>
   <Routes>
    <Route path='/' element={<Dashboard/>} />
    <Route path='/signup' element={<Signup/>} />
    <Route path='/login' element={<Login/>} />
   </Routes>
   </>
  )
}

export default App