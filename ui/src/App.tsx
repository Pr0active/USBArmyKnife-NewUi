import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Files from './pages/Files'
import Scripts from './pages/Scripts'
import Marauder from './pages/Marauder'
import Display from './pages/Display'
import Keyboard from './pages/Keyboard'
import Agent from './pages/Agent'
import Logs from './pages/Logs'
import Docs from './pages/Docs'
import Settings from './pages/Settings'
import Update from './pages/Update'
import Microphone from './pages/Microphone'
import { ToastContainer } from './utils/toast'

function App() {
  return (
    <HashRouter basename={import.meta.env.BASE_URL}>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/files" element={<Files />} />
          <Route path="/scripts" element={<Scripts />} />
          <Route path="/marauder" element={<Marauder />} />
          <Route path="/display" element={<Display />} />
          <Route path="/keyboard" element={<Keyboard />} />
          <Route path="/agent" element={<Agent />} />
          <Route path="/microphone" element={<Microphone />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/update" element={<Update />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
      <ToastContainer />
    </HashRouter>
  )
}

export default App
