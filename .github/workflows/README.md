# CI/CD Pipeline Documentation

This repository includes a comprehensive CI/CD pipeline built with GitHub Actions to ensure code quality, security, and reliable deployments.

## 🚀 Pipeline Overview

### Workflows

1. **[CI Pipeline](.github/workflows/ci.yml)** - Main continuous integration workflow
2. **[PR Check](.github/workflows/pr-check.yml)** - Pull request validation
3. **[Release](.github/workflows/release.yml)** - Automated releases and deployments

## 🔧 CI Pipeline (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

### 1. Setup Dependencies
- Caches `node_modules` for faster subsequent builds
- Uses Node.js 20.x
- Installs dependencies with `npm ci`

### 2. Code Linting
- Runs ESLint on TypeScript and HTML files
- Performs TypeScript compiler checks
- Ensures code quality and consistency

### 3. Unit Testing
- Runs comprehensive test suite with Vitest
- Generates code coverage reports
- Uploads coverage to Codecov (if configured)
- Stores coverage artifacts

### 4. Build Application
- Builds both development and production configurations
- Analyzes bundle sizes for production builds
- Stores build artifacts

### 5. Security Audit
- Runs `npm audit` for known vulnerabilities
- Uses `audit-ci` for enhanced security checks
- Fails on moderate or higher severity issues

### 6. Quality Gate
- Ensures all previous jobs pass
- Comments on PR with results
- Blocks merge if any check fails

## 🔍 PR Check Pipeline (`pr-check.yml`)

**Triggers:**
- Pull request events (open, sync, reopen, ready_for_review)

**Features:**

### Quick Validation
- Skips checks for draft PRs
- Fast TypeScript and lint checks on changed files only
- Validates that new components have corresponding tests

### Coverage Validation
- Enforces minimum 70% code coverage
- Provides detailed coverage feedback

### Dependency Security
- Runs security audit when `package.json` changes
- Prevents introduction of vulnerable dependencies

### Smart Comments
- Automatically comments on PRs with check results
- Provides clear feedback on what needs to be fixed

## 🚀 Release Pipeline (`release.yml`)

**Triggers:**
- Tags matching `v*.*.*` pattern (e.g., `v1.0.0`, `v2.1.3-beta`)

**Process:**

1. **Validation**
   - Validates semantic version format
   - Detects prerelease versions (alpha, beta, rc)

2. **Full CI Check**
   - Runs complete CI pipeline
   - Ensures release quality

3. **Build Release**
   - Creates production build
   - Generates build metadata
   - Creates distribution packages (tar.gz, zip)

4. **GitHub Release**
   - Auto-generates changelog from commit messages
   - Creates GitHub release with assets
   - Handles prerelease vs stable releases

5. **Deployment** (Stable releases only)
   - Deploys to Netlify production
   - Requires environment secrets configuration

## 📋 Code Quality Standards

### Linting (ESLint)
- **Configuration**: `.eslintrc.json`
- **Rules**: Angular-specific rules + TypeScript best practices
- **Coverage**: TypeScript and HTML files
- **Commands**:
  ```bash
  npm run lint        # Fix issues automatically
  npm run lint:check  # Check without fixing
  ```

### Code Formatting (Prettier)
- **Configuration**: `.prettierrc.json`
- **Commands**:
  ```bash
  npm run format       # Format code
  npm run format:check # Check formatting
  ```

### TypeScript
- **Strict mode enabled**
- **Commands**:
  ```bash
  npm run tsc:check   # Type checking without emitting
  ```

### Testing
- **Framework**: Vitest with jsdom
- **Coverage**: v8 provider
- **Threshold**: 70% minimum coverage
- **Commands**:
  ```bash
  npm run test            # Watch mode
  npm run test:run        # Single run
  npm run test:coverage   # With coverage
  ```

## 🔐 Security Features

### Dependency Auditing
- Runs on every CI build
- Blocks moderate+ severity vulnerabilities
- Checks for known security issues

### Code Scanning
- ESLint security rules
- TypeScript strict mode
- Input validation checks

### Secret Management
- Uses GitHub Secrets for sensitive data
- No hardcoded credentials
- Environment-specific configurations

## 📊 Coverage & Reporting

### Test Coverage
- **Target**: 70% minimum
- **Reports**: HTML, LCOV, text formats
- **Integration**: Codecov support (optional)

### Bundle Analysis
- Size tracking for production builds
- Performance budget enforcement
- Asset optimization verification

## 🚀 Deployment

### Netlify Integration
- **Production**: Automatic deployment on stable releases
- **Preview**: Manual trigger for feature branches
- **Configuration**: Uses `netlify.toml`

**Required Secrets:**
```
NETLIFY_AUTH_TOKEN  # Netlify API token
NETLIFY_SITE_ID     # Site identifier
CODECOV_TOKEN       # Codecov integration (optional)
```

## 📝 NPM Scripts Reference

### Development
```bash
npm start           # Development server
npm run watch       # Build with watch mode
npm test            # Test in watch mode
npm run test:ui     # Test with UI
```

### Quality Checks
```bash
npm run lint        # Lint and fix
npm run tsc:check   # TypeScript check
npm run format      # Format code
npm run pre-commit  # Run all checks
```

### Build & Deploy
```bash
npm run build       # Development build
npm run build:prod  # Production build
npm run ci          # Full CI pipeline locally
```

## 🔄 Workflow Triggers

### Automatic Triggers
- **Push to main/develop**: Full CI pipeline
- **Pull Request**: PR validation + full CI
- **Release Tag**: Release pipeline + deployment

### Manual Triggers
- All workflows can be triggered manually via GitHub Actions UI
- Useful for testing or emergency deployments

## 🎯 Best Practices

### Branch Protection
Configure these branch protection rules for `main`:
- Require PR reviews
- Require status checks to pass
- Require branches to be up to date
- Restrict pushes to specific users/teams

### Commit Messages
Follow conventional commits for automatic changelog generation:
```
feat: add new user authentication
fix: resolve memory leak in dashboard
docs: update API documentation
test: add unit tests for user service
```

### Release Process
1. Create release branch: `release/v1.0.0`
2. Update version in package.json
3. Create PR to main
4. Merge PR
5. Create and push tag: `git tag v1.0.0 && git push --tags`
6. Release pipeline runs automatically

## 🛠️ Local Development

### Pre-commit Hooks
Install Husky for local pre-commit checks:
```bash
npm install husky --save-dev
npx husky install
```

The pre-commit hook runs:
- ESLint checks
- TypeScript validation
- Unit tests

### IDE Integration
For VS Code, install these extensions:
- ESLint
- Prettier
- Angular Language Service
- GitLens

## 📚 Additional Resources

- [Angular Testing Guide](https://angular.io/guide/testing)
- [ESLint Angular Rules](https://github.com/angular-eslint/angular-eslint)
- [Vitest Documentation](https://vitest.dev/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Netlify Deployment](https://docs.netlify.com/)