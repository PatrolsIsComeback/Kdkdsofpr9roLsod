const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'ping',
        description: 'Botun gecikme ve performans bilgilerini gösterir.',
    },
    async execute(message) {
        const start = Date.now();

        // Ön yükleme mesajı
        const sentMessage = await message.reply('<a:loading:1081631468533655602> Ping hesaplanıyor...');

        const end = Date.now();

        // Ping durumu belirleme
        const apiPing = message.client.ws.ping;
        let pingStatus = '';
        let pingColor = '';

        if (apiPing < 60) {
            pingStatus = '<:aktif:1271789124604661790>';
            pingColor = 'Green';
        } else if (apiPing >= 60 && apiPing < 150) {
            pingStatus = '<:saributton:1272820557901205514>';
            pingColor = 'Yellow';
        } else {
            pingStatus = '<:yasak:1255468817363107882>';
            pingColor = 'Red';
        }

        // Bot çalışma süresi hesaplama
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        // Embed oluşturma
        const embed = new EmbedBuilder()
            .setColor(pingColor)
            .setTitle('Ping Durumu')
            .setDescription('Botun performansına dair detaylar aşağıda:')
            .addFields(
                { name: '<:website:1331636925924376576> WebSocket Gecikmesi', value: `${pingStatus} - ${apiPing}ms`, inline: false },
                { name: ' <:ca_mesaj:1255807767877521458> Mesaj Gecikmesi', value: `${end - start}ms`, inline: false },
                { name: '<:zamandilimi:1331635880552824842> Bot Çalışma Süresi', value: `${days} gün, ${hours} saat, ${minutes} dakika, ${seconds} saniye`, inline: false }
            )
            .setFooter({ text: `Komutu isteyen: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        // Sonucu gönder
        await sentMessage.edit({
            content: '<:check:1081631498924904479> Ping bilgileri başarıyla alındı!',
            embeds: [embed],
        });
    },
};
