// import { useState } from 'react'

import './App.css'
import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom'
import { Sender } from './components/Sender'
import { Receiver } from './components/Receiver'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/sender" replace />} />
        <Route path="/sender" element={<Sender/>} />
        <Route path="/receiver" element={<Receiver/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App