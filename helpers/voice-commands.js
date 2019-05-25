const commands = require('../commands.json')

module.exports = {
    recognizeVoiceCommands: function (alternatives) {
        console.log(JSON.stringify(alternatives))

        let commandId = 0

        alternatives.forEach(alt => {
            commands.commandList.forEach(command => {
                if(alt.transcript.includes(command.trigger))
                    commandId = command.id
            })
        })

        return commandId  
    }
};