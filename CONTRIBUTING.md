# Contributing to Document Q&A System

Thanks for considering contributing to this project! We welcome all kinds of contributions - bug reports, feature requests, documentation improvements, and code contributions.

## Getting Started

1. **Fork the repository** and clone it locally
2. **Set up your development environment**:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Create a branch** for your changes:

   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Before You Start

- Check existing issues to see if someone's already working on it
- For major changes, open an issue first to discuss what you'd like to change
- Make sure your idea aligns with the project goals

### Making Changes

1. **Write clean code**: Follow existing code patterns and style
2. **Add comments**: Explain complex logic or non-obvious decisions
3. **Update documentation**: If you change APIs or add features, update the README
4. **Test your changes**: Make sure everything works locally before submitting

### Backend Changes

- Keep functions focused on a single task
- Add type hints where possible
- Document configuration options in `.env.example`
- Consider memory usage for large document processing

### Frontend Changes

- Use TypeScript for type safety
- Follow React best practices
- Keep components small and reusable
- Test on different screen sizes

## Submitting Changes

1. **Commit your changes**:

   ```bash
   git add .
   git commit -m "Brief description of changes"
   ```

   Write clear commit messages:
   - Use present tense ("Add feature" not "Added feature")
   - Keep the first line under 50 characters
   - Add details in the commit body if needed

2. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

3. **Open a Pull Request**:
   - Describe what you changed and why
   - Reference any related issues
   - Include screenshots for UI changes

## Code Review Process

- A maintainer will review your PR within a few days
- We might ask for changes or clarifications
- Once approved, we'll merge your contribution

## Reporting Bugs

Found a bug? Help us fix it by submitting a detailed bug report:

1. Check if the bug has already been reported
2. Open a new issue with a clear title
3. Include:
   - What you expected to happen
   - What actually happened
   - Steps to reproduce the issue
   - Your environment (OS, Python version, etc.)
   - Error messages or logs

## Feature Requests

Have an idea for a new feature?

1. Check if it's already been suggested
2. Open an issue describing:
   - The problem you're trying to solve
   - How you think it should work
   - Why this would be useful to others

## Questions?

If you're stuck or need help:

- Check the documentation in the README
- Look through existing issues
- Open a new issue with the "question" label

## Code of Conduct

This project follows a standard code of conduct. Be respectful, constructive, and helpful in all interactions.

---

Thank you for helping make this project better! 🙌
