# Contributing to CanvasConnect

Thank you for your interest in contributing to CanvasConnect! This document provides guidelines and information for contributors.

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Issue Reporting](#issue-reporting)

## Code of Conduct

### Our Pledge
We are committed to providing a friendly, safe, and welcoming environment for all contributors, regardless of experience level, gender identity, sexual orientation, disability, ethnicity, religion, or similar personal characteristics.

### Expected Behavior
- Be respectful and inclusive
- Use welcoming and inclusive language
- Be collaborative and constructive
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior
- Harassment, discriminatory language, or personal attacks
- Trolling, insulting comments, or excessive criticism
- Publishing private information without permission
- Any behavior that would be inappropriate in a professional setting

## Getting Started

### Prerequisites
- **Node.js 18+** for frontend development
- **Python 3.9+** for backend development
- **Git** for version control
- **MongoDB** for database (local or Atlas)
- **Firebase Account** for authentication

### Development Setup
```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/canvasconnect_production.git
cd canvasconnect_production

# 2. Set up frontend
cd frontend
npm install
cp .env.example .env.local
# Configure your environment variables
npm run dev

# 3. Set up backend (in another terminal)
cd backend
pip install -r requirements.txt
cp .env.example .env
# Configure your environment variables
python app.py

# 4. Run tests to ensure everything works
cd frontend && npm test
cd backend && python -m pytest
```

## Development Workflow

### Branch Strategy
- **main**: Production-ready code
- **develop**: Integration branch for new features
- **feature/***: Individual feature development
- **bugfix/***: Bug fixes
- **hotfix/***: Critical production fixes

### Creating a Feature
```bash
# 1. Create and switch to a new branch
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# 2. Make your changes
# Write code, tests, and documentation

# 3. Commit your changes
git add .
git commit -m "feat: add your feature description"

# 4. Push and create PR
git push origin feature/your-feature-name
# Create Pull Request through GitHub interface
```

### Commit Message Format
We use [Conventional Commits](https://www.conventionalcommits.org/) for consistent commit messages:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(auth): add password reset functionality
fix(canvas): resolve drawing synchronization issue
docs(readme): update installation instructions
test(components): add tests for Board component
```

## Coding Standards

### Frontend (React/TypeScript)

#### Code Style
```javascript
// Use functional components with hooks
const BoardComponent = ({ title, onSave }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Custom hooks for complex logic
  const { boards, createBoard } = useBoards();
  
  return (
    <div className="board-container">
      {/* Component content */}
    </div>
  );
};

// Export at the bottom
export default BoardComponent;
```

#### TypeScript Guidelines
```typescript
// Define clear interfaces
interface Board {
  id: string;
  title: string;
  type: 'whiteboard' | 'kanban' | 'presentation';
  owner: string;
  collaborators: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Use proper typing for props
interface BoardProps {
  board: Board;
  onUpdate: (board: Board) => void;
  isEditable?: boolean;
}
```

#### Styling Guidelines
```css
/* Use Tailwind CSS classes */
.board-container {
  @apply flex flex-col h-full bg-white dark:bg-gray-900;
}

/* Custom CSS only when necessary */
.custom-animation {
  transition: transform 0.2s ease-in-out;
}
```

### Backend (Python/Flask)

#### Code Style
```python
# Follow PEP 8 guidelines
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit

class BoardService:
    """Service for handling board operations."""
    
    def __init__(self, db):
        self.db = db
    
    def create_board(self, board_data):
        """Create a new board with validation."""
        # Validate input
        if not board_data.get('title'):
            raise ValueError("Board title is required")
        
        # Create board
        board = {
            'title': board_data['title'],
            'type': board_data.get('type', 'whiteboard'),
            'created_at': datetime.utcnow()
        }
        
        return self.db.boards.insert_one(board)

# Use clear function and variable names
def handle_board_update(board_id, update_data):
    """Handle real-time board updates."""
    pass
```

#### API Design
```python
# RESTful endpoints
@app.route('/api/boards', methods=['GET'])
def get_boards():
    """Get all boards for the authenticated user."""
    pass

@app.route('/api/boards', methods=['POST'])
def create_board():
    """Create a new board."""
    pass

@app.route('/api/boards/<board_id>', methods=['PUT'])
def update_board(board_id):
    """Update an existing board."""
    pass

# Socket.IO events
@socketio.on('board_update')
def handle_board_update(data):
    """Handle real-time board updates."""
    pass
```

## Testing Guidelines

### Frontend Testing

#### Component Tests
```javascript
// Use React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import BoardComponent from '../BoardComponent';

describe('BoardComponent', () => {
  it('should render board title', () => {
    const mockBoard = {
      id: '1',
      title: 'Test Board',
      type: 'whiteboard'
    };
    
    render(<BoardComponent board={mockBoard} />);
    
    expect(screen.getByText('Test Board')).toBeInTheDocument();
  });
  
  it('should call onUpdate when board is modified', () => {
    const mockOnUpdate = vi.fn();
    const mockBoard = { /* board data */ };
    
    render(<BoardComponent board={mockBoard} onUpdate={mockOnUpdate} />);
    
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    
    expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({
      id: mockBoard.id
    }));
  });
});
```

#### Integration Tests
```javascript
// Test complete user flows
describe('Board Creation Flow', () => {
  it('should create and navigate to new board', async () => {
    render(<App />);
    
    // Navigate to boards page
    fireEvent.click(screen.getByText('My Boards'));
    
    // Create new board
    fireEvent.click(screen.getByText('Create Board'));
    fireEvent.change(screen.getByLabelText('Board Title'), {
      target: { value: 'New Board' }
    });
    fireEvent.click(screen.getByText('Create'));
    
    // Verify navigation
    await waitFor(() => {
      expect(screen.getByText('New Board')).toBeInTheDocument();
    });
  });
});
```

### Backend Testing

#### Unit Tests
```python
import pytest
from app import create_app
from services.board_service import BoardService

