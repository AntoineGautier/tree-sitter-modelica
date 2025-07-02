# Prettier Plugin for Modelica

A [Prettier](https://prettier.io/) plugin for formatting Modelica (`.mo`) files. This plugin provides consistent code formatting for Modelica language files without requiring a complex setup.

## Features

- Formats Modelica files with consistent indentation and spacing
- Properly formats parameters, equations, annotations, and other Modelica constructs
- Preserves comments and documentation strings
- Works as a standalone plugin without additional dependencies
- Can be used directly from the command line

## Installation

### Prerequisites

- Node.js (v14 or newer)
- Prettier (v2.0.0 or newer)

### Option 1: Local Installation

1. Install prettier as a development dependency in your project:

```bash
npm install --save-dev prettier
```

2. Copy the `prettier-plugin-modelica.js` file to your project directory.

### Option 2: Global Installation

1. Install prettier globally:

```bash
npm install -g prettier
```

2. Copy the `prettier-plugin-modelica.js` file to a location in your project or a central location.

## Usage

### Command Line

Format a single file:

```bash
prettier --plugin=./prettier-plugin-modelica.js path/to/file.mo
```

Format a file and save the result:

```bash
prettier --plugin=./prettier-plugin-modelica.js path/to/file.mo > path/to/formatted-file.mo
```

Or write directly to the file:

```bash
prettier --plugin=./prettier-plugin-modelica.js --write path/to/file.mo
```

Format all Modelica files in a directory:

```bash
prettier --plugin=./prettier-plugin-modelica.js --write "**/*.mo"
```

### Configuration

You can configure the plugin using a `.prettierrc` file in your project root:

```json
{
  "tabWidth": 2,
  "printWidth": 80
}
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tabWidth` | Integer | 2 | Number of spaces per indentation level |
| `printWidth` | Integer | 80 | The line length where Prettier will try to wrap |

## Formatting Rules

This formatter applies the following rules to Modelica code:

- Consistent indentation for class definitions, parameters, equations, etc.
- Appropriate spacing around operators (`=`, `+`, `-`, etc.)
- Proper formatting of annotations
- Consistent alignment of parameter declarations
- Preservation of comments and documentation
- Handling of HTML content within annotation strings
- Proper spacing after keywords

## Integration with Editors

### VS Code

1. Install the Prettier extension for VS Code
2. Configure VS Code to use the plugin by adding to your settings.json:

```json
{
  "prettier.documentSelectors": ["**/*.mo"],
  "prettier.enableDebugLogs": true,
  "[modelica]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "prettier.pluginSearchDirs": ["./"],
  "prettier.prettierPath": "./node_modules/prettier"
}
```

3. Make sure `prettier-plugin-modelica.js` is in your project directory.

### Other Editors

For other editors that support Prettier, follow their documentation on how to configure custom plugins.

## Troubleshooting

### Common Issues

1. **File not being formatted**: Make sure the file has a `.mo` extension and that you've specified the correct path to the plugin.

2. **Dependency errors**: Ensure you have Prettier installed in your project or globally.

3. **Path issues**: If using a relative path to the plugin, make sure it's relative to your current working directory.

4. **Formatting issues**: The plugin handles most Modelica syntax, but may not perfectly format all edge cases. Please report any specific issues you encounter.

## How It Works

The plugin uses a combination of regular expressions and specialized formatting rules to handle Modelica syntax. While not using a full parser, it applies formatting rules in multiple passes to handle various aspects of the language.

## License

This plugin is released under the MIT License.

## Contributing

Contributions are welcome! If you find issues or have improvements, please feel free to:

1. Open an issue
2. Submit a pull request with improvements
3. Suggest additional formatting rules or options

## Acknowledgments

- Thanks to the Modelica community for their language specification
- Based on the Tree-sitter Modelica grammar