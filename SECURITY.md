# Security Policy

## Supported Versions

This project is currently in active development. Security updates will be applied to the latest version.

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < Latest| :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please **DO NOT** open a public issue.

Instead:

1. **Email the maintainers** directly with details about the vulnerability
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if you have one)

We'll respond within 48 hours and work with you to understand and address the issue.

## Security Best Practices

When deploying this system:

### API Keys

- Never commit `.env` files to the repository
- Use environment variables or secret management services
- Rotate API keys regularly
- Use read-only keys where possible

### Network Security

- Run the server behind a reverse proxy (nginx, Caddy)
- Use HTTPS in production
- Implement rate limiting
- Consider IP whitelisting for sensitive deployments

### File Upload Security

- Validate file types before processing
- Scan uploaded files for malware
- Set file size limits
- Use a separate document storage location with restricted permissions

### Access Control

- Implement authentication before deploying to production
- Use role-based access control for multi-user deployments
- Log all document access for audit trails

### Data Privacy

- Ensure compliance with relevant data protection regulations
- Don't process sensitive personal information without proper safeguards
- Implement data retention policies
- Consider using local models for sensitive documents

## Known Security Considerations

1. **File System Access**: The server reads files from the configured `DATA_DIR`. Make sure this directory doesn't contain sensitive system files.

2. **LLM API Keys**: API keys for OpenRouter/OpenAI are stored in environment variables. Keep these secure.

3. **No Built-in Authentication**: The current version doesn't include user authentication. Add this before exposing to the internet.

4. **CORS Configuration**: The system allows cross-origin requests. Configure this appropriately for production.

## Updates

We'll announce security updates through:

- GitHub releases
- Security advisories on the repository

Stay updated by watching the repository.
