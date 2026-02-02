import { useState } from 'react'
import { api } from '../services/api'
import { showToast } from '../utils/toast'

interface KeyConfig {
  label: string
  command: string
  width?: string
  shiftLabel?: string
}

const KEYBOARD_LAYOUT: KeyConfig[][] = [
  [
    { label: '`', command: '`', shiftLabel: '~' },
    { label: '1', command: '1', shiftLabel: '!' },
    { label: '2', command: '2', shiftLabel: '@' },
    { label: '3', command: '3', shiftLabel: '#' },
    { label: '4', command: '4', shiftLabel: '$' },
    { label: '5', command: '5', shiftLabel: '%' },
    { label: '6', command: '6', shiftLabel: '^' },
    { label: '7', command: '7', shiftLabel: '&' },
    { label: '8', command: '8', shiftLabel: '*' },
    { label: '9', command: '9', shiftLabel: '(' },
    { label: '0', command: '0', shiftLabel: ')' },
    { label: '-', command: '-', shiftLabel: '_' },
    { label: '=', command: '=', shiftLabel: '+' },
    { label: 'Backspace', command: 'DELETE', width: 'w-24' },
  ],
  [
    { label: 'Tab', command: 'TAB', width: 'w-20' },
    { label: 'Q', command: 'q' },
    { label: 'W', command: 'w' },
    { label: 'E', command: 'e' },
    { label: 'R', command: 'r' },
    { label: 'T', command: 't' },
    { label: 'Y', command: 'y' },
    { label: 'U', command: 'u' },
    { label: 'I', command: 'i' },
    { label: 'O', command: 'o' },
    { label: 'P', command: 'p' },
    { label: '[', command: '[', shiftLabel: '{' },
    { label: ']', command: ']', shiftLabel: '}' },
    { label: '\\', command: '\\', shiftLabel: '|', width: 'w-16' },
  ],
  [
    { label: 'Caps', command: 'CAPSLOCK', width: 'w-24' },
    { label: 'A', command: 'a' },
    { label: 'S', command: 's' },
    { label: 'D', command: 'd' },
    { label: 'F', command: 'f' },
    { label: 'G', command: 'g' },
    { label: 'H', command: 'h' },
    { label: 'J', command: 'j' },
    { label: 'K', command: 'k' },
    { label: 'L', command: 'l' },
    { label: ';', command: ';', shiftLabel: ':' },
    { label: "'", command: "'", shiftLabel: '"' },
    { label: 'Enter', command: 'ENTER', width: 'w-24' },
  ],
  [
    { label: 'Shift', command: 'SHIFT', width: 'w-28' },
    { label: 'Z', command: 'z' },
    { label: 'X', command: 'x' },
    { label: 'C', command: 'c' },
    { label: 'V', command: 'v' },
    { label: 'B', command: 'b' },
    { label: 'N', command: 'n' },
    { label: 'M', command: 'm' },
    { label: ',', command: ',', shiftLabel: '<' },
    { label: '.', command: '.', shiftLabel: '>' },
    { label: '/', command: '/', shiftLabel: '?' },
    { label: 'Shift', command: 'SHIFT', width: 'w-28' },
  ],
  [
    { label: 'Ctrl', command: 'CONTROL', width: 'w-20' },
    { label: 'Win', command: 'GUI', width: 'w-20' },
    { label: 'Alt', command: 'ALT', width: 'w-20' },
    { label: 'Space', command: 'SPACE', width: 'w-64' },
    { label: 'Alt', command: 'ALT', width: 'w-20' },
    { label: 'Win', command: 'GUI', width: 'w-20' },
    { label: 'Ctrl', command: 'CONTROL', width: 'w-20' },
  ],
]

const FUNCTION_KEYS: KeyConfig[] = [
  { label: 'Esc', command: 'ESCAPE' },
  { label: 'F1', command: 'F1' },
  { label: 'F2', command: 'F2' },
  { label: 'F3', command: 'F3' },
  { label: 'F4', command: 'F4' },
  { label: 'F5', command: 'F5' },
  { label: 'F6', command: 'F6' },
  { label: 'F7', command: 'F7' },
  { label: 'F8', command: 'F8' },
  { label: 'F9', command: 'F9' },
  { label: 'F10', command: 'F10' },
  { label: 'F11', command: 'F11' },
  { label: 'F12', command: 'F12' },
]

const ARROW_KEYS: KeyConfig[] = [
  { label: '↑', command: 'UPARROW' },
  { label: '↓', command: 'DOWNARROW' },
  { label: '←', command: 'LEFTARROW' },
  { label: '→', command: 'RIGHTARROW' },
]

const SPECIAL_KEYS: KeyConfig[] = [
  { label: 'Home', command: 'HOME' },
  { label: 'End', command: 'END' },
  { label: 'PgUp', command: 'PAGEUP' },
  { label: 'PgDn', command: 'PAGEDOWN' },
  { label: 'Insert', command: 'INSERT' },
  { label: 'Delete', command: 'DELETE' },
]

