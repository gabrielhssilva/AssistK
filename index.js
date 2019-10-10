// Busca da biblioteca para funcionamento do Discord.JS
const Discord = require('discord.js');

// Instância de Login do Bot
const bot = new Discord.Client();

// Login do Bot via Token
bot.login('NjMxNjU1NTI0NzMxMDYwMjQ0.XZ6k2Q.v7gl0FgJYJGwFbwzjriqBhprVFU');

// Aviso no Console quando o Bot fica Online
bot.once('ready', ()=>{
    console.log(`Bot Iniciado: ${bot.user.tag}`);
});

// Respostas para Comandos
bot.on('message', message => {
    let responseObject = {
        "!play":"Aqui não tem nenhum escravo pra ficar pondo música para você!",
        "!ping":`Ping do AssistK: ${Math.round(bot.ping)}ms`,
        "!comandos":`Comandos: 
                     !roleta - Faz um sorteio de números aleatórios. Você decide se é bom ou ruim ganhar :D
                     !ping - Verifica o ping do AssistK
                     !play - Toca uma música
                     !apagar - Apaga as últimas 5 mensagens enviadas no canal de texto atual
                     !limpar - Apaga TODAS as mensagens enviadas no canal de texto atual (somente Admin)
                     !tocar - Toca uma música predefinida do servidor`
    };

    if (responseObject[message.content]){
        message.channel.send(responseObject[message.content]);
    }




    // Comando para Roleta Russa
    if(message.content.startsWith("!roleta")){
        randomNumber = Math.floor(Math.random() * (6 - 1) + 1 );
        if(randomNumber == 2){
            message.reply("você perdeu bebê! Vai lá pegar um café pra gente, vai ?!");
        } else {
            message.reply("dessa vez você deu sorte ein! Da próxima não você não escapa hehehe");
        }
    }

    // Comando para deletar mensagens do Chat (quantidade limitada)
    if (message.content.startsWith("!apagar")){
        qtdMensagens = 5;
        let numeroMensagens = parseInt(qtdMensagens);
        message.channel.fetchMessages({limit: numeroMensagens}).then(messages => message.channel.bulkDelete(messages));
    }

    // Tocar arquivo no servidor
    if (message.content.startsWith("!tocar")){
        const broadcast = bot.createVoiceBroadcast();
        const voiceChannel = message.member.voiceChannel;

        voiceChannel.join()
        .then(connection => {
            broadcast.playFile('./musicas/Decolou.mp3');

            const dispatcher = connection.playBroadcast(broadcast);
            dispatcher.setVolumeLogarithmic(0.3);

        })
        .catch(console.error);

    }

    // // BUGADO -> MOTIVO: SÓ PODE APAGAR MENSAGEM DE ATÉ 14 DIAS DE "IDADE"
    // // Comando para LIMPAR TODAS as mensagens do Chat (ADMIN)
    // let role = message.guild.roles.find("name","Admin");
    // if (message.content.startsWith("!limpar")){
    //     if (message.member.roles.has(role.id) && (role != null)){
    //         qtdMensagens = 100;
    //         let numeroMensagens = parseInt(qtdMensagens);
    //         message.channel.fetchMessages({limit: numeroMensagens}).then(messages => message.channel.bulkDelete(messages));
    //     } else {
    //         message.reply("desculpe. Esse comando só é permitido para Administradores :(");
    //     }
    // }

});