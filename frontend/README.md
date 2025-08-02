# CanvasConnect Frontend

A modern, collaborative whiteboard application built with React, Firebase, and real-time technologies.

## Features

- **Multi-template Support**: Whiteboard, Kanban, Presentations, Mind Maps, Flowcharts, Brainstorming, Meeting Notes
- **Real-time Collaboration**: Live cursor tracking, voice chat, screen sharing
- **Complete Authentication**: Login, Signup, Forgot Password, Account Management
- **Dark/Light Mode**: Beautiful themes with smooth transitions
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Production Ready**: Optimized builds, comprehensive testing, error handling

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/muskandz/CanvasConnect.git
   cd CanvasConnect/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm test` - Run test suite with Vitest
- `npm run test:ui` - Run tests with UI coverage
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Lint code with ESLint

## Testing

We have comprehensive test coverage with **58 tests** across all major components:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui
```

**Test Coverage:**
- Authentication flows (Login, Signup, Forgot Password)
- Component rendering and interactions
- Socket.IO real-time functionality
- Theme switching and accessibility
- Error handling and edge cases

## Production Build

```bash
# Create optimized production build
npm run build

# Preview production build
npm run preview
```

The build creates optimized, minified assets in the `dist/` directory.

## Tech Stack

### Core
- **React 19** - UI framework
- **Vite 6** - Build tool and dev server
- **React Router 7** - Client-side routing

### Styling
- **Tailwind CSS 3** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Lucide React** - Beautiful icons

### Authentication & Backend
- **Firebase Auth** - User authentication
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client

### Real-time Features
- **Konva & React-Konva** - Canvas rendering
- **Simple-peer** - WebRTC for voice/video
- **HTML2Canvas & jsPDF** - Export functionality

### Development
- **Vitest** - Fast testing framework
- **React Testing Library** - Component testing
- **ESLint** - Code linting
- **jsdom** - DOM testing environment

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── __tests__/      # Component tests
│   ├── ThemeToggle.jsx
│   ├── BoardCard.jsx
│   └── ...
├── pages/              # Page components
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── ForgotPassword.jsx
│   └── ...
├── contexts/           # React contexts
│   ├── ThemeContext.jsx
│   └── AuthContext.jsx
├── utils/              # Utility functions
├── test/               # Test setup and mocks
└── App.jsx            # Main app component
```

## Configuration Files

- `vite.config.js` - Vite configuration with testing setup
- `tailwind.config.js` - Tailwind CSS configuration
- `netlify.toml` - Netlify deployment configuration
- `vercel.json` - Vercel deployment configuration

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues:

1. Check the [Issues](https://github.com/muskandz/CanvasConnect/issues) page
2. Create a new issue with detailed information
3. Include browser version, OS, and steps to reproduce

## What's Next?

- [ ] Real-time cursor tracking
- [ ] Advanced collaboration features
- [ ] Advanced export options

---

Built with ❤️ by [Muskan](https://github.com/muskandz)
