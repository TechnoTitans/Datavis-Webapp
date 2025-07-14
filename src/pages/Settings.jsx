import { useState } from 'react'
import { supabase } from '../supabaseClient'

function Settings() {
  const [databaseEditingPerms, setDatabaseEditingPerms] = useState(() => {
    return localStorage.getItem('databaseEditingPerms') === 'true'
  })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [pendingToggleValue, setPendingToggleValue] = useState(false)

  const ADMIN_PASSWORD = '0' // haha hardcoded password
  // its ridiculously hard to hide it well
  // jiayu is too lazy
  // rls is too hard

  const handleToggleAttempt = (checked) => {
    if (checked && !databaseEditingPerms) {
      setPendingToggleValue(checked)
      setShowPasswordModal(true)
    } else {
      setDatabaseEditingPerms(checked)
      localStorage.setItem('databaseEditingPerms', checked.toString())
    }
  }

  const handlePasswordSubmit = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setDatabaseEditingPerms(pendingToggleValue)
      localStorage.setItem('databaseEditingPerms', pendingToggleValue.toString())
      setShowPasswordModal(false)
      setPasswordInput('')
      alert('Database editing permissions enabled!')
    } else {
      alert('Incorrect password!')
      setPasswordInput('')
    }
  }

  const handlePasswordCancel = () => {
    setShowPasswordModal(false)
    setPasswordInput('')
    setPendingToggleValue(false)
  }

  return (
    <div>
      <h2>Settings</h2>
      
      <div className="settings-section">
        <div className="setting-item">
          <label className="switch-label">
            <span>Database Editing Permissions</span>
            <div className="switch">
              <input
                type="checkbox"
                checked={databaseEditingPerms}
                onChange={(e) => handleToggleAttempt(e.target.checked)}
              />
              <span className="slider"></span>
            </div>
          </label>
          <p className="setting-description">
            Enable this to allow editing of database records. When disabled, data will be read-only.
            <br />
            <strong>⚠️ Password required to enable editing permissions.</strong>
          </p>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Admin Password Required</h3>
            <p>Enter the admin password to enable database editing permissions:</p>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter admin password"
              className="password-input"
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
            <div className="modal-buttons">
              <button onClick={handlePasswordSubmit} className="btn-confirm">
                Confirm
              </button>
              <button onClick={handlePasswordCancel} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings