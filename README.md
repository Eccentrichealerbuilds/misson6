# 🎮 Lobby Manager

A real-time collaborative lobby application built with React Together and Multisynq. Create and join lobbies for 2-10 people with live chat, ready states, and session sharing.

## Features

- **Create Lobbies**: Set up lobbies with custom names, player limits (2-10), and game types
- **Real-time Collaboration**: Powered by React Together for instant synchronization
- **Live Chat**: Built-in chat system for lobby communication
- **Ready States**: Players can mark themselves as ready
- **Session Sharing**: Share lobby URLs for easy joining
- **Multiple Game Types**: Support for different lobby categories
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- React Together API key (get free at [multisynq.io/coder](https://multisynq.io/coder))

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your API key:
   - Copy `.env` file
   - Replace `your_api_key_here` with your actual React Together API key

4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

### Creating a Lobby

1. Enter your nickname
2. Set a lobby name
3. Choose max players (2-10)
4. Select a game type
5. Click "Create Lobby"
6. Share the generated URL with friends

### Joining a Lobby

1. Click on a shared lobby URL
2. Enter your nickname
3. Join the lobby and chat with other players
4. Mark yourself as ready when prepared

## Game Types

- 🎮 **General Gaming**: For any type of game
- 🧠 **Strategy Games**: Chess, board games, etc.
- 🎉 **Party Games**: Fun group activities
- 🧩 **Trivia & Quiz**: Knowledge-based games
- 🎨 **Drawing Games**: Creative collaborative games
- 📝 **Word Games**: Text-based challenges

## Technology Stack

- **React**: Frontend framework
- **React Together**: Real-time collaboration
- **Multisynq**: Synchronization infrastructure
- **Vite**: Build tool and dev server
- **CSS3**: Modern styling with gradients and animations

## API Reference

This app uses React Together hooks:

- `useStateTogether`: Synchronized state across users
- `useConnectedUsers`: Track connected users
- `useFunctionTogether`: Synchronized function calls
- `useCreateRandomSession`: Create new sessions
- `useJoinUrl`: Get shareable URLs
- `useNicknames`: Manage user nicknames
- `useLeaveSession`: Leave current session

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this code for your own projects.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
# mission_6
# mission_6
