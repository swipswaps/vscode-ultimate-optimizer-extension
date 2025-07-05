#!/bin/bash
################################################################################
# Development Setup Script for Ultimate VSCode Optimizer Extension
# 
# This script sets up the development environment, installs dependencies,
# runs linting, and prepares the extension for testing.
################################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "================================================================================"
echo "        Ultimate VSCode Optimizer Extension - Development Setup"
echo "                              $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &>/dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &>/dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
if npm install; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo ""

# Run TypeScript compilation
echo "🔨 Compiling TypeScript..."
if npm run compile; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    echo "💡 Check the errors above and fix them before proceeding"
    exit 1
fi
echo ""

# Run ESLint
echo "🔍 Running ESLint..."
if npm run lint; then
    echo "✅ ESLint passed - no issues found"
else
    echo "⚠️  ESLint found issues"
    echo "💡 Run 'npm run lint' to see detailed issues"
    echo "💡 Many issues can be auto-fixed with 'npm run lint -- --fix'"
fi
echo ""

# Check if VSCode is available for testing
if command -v code &>/dev/null; then
    echo "✅ VSCode found - ready for extension testing"
    echo "💡 To test the extension:"
    echo "   1. Open this folder in VSCode: code ."
    echo "   2. Press F5 to launch Extension Development Host"
    echo "   3. Test commands in the new VSCode window"
else
    echo "⚠️  VSCode command not found in PATH"
    echo "💡 You can still develop, but testing will require manual VSCode launch"
fi
echo ""

# Check if vsce is installed for packaging
if command -v vsce &>/dev/null; then
    echo "✅ vsce (VSCode Extension CLI) is available"
    echo "💡 You can package the extension with: vsce package"
else
    echo "ℹ️  vsce not installed - install with: npm install -g vsce"
    echo "💡 vsce is needed for packaging and publishing the extension"
fi
echo ""

# Create .vscode directory with recommended settings
echo "⚙️  Setting up VSCode workspace configuration..."
mkdir -p .vscode

# Create launch.json for debugging
cat > .vscode/launch.json << 'EOF'
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Run Extension",
            "type": "extensionHost",
            "request": "launch",
            "args": [
                "--extensionDevelopmentPath=${workspaceFolder}"
            ],
            "outFiles": [
                "${workspaceFolder}/out/**/*.js"
            ],
            "preLaunchTask": "${workspaceFolder}:npm: compile"
        },
        {
            "name": "Extension Tests",
            "type": "extensionHost",
            "request": "launch",
            "args": [
                "--extensionDevelopmentPath=${workspaceFolder}",
                "--extensionTestsPath=${workspaceFolder}/out/test/suite/index"
            ],
            "outFiles": [
                "${workspaceFolder}/out/test/**/*.js"
            ],
            "preLaunchTask": "${workspaceFolder}:npm: compile"
        }
    ]
}
EOF

# Create tasks.json for build tasks
cat > .vscode/tasks.json << 'EOF'
{
    "version": "2.0.0",
    "tasks": [
        {
            "type": "npm",
            "script": "compile",
            "group": {
                "kind": "build",
                "isDefault": true
            },
            "presentation": {
                "panel": "dedicated",
                "reveal": "never"
            },
            "problemMatcher": [
                "$tsc"
            ]
        },
        {
            "type": "npm",
            "script": "watch",
            "group": "build",
            "presentation": {
                "panel": "dedicated",
                "reveal": "never"
            },
            "isBackground": true,
            "problemMatcher": [
                "$tsc-watch"
            ]
        },
        {
            "type": "npm",
            "script": "lint",
            "group": "test",
            "presentation": {
                "panel": "dedicated",
                "reveal": "always"
            },
            "problemMatcher": [
                "$eslint-stylish"
            ]
        }
    ]
}
EOF

# Create settings.json with recommended settings
cat > .vscode/settings.json << 'EOF'
{
    "typescript.preferences.includePackageJsonAutoImports": "off",
    "typescript.suggest.autoImports": false,
    "typescript.validate.enable": true,
    "eslint.validate": [
        "typescript"
    ],
    "files.exclude": {
        "out": false,
        "node_modules": true,
        "**/*.vsix": true
    },
    "search.exclude": {
        "out": true,
        "node_modules": true,
        "**/*.vsix": true
    }
}
EOF

echo "✅ VSCode workspace configuration created"
echo ""

# Show project structure
echo "📁 Project structure:"
echo "├── src/                     # TypeScript source code"
echo "│   ├── extension.ts         # Main extension entry point"
echo "│   ├── commands/            # Command implementations"
echo "│   └── providers/           # VSCode providers (status bar, webview)"
echo "├── out/                     # Compiled JavaScript (generated)"
echo "├── package.json             # Extension manifest and dependencies"
echo "├── tsconfig.json            # TypeScript configuration"
echo "├── .eslintrc.json           # ESLint configuration"
echo "└── .vscode/                 # VSCode workspace settings"
echo ""

# Show next steps
echo "================================================================================"
echo "                              SETUP COMPLETE!"
echo "================================================================================"
echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📋 Next steps:"
echo "   1. Open in VSCode: code ."
echo "   2. Press F5 to launch Extension Development Host"
echo "   3. Test commands in Command Palette (Ctrl+Shift+P)"
echo "   4. Make changes and press Ctrl+Shift+F5 to reload"
echo ""
echo "🔧 Development commands:"
echo "   npm run compile          # Compile TypeScript"
echo "   npm run watch            # Watch for changes and auto-compile"
echo "   npm run lint             # Run ESLint"
echo "   npm run lint -- --fix    # Auto-fix ESLint issues"
echo ""
echo "📦 Packaging commands:"
echo "   npm install -g vsce      # Install VSCode Extension CLI"
echo "   vsce package             # Create .vsix package"
echo "   vsce publish             # Publish to marketplace"
echo ""
echo "🧪 Testing:"
echo "   - F5 in VSCode launches Extension Development Host"
echo "   - Test all commands through Command Palette"
echo "   - Check status bar for performance indicator"
echo "   - Open dashboard with 'Ultimate Optimizer: Show Performance Dashboard'"
echo ""
echo "📚 Documentation:"
echo "   - README.md contains user documentation"
echo "   - Code is extensively commented for maintainability"
echo "   - ESLint enforces code quality standards"
echo ""
echo "================================================================================"
