import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { showToast } from '../utils/toast'

const AGENT_COMMANDS = [
  'ls',
  'dir',
  'pwd',
  'whoami',
  'hostname',
  'ipconfig',
  'ifconfig',
  'netstat -an',
  'tasklist',
  'ps aux',
  'cat /etc/passwd',
  'uname -a',
]

export default function Agent() {
  const [command, setCommand] = useState('')
  const [executing, setExecuting] = useState(false)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const navigate = useNavigate()

  const handleExecute = async () => {
    if (!command.trim()) {
      showToast('Please enter an agent command', 'error')
      return
    }

    setExecuting(true)
    try {
      await api.runAgentCommand(command.trim())
      setCommandHistory((prev) => [command.trim(), ...prev].slice(0, 10))
      showToast('Agent command executed successfully', 'success')
      setCommand('')
    } catch (err) {
      showToast(
        `Failed to execute command: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'error'
      )
    } finally {
      setExecuting(false)
    }
  }

  const handleSelectCommand = (cmd: string) => {
    setCommand(cmd)
  }

  const handleViewLogs = () => {
    navigate('/logs')
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Agent Commands</h1>
        <p className="mt-1 text-sm text-gray-500">
          Execute commands on the connected agent machine. Results will appear in device logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Execute Agent Command
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="agent-command"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Command
                  </label>
                  <input
                    type="text"
                    id="agent-command"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleExecute()
                      }
                    }}
                    placeholder="e.g., ls"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExecute}
                    disabled={!command.trim() || executing}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {executing ? 'Executing...' : 'Execute Command'}
                  </button>
                  <button
                    onClick={handleViewLogs}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    View Logs
                  </button>
                </div>
              </div>
            </div>
          </div>

          {commandHistory.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Command History
                </h2>
                <div className="space-y-2">
                  {commandHistory.map((cmd, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-gray-50"
                    >
                      <span className="text-sm font-mono text-gray-700">{cmd}</span>
                      <button
                        onClick={() => handleSelectCommand(cmd)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Use
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Common Commands
            </h2>
            <div className="space-y-2">
              {AGENT_COMMANDS.map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => handleSelectCommand(cmd)}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded font-mono border border-gray-200 hover:border-blue-300"
                >
                  {cmd}
                </button>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Command results will appear in device logs.
                Click "View Logs" to see the output.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
