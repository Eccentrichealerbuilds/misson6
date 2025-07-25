import { useState } from 'react'
import LobbyCreatorStandalone from './components/LobbyCreatorStandalone'
import LobbyRoomStandalone from './components/LobbyRoomStandalone'
import './App.css'

function AppStandalone() {
  const [lobbyState, setLobbyState] = useState({
    name: '',
    maxPlayers: 4,
    isActive: false,
    createdAt: null,

  })

  const [connectedUsers, setConnectedUsers] = useState([
    { id: 'user-1', nickname: 'You', isYou: true }
  ])

  const [isTogether, setIsTogether] = useState(false)

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎮 Lobby Manager</h1>
        <div className="connection-status">
          <span className="status disconnected">
            ⚠️ Standalone Mode (React Together disabled)
          </span>
        </div>
      </header>

      <main className="app-main">
        {!lobbyState.isActive ? (
          <LobbyCreatorStandalone 
            lobbyState={lobbyState}
            setLobbyState={setLobbyState}
            setIsTogether={setIsTogether}
            setConnectedUsers={setConnectedUsers}
          />
        ) : (
          <LobbyRoomStandalone 
            lobbyState={lobbyState}
            setLobbyState={setLobbyState}
            connectedUsers={connectedUsers}
            setConnectedUsers={setConnectedUsers}
          />
        )}
      </main>
    </div>
  )
}

export default AppStandalone
