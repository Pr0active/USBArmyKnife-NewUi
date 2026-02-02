import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { showToast } from '../utils/toast'

const DUCKYSCRIPT_COMMANDS = [
  { category: 'Delays', commands: ['DELAY <milliseconds>', 'DELAY 1000'] },
  { category: 'Keyboard', commands: ['STRING <text>', 'STRINGLN <text>', 'ENTER', 'GUI r', 'ALT', 'CONTROL', 'SHIFT', 'TAB', 'ESCAPE'] },
  { category: 'LED Control', commands: ['LED_R', 'LED_G', 'LED_B', 'LED_OFF'] },
  { category: 'Display', commands: ['DISPLAY_TEXT <x> <y> <text>', 'DISPLAY_PNG <filepath>', 'DISPLAY_CLEAR'] },
  { category: 'Control Flow', commands: ['VAR $NAME = <value>', 'IF (<condition>)', 'WHILE (TRUE)', 'FUNCTION <NAME>()'] },
  { category: 'File System', commands: ['LOAD_DS_FILES_FROM_SD()', 'RUN_PAYLOAD <filename>', 'RESTART_PAYLOAD'] },
  { category: 'Agent', commands: ['AGENT_INSTALL <path>', 'AGENT_RUN <command>', 'AGENT_CONNECTED()'] },
  { category: 'Logging', commands: ['LOG <message>'] },
]

export default function Scripts() {
  const [files, setFiles] = useState<string[]>([])
  const [command, setCommand] = useState('')
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      const data = await api.getDeviceData()
      const scriptFiles = (data.fileListing || []).filter(f => f.endsWith('.ds'))
      setFiles(scriptFiles)
    } catch (err) {
      console.error('Failed to load files:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRunFile = async (filename: string) => {
    if (!confirm(`Run script ${filename}?`)) return

    setExecuting(true)
    try {
      await api.runFile(filename)
      showToast(`Script ${filename} executed successfully`, 'success')
    } catch (err) {
      showToast(
        `Failed to run script: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'error'
      )
    } finally {
      setExecuting(false)
    }
  }

  const handleRunCommand = async () => {
    if (!command.trim()) return

    const commandToSend = command.trim()
    console.log('Sending raw command:', commandToSend)
    
    setExecuting(true)
    try {
      await api.runRawCommand(commandToSend)
      const preview = commandToSend.length > 50 
        ? commandToSend.substring(0, 50) + '...' 
        : commandToSend
      showToast(`Command sent: ${preview}`, 'success')
      setCommand('')
    } catch (err) {
      console.error('Failed to send command:', err)
      showToast(
        `Failed to run command: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'error'
      )
    } finally {
      setExecuting(false)
    }
  }

  const insertCommand = (cmd: string) => {
    if (command) {
      setCommand(command + '\n' + cmd)
    } else {
      setCommand(cmd)
    }
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Script Execution</h1>
        <p className="mt-1 text-sm text-gray-500">Run DuckyScript files or execute individual commands</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Run Script File</h2>
              {loading ? (
                <div className="text-gray-500">Loading scripts...</div>
              ) : files.length === 0 ? (
                <div className="text-gray-500">No script files found</div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <span className="text-sm font-medium text-gray-900">{file}</span>
                      <button
                        onClick={() => handleRunFile(file)}
                        disabled={executing}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        Run
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Execute Raw Command</h2>
              <textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter DuckyScript commands..."
                className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
              <button
                onClick={handleRunCommand}
                disabled={!command.trim() || executing}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {executing ? 'Executing...' : 'Execute Command'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Command Reference</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {DUCKYSCRIPT_COMMANDS.map((group) => (
                <div key={group.category}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">{group.category}</h3>
                  <div className="space-y-1">
                    {group.commands.map((cmd) => (
                      <button
                        key={cmd}
                        onClick={() => insertCommand(cmd)}
                        className="block w-full text-left px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded font-mono"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
