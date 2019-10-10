// Busca da biblioteca para funcionamento do Discord.JS
const Discord = require('discord.js');

// Instância de Login do Bot
const bot = new Discord.Client();

// Login do Bot via Token
bot.login('NjMxNjU1NTI0NzMxMDYwMjQ0.XZ6DxA.MhtUoFjpYAq8IifspFIfrofAGP0');

// Aviso no Console quando o Bot fica Online
bot.once('ready', ()=>{
    console.log(`Bot Iniciado: ${bot.user.tag}`);
});

// Prefixo dos Comandos
const pfx = '!';

// Repostas para Comandos
bot.on('message', message => {
    let responseObject = {
        "!play":"Aqui não tem nenhum escravo pra ficar pondo música para você!",
        "!teste":"Vai se lascar, maluco! Num vem com essa conversinha de teste não!",
        "!ping":`Ping do AssistK: ${bot.ping}ms`
    };

    if (responseObject[message.content]){
        message.channel.send(responseObject[message.content]);
    }

    if(message.content.startsWith("!roleta")){
        randomNumber = Math.floor(Math.random() * (6 - 1) + 1 );
        if(randomNumber == 2){
            message.reply("você perdeu bebê! Vai lá pegar um café pra gente, vai ?!");
        } else {
            message.reply("dessa vez você deu sorte ein! Dá próxima não passa hehehe");
        }
    }
});