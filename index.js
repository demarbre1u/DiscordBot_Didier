const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')
require('dotenv').config()

// Config Discord
const Discord = require('discord.js')
const client = new Discord.Client()
const token = process.env.DISCORD_TOKEN

// Config Speech-To-Text IBM
const apiKey = process.env.SPEECH_TO_TEXT_APIKEY
const apiURL = process.env.SPEECH_TO_TEXT_URL

// Lorsqu'on est connecté
client.on('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag} !`)

    // On se connecte au channel vocal 'Général'
    let generalChannel = client.channels.get('581458026246963204')
    generalChannel.join().then(connection => {
        console.log('Connecté au channel vocal "Général".')

        // On joue un super son de klaxon pour notifier l'arrivé du bot
        connection.playFile('./sfx/honk.mp3')
        
        // On crée un receiver pour récupérer les données vocals
        const receiver = connection.createReceiver()

        // Lorsqu'un utlisateur dans le channel parle
        connection.on('speaking', (user, speaking) => {
            if (speaking) {
                console.log(`J'écoute ${user}...`)

                // On récupère le flux de sa voix
                const audioStream = receiver.createPCMStream(user);

                // On pipe le flux de sa voix pour le convertir en wav, plus facile à exploiter
                const wavName = `./recordings/${generalChannel.id}-${user.id}-${Date.now()}.wav`;
                ffmpeg({source: audioStream})
                    .inputFormat('s32le')
                    .audioFrequency(16000)
                    .audioChannels(1)
                    .audioCodec('pcm_s16le')
                    .toFormat('wav')
                    .on('end', () => {
                        console.log('Done')

                        // Une fois qu'on a finit la conversion, on envoie le tout à IBM 
                        // ...
                        // ...
                    })
                    .pipe(fs.createWriteStream(wavName))
            }
            else 
            {
                console.log(`Je n'écoute plus ${user}.`);
            }
        })
        
    })
});

// On se connecte au serveur Discord
client.login(token)