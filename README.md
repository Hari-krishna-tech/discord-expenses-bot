


# Discord Expense Tracker Bot

A simple Discord bot built with TypeScript, discord.js, and the Google Sheets API to track personal expenses. Log expenses via slash commands, and the bot automatically saves them to a Google Sheet, creating a new tab for each month.

## Features

*   Log expenses using the `/expense` slash command.
*   Specify expense description and amount.
*   Automatically creates a new sheet (tab) in your Google Spreadsheet for each month (e.g., `2025-04`).
*   Stores timestamp, description, and amount for each expense.
*   Generate monthly expense summary reports using the `/report` command.
*   Uses Google Sheets as a free and accessible database.
*   Built with TypeScript for better code structure and safety.

## Prerequisites

Before you begin, ensure you have the following:

1.  **Node.js:** Version 16.9.0 or higher recommended. ([Download](https://nodejs.org/))
2.  **npm:** Usually comes with Node.js.
3.  **Discord Account:** Required to create a bot and invite it to a server.
4.  **Discord Server:** A server where you have permission to add bots.
5.  **Google Account:** Required for Google Cloud Platform and Google Sheets.

## Setup Instructions

Follow these steps to get the bot running:

**1. Clone the Repository**

```bash
git clone https://github.com/hari-krishna/tech/discord-expenses-bot.git
cd discord-expenses-bot
```

**2. Install Dependencies**

```bash
npm install
```

**3. Discord Bot Setup**

*   Go to the [Discord Developer Portal](https://discord.com/developers/applications).
*   Click **New Application** and give it a name (e.g., "My Expense Bot").
*   Navigate to the **Bot** tab on the left sidebar.
*   Click **Add Bot**, then **Yes, do it!**.
*   Under the bot's username, click **Reset Token** (or View Token) and **copy the Bot Token**. Keep this safe!
*   Navigate to **OAuth2** -> **General** on the left sidebar. Copy the **Client ID**.
*   Navigate to **OAuth2** -> **URL Generator**.
    *   Select scopes: `bot` and `applications.commands`.
    *   Under "Bot Permissions," select at least `Send Messages` and `Embed Links`.
*   Copy the **Generated URL** at the bottom, paste it into your browser, and invite the bot to your desired Discord server.
*   **Get Server ID:**
    *   In your Discord client, go to User Settings -> Advanced -> Enable **Developer Mode**.
    *   Right-click on your server icon on the left sidebar and select **Copy Server ID**.

**4. Google Cloud & Sheets Setup**

*   Go to the [Google Cloud Console](https://console.cloud.google.com/).
*   Create a **New Project** or select an existing one.
*   Navigate to **APIs & Services** -> **Library**.
*   Search for and **Enable** the **Google Sheets API**.
*   Navigate to **APIs & Services** -> **Credentials**.
*   Click **+ CREATE CREDENTIALS** -> **Service account**.
    *   Fill in a service account name (e.g., "discord-sheets-bot").
    *   Click **CREATE AND CONTINUE**.
    *   Skip granting roles (click **CONTINUE**).
    *   Skip granting user access (click **DONE**).
*   Find the newly created service account in the list and click on its email address.
*   Go to the **KEYS** tab.
*   Click **ADD KEY** -> **Create new key**.
*   Select **JSON** as the key type and click **CREATE**. A JSON file will be downloaded – **save this file securely**.
*   **Create Google Sheet:**
    *   Go to [Google Sheets](https://sheets.google.com/) and create a new blank spreadsheet (e.g., name it "Expenses").
    *   Look at the URL in your browser's address bar: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`. Copy the `SPREADSHEET_ID` part.
*   **Share the Sheet:**
    *   Open the downloaded JSON key file in a text editor. Find the `"client_email"` value (it looks like an email address). Copy it.
    *   Go back to your Google Sheet, click the **Share** button (top right).
    *   Paste the service account's `client_email` into the "Add people and groups" field.
    *   Ensure the permission level is set to **Editor**.
    *   Click **Share** (or Send/Save).

**5. Configure Environment Variables**

*   In the project's root directory, create a file named `.env`.
*   Copy the contents of `.env.example` (if it exists) or add the following lines:

```dotenv
# Discord Bot Credentials
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
CLIENT_ID=YOUR_DISCORD_APPLICATION_CLIENT_ID_HERE
GUILD_ID=YOUR_DISCORD_SERVER_ID_HERE # Used for instant command registration during development

# Google Sheets Credentials
SPREADSHEET_ID=YOUR_GOOGLE_SHEET_ID_HERE

# Paste the *entire* content of the downloaded service account JSON file below.
# IMPORTANT: It MUST all be on ONE single line. Remove any line breaks from the pasted JSON.
GOOGLE_CREDENTIALS={"type": "service_account", "project_id": "...", ...}
```

*   Replace the placeholder values (`YOUR_..._HERE`) with the actual credentials you obtained in the previous steps.
*   **Crucially, ensure the entire JSON content for `GOOGLE_CREDENTIALS` is pasted onto a single line.**
*   **Security:** Add `.env` to your `.gitignore` file to prevent accidentally committing your secrets.

## Running the Bot

**Development Mode:**

This uses `ts-node-dev` to automatically restart the bot when you make code changes.

```bash
npm run dev
```

**Production Mode (Example):**

First, compile the TypeScript code to JavaScript:

```bash
npm run build
```

Then, run the compiled code using Node.js:

```bash
node dist/index.js
```

*(You might need to add the `build` script (`"build": "tsc"`) to your `package.json` if it's not already there.)*

## Usage

Once the bot is running and invited to your server:

*   **Log an expense:**
    `/expense description:<What you bought> amount:<Cost>`
    *Example:* `/expense description:Coffee amount:4.50`

*   **Get a monthly report:**
    `/report [month:YYYY-MM]`
    *Example (current month):* `/report`
    *Example (specific month):* `/report month:2025-03`

The bot will confirm logged expenses and provide reports directly in the Discord channel where the command was used. Your expense data will appear in the corresponding monthly tab in your Google Sheet.

**Key Improvements:**

*   **Clear Structure:** Uses standard README headings (Features, Prerequisites, Setup, Running, Usage).
*   **Numbered Steps:** Makes the setup process easier to follow.
*   **Code Blocks:** Properly formats commands and file contents.
*   **Emphasis:** Uses bolding for important items like **Bot Token**, **Client ID**, **Editor** permissions, and the **single-line JSON** requirement.
*   **Clarity:** Explicitly mentions Node.js/npm prerequisites and explains *why* each ID/token is needed.
*   **Security Note:** Reminds the user to add `.env` to `.gitignore`.
*   **Usage Examples:** Provides clear examples of how to use the slash commands.
*   **Production Hint:** Adds a basic example for running in production.