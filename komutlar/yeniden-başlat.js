const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ownerID } = require('../ayarlar.json'); // ownerID'yi ayarlar.json'dan çekiyoruz.

module.exports = {
    data: {
        name: 'yeniden-başlat',
        description: 'Botu yeniden başlatır (sadece yetkili kullanabilir).',
    },
    async execute(message) {
        if (message.author.id !== ownerID) {
            return message.reply('Bu komutu kullanma yetkiniz yok! Uza Burdan Lağn');
        }

        // Buton oluşturma
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('restart-confirm')
                .setLabel('Botu Yeniden Başlat')
                .setStyle(ButtonStyle.Danger)
        );

        // Kullanıcıya onay mesajı gönder
        const sentMessage = await message.reply({
            content: '<:uyari:1331642721567510610> Botu yeniden başlatmak istediğinize emin misiniz?',
            components: [row],
        });

        // Etkileşimleri dinleyen collector
        const filter = (interaction) =>
            interaction.isButton() && interaction.customId === 'restart-confirm';

        const collector = sentMessage.createMessageComponentCollector({
            filter,
            time: 30000, // 30 saniye
        });

        collector.on('collect', async (interaction) => {
            // Kullanıcı doğrulaması
            if (interaction.user.id !== ownerID) {
                return interaction.reply({
                    content: '⛔ Bu butonu yalnızca komutu kullanan kişi kullanabilir.',
                    ephemeral: true, // Sadece butona basan kişi görebilir.
                });
            }

            // Buton tıklanırsa, mesajı güncelle ve botu yeniden başlat
            await interaction.update({
                content: '<a:aktif:1257083439950204939> Bot yeniden başlatılıyor...',
                components: [],
            });

            console.log('Bot yeniden başlatılıyor...');
            process.exit(); // Botu yeniden başlat
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                // Süre dolduysa, mesajı güncelle ve butonları kaldır
                await sentMessage.edit({
                    content: '⏳ Süre doldu, bot yeniden başlatma işlemi iptal edildi.',
                    components: [],
                });
            }
        });
    },
};
