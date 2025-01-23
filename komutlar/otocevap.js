const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: {
        name: 'otocevap',
        description: 'Oto-cevap sistemi (cevap ekle, sil, listele).',
    },
    async execute(message) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('add-response')
                .setLabel('➕ Cevap Ekle')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('list-responses')
                .setLabel('📜 Cevapları Listele')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('remove-response')
                .setLabel('❌ Cevap Sil')
                .setStyle(ButtonStyle.Danger)
        );

        await message.channel.send({
            content: 'Oto-cevap sistemi için bir işlem seçin:',
            components: [row],
        });
    },
    async interactionHandler(interaction) {
        const otoCevaplar = JSON.parse(fs.readFileSync('./otoCevaplar.json', 'utf-8'));

        if (interaction.customId === 'add-response') {
            const modal = new ModalBuilder()
                .setCustomId('add-response-modal')
                .setTitle('Cevap Ekle');

            const keywordInput = new TextInputBuilder()
                .setCustomId('keyword')
                .setLabel('Anahtar Kelime')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Hangi kelimeye cevap verilecek?')
                .setRequired(true);

            const responseInput = new TextInputBuilder()
                .setCustomId('response')
                .setLabel('Cevap Mesajı')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Cevap ne olacak?')
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(keywordInput),
                new ActionRowBuilder().addComponents(responseInput)
            );

            await interaction.showModal(modal);
        } else if (interaction.customId === 'list-responses') {
            if (otoCevaplar.length === 0) {
                return interaction.reply({
                    content: '📜 Henüz eklenmiş bir oto-cevap yok.',
                    ephemeral: true,
                });
            }

            const cevapListesi = otoCevaplar
                .map((cevap, index) => `\`${index + 1}.\` **${cevap.keyword}**: ${cevap.response}`)
                .join('\n');

            await interaction.reply({
                content: `📜 Oto-Cevap Listesi:\n${cevapListesi}`,
                ephemeral: true,
            });
        } else if (interaction.customId === 'remove-response') {
            if (otoCevaplar.length === 0) {
                return interaction.reply({
                    content: '❌ Silinecek bir oto-cevap bulunamadı.',
                    ephemeral: true,
                });
            }

            const row = new ActionRowBuilder().addComponents(
                otoCevaplar.map((cevap, index) =>
                    new ButtonBuilder()
                        .setCustomId(`delete-${index}`)
                        .setLabel(`🗑️ ${cevap.keyword}`)
                        .setStyle(ButtonStyle.Danger)
                )
            );

            await interaction.reply({
                content: 'Silmek istediğiniz cevabı seçin:',
                components: [row],
                ephemeral: true,
            });
        } else if (interaction.customId.startsWith('delete-')) {
            const index = parseInt(interaction.customId.split('-')[1], 10);
            if (otoCevaplar[index]) {
                const silinen = otoCevaplar.splice(index, 1);
                fs.writeFileSync('./otoCevaplar.json', JSON.stringify(otoCevaplar, null, 2));

                await interaction.reply({
                    content: `🗑️ Başarıyla silindi: **${silinen[0].keyword}**`,
                    ephemeral: true,
                });
            }
        }
    },
    async modalHandler(interaction) {
        if (interaction.customId === 'add-response-modal') {
            const keyword = interaction.fields.getTextInputValue('keyword');
            const response = interaction.fields.getTextInputValue('response');

            const otoCevaplar = JSON.parse(fs.readFileSync('./otoCevaplar.json', 'utf-8'));
            otoCevaplar.push({ keyword, response });
            fs.writeFileSync('./otoCevaplar.json', JSON.stringify(otoCevaplar, null, 2));

            await interaction.reply({
                content: `✅ Yeni oto-cevap eklendi:\n**Kelime:** ${keyword}\n**Cevap:** ${response}`,
                ephemeral: true,
            });
        }
    },
};
