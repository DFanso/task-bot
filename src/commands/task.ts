import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChatInputCommandInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuBuilder, MessageFlags } from 'discord.js';
import Task from '../models/task';

export default {
    data: new SlashCommandBuilder()
        .setName('task')
        .setDescription('Manage your tasks')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new task via a modal')
                .addStringOption(option =>
                    option.setName('priority')
                        .setDescription('Priority of the task')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Low', value: 'Low' },
                            { name: 'Medium', value: 'Medium' },
                            { name: 'High', value: 'High' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View tasks for today')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('complete')
                .setDescription('Complete a task')
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: 'You are not authorized to use this bot.', flags: MessageFlags.Ephemeral });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            const priority = interaction.options.getString('priority') || 'Medium';

            const modal = new ModalBuilder()
                .setCustomId(`addTaskModal:${priority}`)
                .setTitle(`Add New Task (${priority} Priority)`);

            const descriptionInput = new TextInputBuilder()
                .setCustomId('taskDescription')
                .setLabel('Task Description')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);

            modal.addComponents(firstActionRow);

            await interaction.showModal(modal);
        } else if (subcommand === 'view') {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            const tasks = await Task.find({
                userId: interaction.user.id,
                date: { $gte: startOfDay, $lte: endOfDay },
            }).sort({ priority: -1 }); // Note: This sort might need adjustment as 'High' > 'Low' alphabetically, but we want logical sort. 
            // Actually 'High' < 'Low' < 'Medium' alphabetically. 
            // Let's sort manually in JS for better precision if needed, or rely on enum order if we change schema.
            // For now, let's sort in memory to be safe.

            const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
            tasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => t.completed).length;
            const pendingTasks = tasks.filter(t => !t.completed);

            if (totalTasks === 0) {
                return interaction.reply({ content: 'No tasks found for today! 🎉', flags: MessageFlags.Ephemeral });
            }

            // Calculate Progress
            const progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks);
            const progressBarLength = 10;
            const filledLength = Math.round(progress * progressBarLength);
            const emptyLength = progressBarLength - filledLength;
            const progressBar = '▓'.repeat(filledLength) + '░'.repeat(emptyLength);
            const percentage = Math.round(progress * 100);

            // Determine Color based on highest priority pending task
            const highestPriority = pendingTasks.length > 0 ? pendingTasks[0].priority : 'Low';
            const colorMap = { 'High': 0xFF0000, 'Medium': 0xFFA500, 'Low': 0x00FF00 }; // Red, Orange, Green
            const embedColor = pendingTasks.length === 0 ? 0x00FF00 : colorMap[highestPriority];

            const embed = new EmbedBuilder()
                .setTitle(`📅 Tasks for ${startOfDay.toLocaleDateString()}`)
                .setDescription(`**Progress**: ${progressBar} ${percentage}%`)
                .setColor(embedColor)
                .setFooter({ text: `${completedTasks}/${totalTasks} completed` });

            if (pendingTasks.length > 0) {
                const taskList = pendingTasks.map((task, index) => {
                    const priorityEmoji = task.priority === 'High' ? '🔴' : task.priority === 'Medium' ? '🟡' : '🟢';
                    return `**${index + 1}.** ${priorityEmoji} **${task.priority}**\n${task.description}`;
                }).join('\n\n');
                embed.addFields({ name: '📝 Pending Tasks', value: taskList });
            } else {
                embed.addFields({ name: '✅ All Done!', value: 'Great job! You have completed all your tasks for today.' });
            }

            // Action Row with "Complete Task" button
            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('triggerCompleteTask')
                        .setLabel('Complete a Task')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(pendingTasks.length === 0)
                );

            await interaction.reply({ embeds: [embed], components: [row] });
        } else if (subcommand === 'complete') {
            // Fetch pending tasks to show in a select menu
            const tasks = await Task.find({
                userId: interaction.user.id,
                completed: false
            });

            if (tasks.length === 0) {
                return interaction.reply({ content: 'No pending tasks to complete!', flags: MessageFlags.Ephemeral });
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('completeTaskSelect')
                .setPlaceholder('Select a task to complete')
                .addOptions(
                    tasks.map(task => ({
                        label: task.description.substring(0, 100), // Limit length
                        description: `Priority: ${task.priority}`,
                        value: task._id.toString()
                    }))
                );

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

            await interaction.reply({ content: 'Select a task to mark as complete:', components: [row], flags: MessageFlags.Ephemeral });
        }
    },
};
