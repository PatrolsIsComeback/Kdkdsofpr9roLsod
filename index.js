const { Client, GatewayIntentBits, Collection } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
dotenv.config();

const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Bot çalışıyor!');
});

app.listen(3000, () => {
    console.log('Ping sunucusu çalışıyor!');
});

const ayarlar = require('./ayarlar.json'); // Prefix için ayarları yükleyelim

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();

// Komutları yükleme
const commandFiles = fs.readdirSync(path.join(__dirname, 'komutlar')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./komutlar/${file}`);
    client.commands.set(command.data.name, command);
}

client.once('ready', () => {
    console.log('Bot hazır!');
});

// Mesaj tabanlı komutları dinleme
client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(ayarlar.prefix) || message.author.bot) return;

    const args = message.content.slice(ayarlar.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

   //Hata Var//
    
  const command = client.commands.get(commandName);

    if (!command) return;
    
  //Hata Var//
    
    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('Bir hata oluştu!');
    }
});

client.login(process.env.TOKEN);

//--------------Çekiliş Devam Etme (Yeniden Başladığında)-----------//

const çekilişVeriDosyası = './çekiliş.json';

client.once('ready', async () => {
    const çekilişVerileri = JSON.parse(fs.readFileSync(çekilişVeriDosyası, 'utf-8'));

    for (const çekiliş of çekilişVerileri) {
        const kanal = await client.channels.fetch(çekiliş.channelId);
        const mesaj = await kanal.messages.fetch(çekiliş.messageId);

        const süre = çekiliş.süre - Date.now();
        if (süre > 0) {
            const collector = mesaj.createMessageComponentCollector({
                componentType: 'BUTTON',
                time: süre,
            });

            collector.on('collect', async (interaction) => {
                if (interaction.customId === 'join-giveaway') {
                    if (!çekiliş.katılımcılar.includes(interaction.user.id)) {
                        çekiliş.katılımcılar.push(interaction.user.id);
                        fs.writeFileSync(çekilişVeriDosyası, JSON.stringify(çekilişVerileri, null, 2));

                        await interaction.reply({
                            content: '🎉 Çekilişe başarıyla katıldınız!',
                            ephemeral: true,
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
                if (çekiliş.katılımcılar.length > 0) {
                    const kazananID = çekiliş.katılımcılar[Math.floor(Math.random() * çekiliş.katılımcılar.length)];
                    const kazanan = `<@${kazananID}>`;

                    await mesaj.edit({
                        content: `🎉 **Çekiliş Sona Erdi!**\nÖdül: **${çekiliş.ödül}**\nKazanan: ${kazanan}`,
                        components: [],
                    });
                } else {
                    await mesaj.edit({
                        content: `❌ **Çekiliş Sona Erdi!**\nHiç kimse katılmadı.`,
                        components: [],
                    });
                }

                const index = çekilişVerileri.indexOf(çekiliş);
                if (index > -1) {
                    çekilişVerileri.splice(index, 1);
                    fs.writeFileSync(çekilişVeriDosyası, JSON.stringify(çekilişVerileri, null, 2));
                }
            });
        }
    }

    console.log('Devam eden çekilişler yüklendi!');
});

//--------------Oto Cevap Sistemi--------------//

client.on('messageCreate', async (message) => {
    // Botun kendi mesajlarını ve DM mesajlarını görmezden gel
    if (message.author.bot || !message.guild) return;

    // Oto-cevaplar dosyasını yükle
    const otoCevaplar = JSON.parse(fs.readFileSync('./otoCevaplar.json', 'utf-8'));

    // Mesaj içeriğini oto-cevaplar ile kontrol et
    const cevap = otoCevaplar.find((c) => c.keyword.toLowerCase() === message.content.toLowerCase());

    // Eğer bir eşleşme varsa cevap gönder
    if (cevap) {
        await message.reply(cevap.response).catch((err) => console.error('Mesaj gönderilirken hata oluştu:', err));
    }
});