class TestBoardService:
    def setup_method(self):
        self.app = create_app(testing=True)
        self.app_context = self.app.app_context()
        self.app_context.push()
        
    def teardown_method(self):
        self.app_context.pop()
    
    def test_create_board_success(self):
        """Test successful board creation."""
        service = BoardService(db)
        board_data = {
            'title': 'Test Board',
            'type': 'whiteboard'
        }
        
        result = service.create_board(board_data)
        
        assert result.inserted_id is not None
        
    def test_create_board_missing_title(self):
        """Test board creation fails without title."""
        service = BoardService(db)
        board_data = {'type': 'whiteboard'}
        
        with pytest.raises(ValueError, match="Board title is required"):
            service.create_board(board_data)
```

#### API Tests
```python
def test_get_boards_endpoint(client):
    """Test GET /api/boards endpoint."""
    response = client.get('/api/boards')
    
    assert response.status_code == 200
    assert 'boards' in response.json

def test_create_board_endpoint(client):
    """Test POST /api/boards endpoint."""
    board_data = {
        'title': 'Test Board',
        'type': 'whiteboard'
    }
    
    response = client.post('/api/boards', json=board_data)
    
    assert response.status_code == 201
    assert response.json['board']['title'] == 'Test Board'
```

### Test Coverage Requirements
- **Minimum Coverage**: 80% for both frontend and backend
- **Critical Paths**: 95% coverage for authentication and core features
- **New Features**: 90% coverage required

## Pull Request Process

### Before Submitting
1. **Code Quality**
   ```bash
   # Frontend checks
   npm run lint
   npm run type-check
   npm test
   npm run build
   
   # Backend checks
   python -m flake8 .
   python -m pytest
   python -m mypy .
   ```

2. **Documentation**
   - Update README if necessary
   - Add/update API documentation
   - Include code comments for complex logic

3. **Testing**
   - Add tests for new features
   - Ensure all existing tests pass
   - Test manually in browser

### Pull Request Template
When creating a PR, use this template:

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to not work)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] All tests passing

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] No new warnings or errors
```

### Review Process
1. **Automated Checks**: All CI checks must pass
2. **Code Review**: At least one maintainer approval required
3. **Testing**: Manual testing for UI changes
4. **Documentation**: Verify docs are updated appropriately

## Issue Reporting

### Bug Reports
Use the bug report template:

```markdown
**Bug Description**
Clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What should happen.

**Actual Behavior**
What actually happens.

**Environment**
- OS: [e.g., Windows 10, macOS Big Sur]
- Browser: [e.g., Chrome 95, Firefox 94]
- Version: [e.g., 1.2.3]

**Screenshots**
Add screenshots if applicable.

**Additional Context**
Any other relevant information.
```

### Feature Requests
Use the feature request template:

```markdown
**Feature Description**
Clear description of the feature.

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should this work?

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Mockups, examples, or references.
```

## Labels and Tags

### Issue Labels
- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention needed
- `priority-high`: High priority issue
- `priority-low`: Low priority issue

### PR Labels
- `work-in-progress`: Still being worked on
- `ready-for-review`: Ready for code review
- `needs-testing`: Requires additional testing
- `breaking-change`: Introduces breaking changes

## Areas for Contribution

### High Priority
- **Performance Optimization**: Frontend bundle size, backend response times
- **Accessibility**: WCAG compliance, keyboard navigation
- **Mobile Experience**: Touch gestures, responsive design
- **Testing**: Increase test coverage, E2E tests

### Medium Priority
- **New Board Templates**: Gantt charts, wireframes, floor plans
- **Export Features**: PDF, PNG, SVG export options
- **Integration APIs**: Slack, Discord, Microsoft Teams
- **Collaboration Features**: Comments, mentions, notifications

### Low Priority
- **Themes**: Custom color schemes, branded themes
- **Localization**: Multi-language support
- **Analytics**: Usage tracking, performance metrics
- **Documentation**: Video tutorials, API examples

## Recognition

### Contributors
All contributors will be recognized in:
- `CONTRIBUTORS.md` file
- GitHub repository contributors section
- Release notes for significant contributions

### Contribution Types
We recognize various types of contributions:
- Code contributions
- Documentation improvements
- Bug reports and testing
- Feature ideas and feedback
- Design and UI/UX improvements
- Community support and discussions

## Getting Help

### Community Channels
- **GitHub Discussions**: For questions and general discussion
- **GitHub Issues**: For bug reports and feature requests
- **Email**: muskandadhich14@gmail.com for direct contact

### Documentation Resources
- [README.md](README.md): Project overview and setup
- [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md): Detailed technical docs
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md): Deployment instructions

## License

By contributing to CanvasConnect, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to CanvasConnect! **

Your contributions help make collaborative whiteboarding better for everyone.
