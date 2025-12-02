import { Events, Interaction, Collection, MessageFlags } from 'discord.js';
import fs from 'fs';
import path from 'path';
import Task from '../models/task';

// Load commands dynamically
const commands = new Collection<string, any>();
const commandsPath = path.join(__dirname, '../commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

// Top-level await to ensure commands are loaded before the bot handles interactions
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const module = await import(filePath);
  const command = module.default;
  if ('data' in command && 'execute' in command) {
    commands.set(command.data.name, command);
  } else {
    console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    // Handle Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: 'There was an error executing this command!', flags: MessageFlags.Ephemeral });
        } else {
          await interaction.reply({ content: 'There was an error executing this command!', flags: MessageFlags.Ephemeral });
        }
      }
      return;
    }

    // Handle Modal Submissions
    if (interaction.isModalSubmit() && interaction.customId.startsWith('addTaskModal')) {
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: 'Unauthorized', flags: MessageFlags.Ephemeral });
      }

      const description = interaction.fields.getTextInputValue('taskDescription');

      // Extract priority from customId
      const parts = interaction.customId.split(':');
      const priority = parts.length > 1 ? parts[1] : 'Medium';

      try {
        const newTask = new Task({
          userId: interaction.user.id,
          description,
          priority,
        });
        await newTask.save();
        await interaction.reply({ content: `Task added: **${description}** (${priority})`, flags: MessageFlags.Ephemeral });
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Failed to add task.', flags: MessageFlags.Ephemeral });
      }
    }

    // Handle Select Menus
    else if (interaction.isStringSelectMenu() && interaction.customId === 'completeTaskSelect') {
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: 'Unauthorized', flags: MessageFlags.Ephemeral });
      }

      const taskId = interaction.values[0];
      try {
        await Task.findByIdAndUpdate(taskId, { completed: true });
        await interaction.update({ content: 'Task marked as complete! 🎉', components: [] });
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Failed to complete task.', flags: MessageFlags.Ephemeral });
      }
    }

    // Handle Buttons
    else if (interaction.isButton() && interaction.customId === 'triggerCompleteTask') {
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: 'Unauthorized', flags: MessageFlags.Ephemeral });
      }

      // Reuse the logic from the /task complete command
      // Ideally this should be refactored into a shared function, but for now we duplicate for speed/safety
      const tasks = await Task.find({
        userId: interaction.user.id,
        completed: false
      });

      if (tasks.length === 0) {
        return interaction.reply({ content: 'No pending tasks to complete!', flags: MessageFlags.Ephemeral });
      }

      const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js'); // Import locally if needed or ensure top-level import

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('completeTaskSelect')
        .setPlaceholder('Select a task to complete')
        .addOptions(
          tasks.map(task => ({
            label: task.description.substring(0, 100),
            description: `Priority: ${task.priority}`,
            value: task._id.toString()
          }))
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.reply({ content: 'Select a task to mark as complete:', components: [row], flags: MessageFlags.Ephemeral });
    }
  },
};
