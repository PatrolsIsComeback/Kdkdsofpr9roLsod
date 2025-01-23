const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'avatar',
        description: 'Kullanıcının avatarını gösterir.',
    },
    async execute(message) {
        const user = message.mentions.users.first() || message.author;

        // Avatar URL'si
        const avatarURL = user.displayAvatarURL({ dynamic: true, format: 'png' });

        // Boyut seçenekleri
        const sizes = [32, 64, 128, 256, 512, 1024, 2048, 4096];

        // Select menu oluşturma
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select-avatar-size')
            .setPlaceholder('Avatar boyutunu seçin')
            .addOptions(
                sizes.map(size => ({
                    label: `${size}px`,
                    value: `${size}`,
                    description: `Avatarı ${size}px boyutunda görüntüle.`,
                }))
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // Başlangıç embed'i
        const embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle(`${user.username}'in Avatarı`)
            .setDescription('Avatarı farklı boyutlarda görüntülemek için menüyü kullanabilirsiniz.')
            .setImage(avatarURL)
            .setFooter({ text: `İsteyen: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        // Mesajı gönder
        const sentMessage = await message.reply({
            embeds: [embed],
            components: [row],
        });

        // Menü seçimi dinleme
        const collector = sentMessage.createMessageComponentCollector({
            filter: interaction => interaction.isStringSelectMenu() && interaction.customId === 'select-avatar-size',
            time: 60000, // 1 dakika
        });

        collector.on('collect', async interaction => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ content: 'Bu menüyü yalnızca komutu kullanan kişi kontrol edebilir.', ephemeral: true });
            }

            const selectedSize = interaction.values[0]; // Seçilen boyut
            const updatedAvatarURL = user.displayAvatarURL({ dynamic: true, format: 'png', size: Number(selectedSize) });

            const updatedEmbed = new EmbedBuilder()
                .setColor('Random')
                .setTitle(`${user.username}'in Avatarı (${selectedSize}px)`)
                .setImage(updatedAvatarURL)
                .setFooter({ text: `İsteyen: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            await interaction.update({
                embeds: [updatedEmbed],
                components: [row],
            });
        });

        collector.on('end', () => {
            sentMessage.edit({ components: [] }).catch(() => {}); // Menü süresi dolduysa menüyü kaldır
        });
    },
};
