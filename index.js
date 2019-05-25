const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')
require('dotenv').config()

// Config Discord
const Discord = require('discord.js')
const client = new Discord.Client()
const token = process.env.DISCORD_TOKEN

// Config Speech-To-Text IBM
const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1')
const apiKey = process.env.SPEECH_TO_TEXT_APIKEY
const apiURL = process.env.SPEECH_TO_TEXT_URL
const speechToText = new SpeechToTextV1({
    iam_apikey: apiKey,
    url: apiURL
});
var params = {
    objectMode: true,
    content_type: 'audio/wav',
    model: 'fr-FR_BroadbandModel',
    max_alternatives: 3
};

// Module chargé d'identifier les commandes vocales
const VC = require('./helpers/voice-commands')

function sendToWatson(wavName, connection)
{
    // Une fois qu'on a finit de parler, on envoie le tout à IBM 
    var recognizeStream = speechToText.recognizeUsingWebSocket(params)
    fs.createReadStream(wavName).pipe(recognizeStream)

    // Lorsqu'on reçoit la réponse, on peut traiter la commande vocale
    recognizeStream.on('data', data => {
    
        let results = data.results

        // S'il y a potentiellement une commande à traiter
        if(results.length > 0)
        {
            switch(VC.recognizeVoiceCommands(results[0].alternatives))
            {
                default: 
                case 0:
                    console.log('Aucune commande reconnue.')
                    break
                case 1:   
                    connection.playFile('./sfx/allo.mp3')
                    break                   
            }
        }
    })

    recognizeStream.on('error', err => console.log('Commande vocale trop courte pour être interprêtée.'))
    
    // Lorsque la connexion est fermée, on supprime le fichier wav puisqu'il ne sert plus
    recognizeStream.on('close', done => {
        fs.unlinkSync(wavName)
    })
}

// Lorsqu'on est connecté
client.on('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag} !`)

    // On se connecte au channel vocal 'Général'
    let generalChannel = client.channels.get('581458026246963204')
    generalChannel.join().then(connection => {
        console.log('Connecté au channel vocal "Général".')
        
        connection.playFile('./sfx/allo.mp3')                        

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
                    .audioCodec('pcm_s16le')
                    .toFormat('wav')
                    .on('end', () => sendToWatson(wavName, connection))
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