import { useState } from 'react'
import usePayLobbyFee from '../blockchain/usePayLobbyFee'
import { useStateTogether, useConnectedUsers, useCreateRandomSession, useJoinUrl } from 'react-together'



export default function LobbyCreatorReactTogether() {
  const [lobbyState, setLobbyState] = useStateTogether('lobby-state', {
    name: '',
    maxPlayers: 2,
    isActive: false,
    createdAt: null
  })

  const connectedUsers = useConnectedUsers()
  const createRandomSession = useCreateRandomSession()
  const joinUrl = useJoinUrl()

  // Monad testnet lobby fee (0.001 MON)
  const { pay, alreadyPaid, isPaying, error: payError } = usePayLobbyFee()

  const [localForm, setLocalForm] = useState({
    lobbyName: '',
    maxPlayers: 2
  })

  const [showJoinUrl, setShowJoinUrl] = useState(false)

  const handleCreateLobby = async () => {
    if (!localForm.lobbyName.trim()) {
      alert('Please enter a lobby name')
      return
    }

    // Ensure 0.001 MON fee is paid before lobby creation
    try {
      if (!alreadyPaid) {
        await pay()
      }
    } catch (err) {
      console.error('Payment failed or rejected:', err)
      alert('Payment failed or rejected. Lobby not created.')
      return
    }

    const newLobbyState = {
      name: localForm.lobbyName.trim(),
      maxPlayers: parseInt(localForm.maxPlayers),
      isActive: true,
      createdAt: new Date().toISOString(),

    }

    setLobbyState(newLobbyState)
    setShowJoinUrl(true)
  }

  const handleCreateNewSession = async () => {
    try {
      await createRandomSession()
      setShowJoinUrl(true)
    } catch (error) {
      console.error('Failed to create new session:', error)
      alert('Failed to create new session. Please try again.')
    }
  }

  const copyJoinUrl = () => {
    if (joinUrl) {
      // Replace server IP with custom domain
      const customJoinUrl = joinUrl.replace(/https?:\/\/[0-9.]+:5173/, 'https://monad-devil-level.duckdns.org')
      navigator.clipboard.writeText(customJoinUrl)
      alert('Join URL copied to clipboard!')
    }
  }

  // Get the custom domain join URL for display
  const displayJoinUrl = joinUrl ? joinUrl.replace(/https?:\/\/[0-9.]+:5173/, 'https://monad-devil-level.duckdns.org') : ''



  if (lobbyState.isActive) {
    return (
      <div className="lobby-creator">
        <div className="lobby-success">
          <h2>🎉 Lobby Created Successfully!</h2>
          <div className="lobby-details">
            <h3>🎮 {lobbyState.name}</h3>
            <p>Max Players: {lobbyState.maxPlayers}</p>
            <p>Connected Users: {connectedUsers.length}</p>
          </div>

          {showJoinUrl && joinUrl && (
            <div className="join-url-section">
              <h4>Share this URL to invite friends:</h4>
              <div className="join-url-container">
                <input
                  type="text"
                  value={displayJoinUrl}
                  readOnly
                  className="join-url"
                />
                <button onClick={copyJoinUrl} className="copy-btn">
                  📋 Copy
                </button>
              </div>
              <p className="sync-info">🚀 Real-time synchronized via React Together</p>
            </div>
          )}

          <div className="lobby-actions">
            <button 
              onClick={handleCreateNewSession}
              className="new-session-btn"
            >
              🔄 Create New Session
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="lobby-creator">
      <h2>Create a New Lobby</h2>
      <p>Set up a collaborative gaming session for 2-10 players</p>
      
      <div className="form-section">
        <div className="form-group">
          <label htmlFor="lobbyName">Lobby Name</label>
          <input
            id="lobbyName"
            type="text"
            value={localForm.lobbyName}
            onChange={(e) => setLocalForm(prev => ({ ...prev, lobbyName: e.target.value }))}
            placeholder="Enter lobby name..."
            maxLength={50}
          />
        </div>



        <div className="form-group">
          <label htmlFor="maxPlayers">Max Players</label>
          <select
            id="maxPlayers"
            value={localForm.maxPlayers}
            onChange={(e) => setLocalForm(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
          >
            {Array.from({ length: 9 }, (_, i) => i + 2).map(num => (
              <option key={num} value={num}>{num} players</option>
            ))}
          </select>
        </div>

        <div className="preview-section">
          <h3>Preview</h3>
          <div className="lobby-preview">
            <div className="preview-header">
              <span className="preview-emoji">🎮</span>
              <span className="preview-name">
                {localForm.lobbyName || 'Your Lobby Name'}
              </span>
            </div>
            <div className="preview-details">
              <span>👥 {localForm.maxPlayers} max players</span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleCreateLobby}
          className="create-btn"
          disabled={!localForm.lobbyName.trim()}
        >
          🚀 Create Lobby with React Together
        </button>
      </div>

      <div className="connection-info">
        <p>🔗 Connected Users: {connectedUsers.length}</p>
        <p>🚀 Powered by React Together & Multisynq</p>
      </div>
    </div>
  )
}
