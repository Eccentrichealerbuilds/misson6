import { useStateTogether, useConnectedUsers, useIsTogether } from 'react-together'
import LobbyCreatorReactTogether from './components/LobbyCreatorReactTogether'
import LobbyRoomReactTogether from './components/LobbyRoomReactTogether'
import WalletConnect from './components/WalletConnect'
import './App.css'



function App() {
  // Use React Together hooks for real-time collaboration
  const [lobbyState] = useStateTogether('lobby-state', {
    name: '',
    maxPlayers: 4,
    isActive: false,
    createdAt: null,

  })
  
  const connectedUsers = useConnectedUsers()
  const isTogether = useIsTogether()

  return (
    <div className="app">
      <header className="app-header" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1>🎮 Collaborative Lobby Manager</h1>
          <div className="connection-status">
            {isTogether ? (
              <span className="status connected">
                ✅ Connected via React Together ({connectedUsers.length} users)
              </span>
            ) : (
              <span className="status disconnected">
                ⚠️ Connecting to React Together...
              </span>
            )}
          </div>
        </div>
        <WalletConnect />
      </header>
      
      <main className="app-main">
        {!isTogether ? (
          <div className="loading-state" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem',
            gap: '1rem'
          }}>
            <div className="spinner" style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f4f6',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p>Connecting to React Together...</p>
            <p style={{ fontSize: '0.9rem', opacity: '0.7' }}>Restoring lobby state...</p>
          </div>
        ) : (!lobbyState.isActive && !lobbyState.name) ? (
          <LobbyCreatorReactTogether />
        ) : (
          <LobbyRoomReactTogether />
        )}
      </main>
    </div>
  )
}

export default App
