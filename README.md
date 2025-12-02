# Task Bot

![Bun](https://img.shields.io/badge/Bun-v1.1-black)
![Discord.js](https://img.shields.io/badge/discord.js-v14-blue)
![TypeScript](https://img.shields.io/badge/typescript-v5-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A powerful and privacy-focused Discord Task Management Bot built with TypeScript, Discord.js, and Bun.

## Features

-   **📝 Task Management**: Add, view, and complete tasks directly from Discord.
-   **🔥 Priority Support**: Assign priorities (High, Medium, Low) to your tasks.
-   **📊 Visual Progress**: View your daily progress with a visual progress bar.
-   **🎨 Dynamic UI**: Embed colors change based on the highest priority task.
-   **⚡ Quick Actions**: Complete tasks instantly with interactive buttons.
-   **🔒 Privacy Focused**: Each user has their own private task list.
-   **👻 Ephemeral Responses**: Task views are private and only visible to you.

## Table of Contents

-   [Installation](#installation)
-   [Configuration](#configuration)
-   [Usage](#usage)
-   [Commands](#commands)
-   [Project Structure](#project-structure)
-   [License](#license)

## Installation

1.  Clone the repository:
    ```sh
    git clone https://github.com/DFanso/task-bot.git
    cd task-bot
    ```

2.  Install the dependencies:
    ```sh
    bun install
    ```

## Configuration

Rename `.env.example` file to `.env` and add your configuration:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority
TOKEN=YOUR_BOT_TOKEN
CLIENT_ID=YOUR_CLIENT_ID
OWNER_ID=YOUR_DISCORD_ID
NODE_ENV=development
```

## Usage

{{ ... }}

```sh
bun run deploy
```

## Commands

### `/task add`
Adds a new task.
-   **Options**: `priority` (Optional) - Select High, Medium, or Low.
-   **Interaction**: Opens a Modal to enter the task description.

### `/task view`
Views your tasks for the current day.
-   **Output**: An ephemeral embed showing your tasks sorted by priority, with a progress bar and a "Complete a Task" button.

### `/task complete`
Completes a task.
-   **Interaction**: Shows a dropdown menu to select a task to mark as done.

## Project Structure

```
task-bot/
├── src/
│   ├── commands/       # Slash command definitions
│   │   └── task.ts
│   ├── events/         # Event handlers (interactionCreate, ready)
│   ├── models/         # Mongoose models (Task, User)
│   ├── services/       # Business logic services
│   ├── utils/          # Utility functions (database, deploy)
│   └── index.ts        # Bot entry point
├── package.json
├── tsconfig.json
└── nodemon.json
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