export default function Keyboard() {
  const [textInput, setTextInput] = useState('')
  const [shiftPressed, setShiftPressed] = useState(false)
  const [ctrlPressed, setCtrlPressed] = useState(false)
  const [altPressed, setAltPressed] = useState(false)
  const [guiPressed, setGuiPressed] = useState(false)
  const [sending, setSending] = useState(false)

  const sendCommand = async (command: string) => {
    if (sending) return

    setSending(true)
    try {
      await api.runRawCommand(command)
      showToast('Key sent', 'success')
    } catch (err) {
      showToast(
        `Failed to send key: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'error'
      )
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (key: KeyConfig) => {
    let command = key.command

    if (key.shiftLabel && shiftPressed) {
      command = key.shiftLabel
    }

    if (ctrlPressed && !['CONTROL', 'SHIFT', 'ALT', 'GUI'].includes(key.command)) {
      command = `CONTROL ${command.toLowerCase()}`
    } else if (altPressed && !['CONTROL', 'SHIFT', 'ALT', 'GUI'].includes(key.command)) {
      command = `ALT ${command.toLowerCase()}`
    } else if (guiPressed && !['CONTROL', 'SHIFT', 'ALT', 'GUI'].includes(key.command)) {
      command = `GUI ${command.toLowerCase()}`
    } else if (key.command.length === 1 && !['CONTROL', 'SHIFT', 'ALT', 'GUI', 'TAB', 'SPACE', 'ENTER', 'DELETE', 'ESCAPE', 'CAPSLOCK'].includes(key.command.toUpperCase())) {
      command = `STRING ${command}`
    }

    sendCommand(command)
  }

  const handleSendText = async () => {
    if (!textInput.trim()) {
      showToast('Please enter text to send', 'error')
      return
    }

    setSending(true)
    try {
      await api.runRawCommand(`STRING ${textInput}`)
      showToast('Text sent', 'success')
      setTextInput('')
    } catch (err) {
      showToast(
        `Failed to send text: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'error'
      )
    } finally {
      setSending(false)
    }
  }

  const handleSendTextWithEnter = async () => {
    if (!textInput.trim()) {
      showToast('Please enter text to send', 'error')
      return
    }

    setSending(true)
    try {
      await api.runRawCommand(`STRINGLN ${textInput}`)
      showToast('Text sent with Enter', 'success')
      setTextInput('')
    } catch (err) {
      showToast(
        `Failed to send text: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'error'
      )
    } finally {
      setSending(false)
    }
  }

  const renderKey = (key: KeyConfig, rowIndex: number, keyIndex: number) => {
    const isModifier = ['CONTROL', 'SHIFT', 'ALT', 'GUI'].includes(key.command)
    const isActive =
      (key.command === 'SHIFT' && shiftPressed) ||
      (key.command === 'CONTROL' && ctrlPressed) ||
      (key.command === 'ALT' && altPressed) ||
      (key.command === 'GUI' && guiPressed)

    return (
      <button
        key={`${rowIndex}-${keyIndex}`}
        onClick={() => {
          if (key.command === 'SHIFT') {
            setShiftPressed(!shiftPressed)
          } else if (key.command === 'CONTROL') {
            setCtrlPressed(!ctrlPressed)
          } else if (key.command === 'ALT') {
            setAltPressed(!altPressed)
          } else if (key.command === 'GUI') {
            setGuiPressed(!guiPressed)
          } else {
            handleKeyPress(key)
          }
        }}
        disabled={sending}
        className={`
          ${key.width || 'w-12'} h-12 px-2 py-1 text-sm font-medium rounded
          border border-gray-300 bg-white hover:bg-gray-100
          active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-150
          ${isActive ? 'bg-blue-500 text-white border-blue-600' : ''}
          ${isModifier ? 'font-semibold' : 'font-mono'}
        `}
      >
        {shiftPressed && key.shiftLabel ? key.shiftLabel : key.label}
      </button>
    )
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">On-Screen Keyboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Send keystrokes to the device using DuckyScript commands
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Text Input</h2>
            <div className="space-y-4">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type text here or use the keyboard below..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSendText}
                  disabled={!textInput.trim() || sending}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Text
                </button>
                <button
                  onClick={handleSendTextWithEnter}
                  disabled={!textInput.trim() || sending}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Text + Enter
                </button>
                <button
                  onClick={() => setTextInput('')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Keyboard</h2>
            <div className="space-y-2">
              <div className="flex gap-1 flex-wrap justify-center sm:justify-start">
                {FUNCTION_KEYS.map((key, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleKeyPress(key)}
                    disabled={sending}
                    className="w-12 h-10 px-2 py-1 text-xs font-mono border border-gray-300 bg-white hover:bg-gray-100 active:bg-gray-200 rounded disabled:opacity-50"
                  >
                    {key.label}
                  </button>
                ))}
              </div>

              {KEYBOARD_LAYOUT.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1 flex-wrap justify-center sm:justify-start">
                  {row.map((key, keyIndex) => renderKey(key, rowIndex, keyIndex))}
                </div>
              ))}

              <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                <div className="flex gap-1">
                  {ARROW_KEYS.map((key, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleKeyPress(key)}
                      disabled={sending}
                      className="w-12 h-12 px-2 py-1 text-lg font-medium border border-gray-300 bg-white hover:bg-gray-100 active:bg-gray-200 rounded disabled:opacity-50"
                    >
                      {key.label}
                    </button>
                  ))}
                </div>
                <div className="sm:ml-4 overflow-x-auto">
                  <div className="flex gap-1 flex-nowrap min-w-max">
                    {SPECIAL_KEYS.map((key, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleKeyPress(key)}
                        disabled={sending}
                        className="w-16 h-12 px-2 py-1 text-xs font-medium border border-gray-300 bg-white hover:bg-gray-100 active:bg-gray-200 rounded disabled:opacity-50"
                      >
                        {key.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs text-blue-800">
                <strong>Tip:</strong> Click modifier keys (Ctrl, Shift, Alt, Win) to toggle them,
                then click another key to send a combination. Click the modifier again to release.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
