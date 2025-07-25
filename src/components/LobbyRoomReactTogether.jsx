import React, { useState, useEffect } from 'react'
import usePayLobbyFee from '../blockchain/usePayLobbyFee'
import { useStateTogether, useConnectedUsers, useStateTogetherWithPerUserValues, useJoinUrl, useLeaveSession, useNicknames } from 'react-together'
import { useAccount } from 'wagmi'
import Game from '../Game.jsx'



export default function LobbyRoomReactTogether() {
  const { address, isConnected } = useAccount();
  // Paywall hook (0.001 MON)
  const { pay, alreadyPaid, isPaying, error: payError } = usePayLobbyFee()
  const [nickname, setNickname, allNicknames] = useNicknames();
  const [nicknameInput, setNicknameInput] = useState(''); // Separate input state, starts empty
  const [showNicknameEdit, setShowNicknameEdit] = useState(false);
  
  const [lobbyState, setLobbyState] = useStateTogether('lobby-state', {
    name: '',
    maxPlayers: 4,
    isActive: false,
    createdAt: null,
    gameStarted: false
  })

  // Shared nicknames state - synced across all users
  const [sharedNicknames, setSharedNicknames] = useStateTogether('shared-nicknames', {})

  const [chatMessages, setChatMessages] = useStateTogether('chat-messages', [])
  const [playerReady, setPlayerReady, allPlayerReady] = useStateTogetherWithPerUserValues('player-ready', false)
  // Wallet address per user (per-user shared state)
  const [walletAddress, setWalletAddress, allWalletAddresses] = useStateTogetherWithPerUserValues('wallet-address', '')
  
  const connectedUsers = useConnectedUsers()
  const isHost = connectedUsers && connectedUsers[0]?.isYou
  // If user is not host, enforce payment before entering lobby UI
  if (!isHost && !alreadyPaid) {
    return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',gap:'1rem',textAlign:'center'}}>
        <h2>Pay 0.001 MON to Join Lobby</h2>
        <button disabled={isPaying} onClick={async ()=>{try{await pay()}catch(e){alert('Payment failed or rejected.')}}}>
          {isPaying ? 'Waiting for wallet...' : 'Pay & Continue'}
        </button>
        {payError && <p style={{color:'red'}}>Error: {payError.message}</p>}
      </div>
    )
  }
  const joinUrl = useJoinUrl()
  const leaveSession = useLeaveSession()
  
  // Check if lobby is full (following multisynq pattern)
  const isLobbyFull = connectedUsers.length >= (lobbyState?.maxPlayers || 4)
  const canJoinLobby = connectedUsers.length <= (lobbyState?.maxPlayers || 4)
  
  // Active enforcement: Remove excess users beyond maxPlayers limit
  React.useEffect(() => {
    if (connectedUsers.length > (lobbyState?.maxPlayers || 4)) {
      // If current user is beyond the limit (not in first N users), remove them
      const maxPlayers = lobbyState?.maxPlayers || 4
      const currentUser = connectedUsers.find(u => u.isYou)
      const currentUserIndex = connectedUsers.findIndex(u => u.isYou)
      
      // Remove users beyond the maxPlayers limit (keep first N users who joined)
      if (currentUserIndex >= maxPlayers) {
        console.log(`Lobby full (${connectedUsers.length}/${maxPlayers}). Removing excess user.`)
        leaveSession()
      }
    }
  }, [connectedUsers.length, lobbyState?.maxPlayers, leaveSession])

  const [newMessage, setNewMessage] = useState('')
  const [showInvite, setShowInvite] = useState(false)

  // Sync wallet address to shared state when connected
  React.useEffect(() => {
    if (isConnected && address && walletAddress !== address) {
      setWalletAddress(address)
    } else if (!isConnected && walletAddress) {
      setWalletAddress('')
    }
  }, [isConnected, address, walletAddress, setWalletAddress])

  // No need to sync local nickname - use separate input state following multisynq pattern

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (newMessage.trim()) {
      const currentUser = connectedUsers?.find(u => u.isYou)
      const message = {
        id: Date.now() + Math.random(),
        text: newMessage.trim(),
        userId: currentUser?.id || 'unknown',
        nickname: nickname || 'Anonymous', // Use actual nickname from useNicknames
        timestamp: new Date().toISOString()
      }
      
      setChatMessages(prev => [...(prev || []).slice(-49), message])
      setNewMessage('')
    }
  }

  const handleNicknameUpdate = (e) => {
    e.preventDefault()
    if (nicknameInput.trim() && nicknameInput.trim() !== nickname) {
      const newNickname = nicknameInput.trim()
      setNickname(newNickname)
      // Save nickname to localStorage for persistence
      localStorage.setItem('lobby-user-nickname', newNickname)
      setNicknameInput('') // Clear input after successful update
      setShowNicknameEdit(false)
    }
  }

  const handleNicknameCancel = () => {
    setNicknameInput('') // Clear input on cancel
    setShowNicknameEdit(false)
  }

  // Helper function to get display name for any user - using the SAME approach as chat
  const getUserDisplayName = (user) => {
    if (!user?.id) return 'Unknown User'
    
    // Extract nicknames from chat messages (same source as chat display)
    const userNicknameFromChat = findLatestNicknameFromChat(user.id)
    if (userNicknameFromChat) {
      return userNicknameFromChat
    }
    
    // Fallback to user.nickname property if available
    if (user.nickname) {
      return user.nickname
    }
    
    // Final fallback to User + ID
    return `User ${user.id.slice(-4)}`
  }
  
  // Find the latest nickname for a user from their chat messages (same data source as chat)
  const findLatestNicknameFromChat = (userId) => {
    if (!chatMessages || chatMessages.length === 0) return null
    
    // Find the most recent message from this user
    for (let i = chatMessages.length - 1; i >= 0; i--) {
      const msg = chatMessages[i]
      if (msg?.userId === userId && msg?.nickname) {
        return msg.nickname
      }
    }
    return null
  }

  const handleToggleReady = () => {
    setPlayerReady(!playerReady)
  }

  const handleLeave = async () => {
    if (confirm('Are you sure you want to leave the lobby?')) {
      try {
        // Leave the React Together session first
        await leaveSession()
        
        // Reset lobby state to inactive
        setLobbyState({
          name: '',
          maxPlayers: 4,
          isActive: false,
          createdAt: null,
          gameStarted: false
        })
        
        // Clear URL parameters to start fresh
        const newUrl = new URL(window.location)
        newUrl.search = '' // Clear all query parameters
        window.history.pushState({}, '', newUrl)
        
        // Trigger session reset event to reinitialize ReactTogetherProvider
        window.dispatchEvent(new CustomEvent('lobby-session-reset'))
        
      } catch (error) {
        console.error('Error leaving lobby:', error)
        // Force page reload as fallback
        window.location.reload()
      }
    }
  }

  const copyJoinUrl = () => {
    if (joinUrl) {
      navigator.clipboard.writeText(joinUrl)
      alert('Join URL copied to clipboard!')
    }
  }


  const readyCount = Object.values(allPlayerReady || {}).filter(Boolean).length
  const allReady = (connectedUsers?.length || 0) >= 2 && readyCount === (connectedUsers?.length || 0)

  if (lobbyState?.gameStarted) {
    return <Game />
  }
  
  // Pre-join check: Show lobby full message before users get into the lobby
  const currentUserIndex = connectedUsers.findIndex(u => u.isYou)
  const maxPlayers = lobbyState?.maxPlayers || 4
  
  // If lobby is at capacity and current user is beyond the limit
  if (connectedUsers.length > maxPlayers && currentUserIndex >= maxPlayers) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '3rem',
        textAlign: 'center'
      }}>
        <div style={{
          background: '#fef2f2',
          border: '2px solid #fecaca',
          borderRadius: '12px',
          padding: '3rem 2rem',
          maxWidth: '500px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h1 style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '1.5rem' }}>Lobby Full!</h1>
          <p style={{ color: '#7f1d1d', marginBottom: '1rem', fontSize: '1.1rem' }}>
            This lobby is currently full
          </p>
          <div style={{
            background: '#fee2e2',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: '1px solid #fca5a5'
          }}>
            <strong style={{ color: '#991b1b' }}>{connectedUsers.length}/{maxPlayers}</strong>
            <span style={{ color: '#7f1d1d' }}> players currently in lobby</span>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '2rem' }}>
            Sorry, you can't join this lobby right now. You can create your own lobby or try joining a different one.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                // Clear URL parameters and go to lobby creation
                window.history.replaceState({}, '', window.location.pathname)
                window.location.reload()
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              🆕 Create New Lobby
            </button>
            <button 
              onClick={() => window.location.href = window.location.origin}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              🏠 Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="lobby-room">
      <div className="lobby-header">
        <div className="lobby-info">
          <h2>🎮 {lobbyState?.name || 'Loading...'}</h2>
          <div className="lobby-meta">
            <span className="player-count" style={{
              color: isLobbyFull ? '#dc2626' : 'inherit',
              fontWeight: isLobbyFull ? 'bold' : 'normal'
            }}>
              👥 {connectedUsers?.length || 0}/{lobbyState?.maxPlayers || 4} players
              {isLobbyFull && ' 🚫 FULL'}
            </span>

            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
              🚀 React Together Session
            </span>
          </div>
        </div>
        
        <div className="lobby-actions">
          <button 
            className="nickname-btn"
            onClick={() => setShowNicknameEdit(!showNicknameEdit)}
            style={{ marginRight: '0.5rem', background: '#8b5cf6', color: 'white' }}
          >
            ✏️ {showNicknameEdit ? 'Cancel' : 'Edit Name'}
          </button>
          <button 
            className="invite-btn"
            onClick={() => setShowInvite(!showInvite)}
            disabled={isLobbyFull}
            style={{
              opacity: isLobbyFull ? 0.5 : 1,
              cursor: isLobbyFull ? 'not-allowed' : 'pointer'
            }}
            title={isLobbyFull ? 'Lobby is full - cannot invite more players' : 'Invite friends to join'}
          >
            📨 {isLobbyFull ? 'Full' : 'Invite'}
          </button>
          <button 
            className="leave-btn"
            onClick={handleLeave}
          >
            🚪 Leave
          </button>
          {isHost && (
            <button
              className="start-game-btn"
              style={{ marginLeft: '1rem', background: '#22c55e', color: 'white', fontWeight: 600 }}
              onClick={() => setLobbyState(state => ({ ...state, gameStarted: true }))}
              disabled={connectedUsers.length < 2}
            >
              🚀 Start Game
            </button>
          )}
        </div>
      </div>

      {showInvite && joinUrl && (
        <div className="invite-section">
          <h3>Invite Friends to Join</h3>
          <div className="join-url-container">
            <input
              type="text"
              value={joinUrl}
              readOnly
              className="join-url"
            />
            <button onClick={copyJoinUrl} className="copy-btn">
              📋 Copy
            </button>
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
            🚀 Real-time synchronized lobby powered by React Together
          </p>
        </div>
      )}

      {/* Nickname Editor */}
      {showNicknameEdit && (
        <div className="nickname-editor" style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>✏️ Edit Your Nickname</h4>
          <form onSubmit={handleNicknameUpdate} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              placeholder="Enter new nickname..."
              maxLength={20}
              style={{
                flex: '1',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
              autoFocus
            />
            <button
              type="submit"
              disabled={!nicknameInput.trim() || nicknameInput.trim() === nickname}
              style={{
                padding: '0.5rem 1rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                opacity: (!nicknameInput.trim() || nicknameInput.trim() === nickname) ? 0.5 : 1
              }}
            >
              ✅ Save
            </button>
            <button
              type="button"
              onClick={handleNicknameCancel}
              style={{
                padding: '0.5rem 1rem',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              ❌ Cancel
            </button>
          </form>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
            Current: <strong>{nickname || 'Anonymous'}</strong>
          </p>
        </div>
      )}

      <div className="lobby-content">
        <div className="players-section">
          <h3>Players ({connectedUsers?.length || 0}/{lobbyState?.maxPlayers || 4})</h3>
          
          <div className="players-list">
            {(connectedUsers || []).map(user => {
              const userId = user?.userId || user?.id // Handle both userId and id properties
              const isReady = (allPlayerReady || {})[userId] || false
              const wallet = (allWalletAddresses || {})[userId] || ''
              return (
                <div key={userId || Math.random()} className={`player-card ${isReady ? 'ready' : ''}`}>
                  <div className="player-info">
                    <span className="player-name">
                      {user?.isYou ? (nickname || 'You') : (allNicknames[userId] || `User ${userId?.slice(-4)}`)} {user?.isYou && '(You)'}
                    </span>
                    {wallet && (
                      <span className="player-wallet" style={{ fontFamily: 'monospace', fontSize: '0.85em', color: '#6366f1', marginLeft: 4 }}>
                        {wallet.slice(0, 6)}...{wallet.slice(-4)}
                      </span>
                    )}
                    <span className="player-status">
                      {isReady ? '✅ Ready' : '⏳ Not Ready'}
                    </span>
                  </div>
                  {user?.isYou && (
                    <button
                      className={`ready-btn ${isReady ? 'ready' : ''}`}
                      onClick={handleToggleReady}
                    >
                      {isReady ? 'Not Ready' : 'Ready Up'}
                    </button>
                  )}
                </div>
              )
            })}
            
            {/* Show empty slots */}
            {Array.from({ length: Math.max(0, (lobbyState?.maxPlayers || 4) - (connectedUsers?.length || 0)) }).map((_, i) => (
              <div key={`empty-${i}`} className="player-card empty">
                <div className="player-info">
                  <span className="player-name">Waiting for player...</span>
                </div>
              </div>
            ))}
          </div>

          {allReady && (
            <div className="all-ready-banner">
              🎉 All players are ready! Game can start!
              <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.9 }}>
                🚀 Synchronized via React Together
              </div>
            </div>
          )}
        </div>

        <div className="chat-section">
          <h3>Real-time Chat</h3>
          <div className="chat-messages">
            {(chatMessages || []).length === 0 ? (
              <div className="no-messages">
                No messages yet. Say hello! 👋
                <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7 }}>
                  🚀 Messages sync in real-time via React Together
                </div>
              </div>
            ) : (
              (chatMessages || []).map(msg => (
                <div key={msg?.id || Math.random()} className="chat-message">
                  <span className="message-author">{msg?.nickname || 'Unknown'}:</span>
                  <span className="message-text">{msg?.text || ''}</span>
                  <span className="message-time">
                    {msg?.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : ''}
                  </span>
                </div>
              ))
            )}
          </div>
          
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              maxLength={200}
              className="chat-input"
            />
            <button type="submit" disabled={!newMessage.trim()} className="send-btn">
              📤
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
