const fs = require('fs');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const çekilişVeriDosyası = './çekiliş.json';

module.exports = {
    data: {
        name: 'çekiliş',
        description: 'Butonlu çekiliş başlatır.',
    },
    async execute(message) {
        const args = message.content.split(' ').slice(1);
        const ödül = args.join(' ') || 'Belirtilmemiş Ödül';
        const süre = 30 * 1000; // 30 saniye (örnek)

        // Çekiliş butonları
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('join-giveaway') // Butonun ID'si
                .setLabel('🎉 Çekilişe Katıl')
                .setStyle(ButtonStyle.Primary)
        );

        // Çekiliş mesajı
        const giveawayMessage = await message.channel.send({
            content: `🎉 **Çekiliş Başladı!**\nÖdül: **${ödül}**\nSüre: **30 saniye**\nButona basarak çekilişe katılabilirsiniz!`,
            components: [row],
        });

        // Çekiliş bilgilerini JSON dosyasına kaydet
        const çekilişVerileri = JSON.parse(fs.readFileSync(çekilişVeriDosyası, 'utf-8'));
        çekilişVerileri.push({
            messageId: giveawayMessage.id,
            channelId: message.channel.id,
            ödül,
            süre: Date.now() + süre,
            katılımcılar: [],
        });
        fs.writeFileSync(çekilişVeriDosyası, JSON.stringify(çekilişVerileri, null, 2));

        // Etkileşim toplayıcı
        const collector = giveawayMessage.createMessageComponentCollector({
            componentType: 'BUTTON',
            time: süre,
        });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'join-giveaway') {
                const kullanıcıId = interaction.user.id;
                const çekiliş = çekilişVerileri.find((c) => c.messageId === giveawayMessage.id);

                if (!çekiliş.katılımcılar.includes(kullanıcıId)) {
                    çekiliş.katılımcılar.push(kullanıcıId);
                    fs.writeFileSync(çekilişVeriDosyası, JSON.stringify(çekilişVerileri, null, 2));

                    // Etkileşim yanıtı
                    await interaction.reply({
                        content: '🎉 Çekilişe başarıyla katıldınız!',
                        ephemeral: true, // Sadece kullanıcı görür
                    });
                } else {
                    await interaction.reply({
                        content: '❗ Zaten çekilişe katıldınız.',
                        ephemeral: true,
                    });
                }
            }
        });

        collector.on('end', async () => {
            const çekiliş = çekilişVerileri.find((c) => c.messageId === giveawayMessage.id);
            if (!çekiliş) return;

            if (çekiliş.katılımcılar.length > 0) {
                const kazananID = çekiliş.katılımcılar[Math.floor(Math.random() * çekiliş.katılımcılar.length)];
                const kazanan = `<@${kazananID}>`;

                await giveawayMessage.edit({
                    content: `🎉 **Çekiliş Sona Erdi!**\nÖdül: **${çekiliş.ödül}**\nKazanan: ${kazanan}`,
                    components: [],
                });
                message.channel.send(`🎊 Tebrikler ${kazanan}! Ödülü kazandınız!`);
            } else {
                await giveawayMessage.edit({
                    content: `❌ **Çekiliş Sona Erdi!**\nHiç kimse katılmadı.`,
                    components: [],
                });
            }

            // Çekilişi tamamlananlar listesinden kaldır
            const index = çekilişVerileri.indexOf(çekiliş);
            if (index > -1) {
                çekilişVerileri.splice(index, 1);
                fs.writeFileSync(çekilişVeriDosyası, JSON.stringify(çekilişVerileri, null, 2));
            }
        });
    },
};
