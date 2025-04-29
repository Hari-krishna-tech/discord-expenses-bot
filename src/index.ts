import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";
// This import is correct
import { google } from "googleapis";

// Load env vars
const {
  DISCORD_TOKEN,
  CLIENT_ID = "",
  GUILD_ID = "",
  SPREADSHEET_ID,
  GOOGLE_CREDENTIALS,
} = process.env;
if (
  !DISCORD_TOKEN ||
  !CLIENT_ID ||
  !GUILD_ID ||
  !SPREADSHEET_ID ||
  !GOOGLE_CREDENTIALS
) {
  throw new Error("Missing one or more environment variables");
}

// Google Sheets setup - Uses the imported 'google' object correctly
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(GOOGLE_CREDENTIALS),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

/** Ensure a monthly sheet exists; if not, create it with headers */
async function getOrCreateSheet(title: string) {
  const ss = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existing = ss.data.sheets?.find((s) => s.properties?.title === title);
  if (existing) return;

  // Create sheet
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{ addSheet: { properties: { title } } }],
    },
  });
  // Add header row
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${title}!A1:C1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [["Timestamp", "Description", "Amount"]],
    },
  });
}

/** Append an expense row to a given sheet */
async function appendExpense(sheet: string, row: [string, string, number]) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheet}!A:C`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}

/** Fetch all amounts from a sheet and sum them */
async function getMonthlyTotal(sheet: string): Promise<number> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheet}!C2:C`, // Start from C2 to skip header
  });
  const vals = res.data.values ?? [];
  // Ensure robustness against empty cells or non-numeric values in the column
  return vals.reduce((sum, r) => {
    const amount = parseFloat(r[0] || "0");
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
}

// Register slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("expense")
    .setDescription("Log a new expense")
    .addStringOption((o) =>
      o
        .setName("description")
        .setDescription("What did you buy?")
        .setRequired(true)
    )
    .addNumberOption(
      (o) =>
        o
          .setName("amount")
          .setDescription("How much? (e.g., 10.50)")
          .setRequired(true)
          .setMinValue(0.01) // Optional: Add a minimum value
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName("report")
    .setDescription("Get your monthly expense total")
    .addStringOption(
      (o) =>
        o
          .setName("month")
          .setDescription("Month to report (YYYY-MM), defaults to current")
          .setRequired(false)
      // Optional: Add validation for YYYY-MM format if desired
    )
    .toJSON(),
];
const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

// Register commands function
async function registerCommands() {
  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(
      // Use applicationGuildCommands for testing, switch to applicationCommands for global
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error("Failed to register commands:", error);
  }
}

// Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async (c) => {
  console.log(`Logged in as ${c.user?.tag}`);
  // Register commands once the client is ready
  await registerCommands();
});

client.on("interactionCreate", async (interaction) => {
  // Ensure the interaction is a chat input command
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0"); // JavaScript months are 0-indexed
  const currentSheetName = `${yyyy}-${mm}`;

  try {
    if (commandName === "expense") {
      const description = interaction.options.getString("description", true);
      const amount = interaction.options.getNumber("amount", true);

      // Defer reply if sheet creation might take time
      // await interaction.deferReply({ ephemeral: true }); // Use ephemeral for logging confirmation

      await getOrCreateSheet(currentSheetName);
      await appendExpense(currentSheetName, [
        now.toISOString(),
        description,
        amount,
      ]);

      // Use followUp if deferred, otherwise reply
      await interaction.reply(
        `✅ Logged expense **${description}** for **Rs${amount.toFixed(
          2
        )}** in sheet \`${currentSheetName}\`.`
      );
    } else if (commandName === "report") {
      const monthOption = interaction.options.getString("month"); // Can be null
      const targetSheetName = monthOption || currentSheetName;

      // Validate YYYY-MM format if provided
      if (monthOption && !/^\d{4}-\d{2}$/.test(monthOption)) {
        await interaction.reply({
          content: "❌ Invalid month format. Please use YYYY-MM.",
          ephemeral: true,
        });
        return;
      }

      // await interaction.deferReply(); // Defer if fetching might take time

      // Check if sheet exists before trying to get data
      const ss = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
        fields: "sheets.properties.title", // Only fetch sheet titles for efficiency
      });
      const sheetExists = ss.data.sheets?.some(
        (s) => s.properties?.title === targetSheetName
      );

      if (!sheetExists) {
        await interaction.reply(
          `🤔 No expense data found for month \`${targetSheetName}\`.`
        );
        return;
      }

      const total = await getMonthlyTotal(targetSheetName);
      const embed = new EmbedBuilder()
        .setTitle(`Expense Report for ${targetSheetName}`)
        .setDescription(`Total spent: **Rs${total.toFixed(2)}**`)
        .setColor("Green") // Or 'Blue', 'Random', etc.
        .setTimestamp()
        .setFooter({ text: "Expense Tracker Bot" }); // Optional footer

      await interaction.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.error(`Error handling command ${commandName}:`, error);
    // Try to reply or follow up with an error message
    const errorMessage = "❌ An error occurred while processing your command.";
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error("Failed to send error reply:", replyError);
    }
  }
});

// Login to Discord
client.login(DISCORD_TOKEN);
