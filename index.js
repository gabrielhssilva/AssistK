const { Client, Util } = require('discord.js');
const { TOKEN, PREFIX, GOOGLE_API_KEY } = require('./config');
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');

const client = new Client({ disableEveryone: true });

const youtube = new YouTube(GOOGLE_API_KEY);

const queue = new Map();

client.on('warn', console.warn);

client.on('error', console.error);

client.on('ready', () => {
	console.log('Pronto para o combate!!!');
	client.user.setActivity('o jogo da vida!');
});

client.on('disconnect', () => console.log('Pô cara, estou de saída. Até logo !!!'));

client.on('reconnecting', () => console.log('Reconectando.'));

client.on('message', async msg => {
	if (msg.author.bot) return undefined;
	if (!msg.content.startsWith(PREFIX)) return undefined;

	const args = msg.content.split(' ');
	const searchString = args.slice(1).join(' ');
	const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
	const serverQueue = queue.get(msg.guild.id);

	let command = msg.content.toLowerCase().split(' ')[0];
	command = command.slice(PREFIX.length)

	if (command === 'play') {
		const voiceChannel = msg.member.voiceChannel;
		if (!voiceChannel) return msg.channel.send('Pô cara, entra num canal de voz ai pra me chamar novamente! :D');
		const permissions = voiceChannel.permissionsFor(msg.client.user);
		if (!permissions.has('CONNECT')) {
			return msg.channel.send('Pô cara, não tô conseguindo me conectar nesse canal de voz :/');
		}
		if (!permissions.has('SPEAK')) {
			return msg.channel.send('Pô cara, não posso falar neste canal de voz, verifique se eu tenho as permissões adequadas!');
		}

		if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
			const playlist = await youtube.getPlaylist(url);
			const videos = await playlist.getVideos();
			for (const video of Object.values(videos)) {
				const video2 = await youtube.getVideoByID(video.id);
				await handleVideo(video2, msg, voiceChannel, true);
			}
			return msg.channel.send(`Adc Playlist: **${playlist.title}** foi bem adicionada a lista!`);
		} else {
			try {
				var video = await youtube.getVideo(url);
			} catch (error) {
				try {
					var videos = await youtube.searchVideos(searchString, 10);
					let index = 0;
					msg.channel.send(`
__**Seleção**__

${videos.map(video2 => `**${++index} -** ${video2.title}`).join('\n')}

Escolha uma opção de 1 a 10:
					`);
					// Desabilita o ES Lint 
					try {
						var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
							maxMatches: 1,
							time: 25000,
							errors: ['time']
						});
					} catch (err) {
						console.error(err);
						return msg.channel.send('Pô cara, valor inserido inválido ou nulo! Cancelando seleção de vídeo.');
					}
					const videoIndex = parseInt(response.first().content);
					var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
				} catch (err) {
					console.error(err);
					return msg.channel.send('🆘 Pô cara, não consegui obter nenhum resultado de pesquisa.');
				}
			}
			return handleVideo(video, msg, voiceChannel);
		}
	} else if (command === 'pular') {
		if (!msg.member.voiceChannel) return msg.channel.send('Pô cara, você não está em um canal de voz!');
		if (!serverQueue) return msg.channel.send('Pô cara, não tem nada tocando. Não posso pular pra você!');
		serverQueue.connection.dispatcher.end('Pulei!');
		return undefined;
	} else if (command === 'parar') {
		if (!msg.member.voiceChannel) return msg.channel.send('Pô cara, você não está em um canal de voz!');
		if (!serverQueue) return msg.channel.send('Pô cara, eu não posso parar algo que não está tocando!');
		serverQueue.songs = [];
		serverQueue.connection.dispatcher.end('O comando Parar foi usado!');
		return undefined;
	} else if (command === 'volume') {
		if (!msg.member.voiceChannel) return msg.channel.send('Pô cara, você não está em um canal de voz!');
		if (!serverQueue) return msg.channel.send('Pô cara, não tem nada tocando.');
		if (!args[1]) return msg.channel.send(`O volume atual é: **${serverQueue.volume}**`);
		serverQueue.volume = args[1];
		serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
		return msg.channel.send(`Ajustar volume para: **${args[1]}**`);
	} else if (command === 'np') {
		if (!serverQueue) return msg.channel.send('Pô cara, não tem nada tocando.');
		return msg.channel.send(`Tocando: **${serverQueue.songs[0].title}**`);
	} else if (command === 'fila') {
		if (!serverQueue) return msg.channel.send('Pô cara, não tem nada tocando.');
		return msg.channel.send(`
__**Lista de Música:**__

${serverQueue.songs.map(song => `**-** ${song.title}`).join('\n')}

**Tocando Agora:** ${serverQueue.songs[0].title}
		`);
	} else if (command === 'pause') {
		if (serverQueue && serverQueue.playing) {
			serverQueue.playing = false;
			serverQueue.connection.dispatcher.pause();
			return msg.channel.send('⏸ Pausou');
		}
		return msg.channel.send('Pô cara, não tem nada tocando.');
	} else if (command === 'resume') {
		if (serverQueue && !serverQueue.playing) {
			serverQueue.playing = true;
			serverQueue.connection.dispatcher.resume();
			return msg.channel.send('▶ Resumindo');
		}
		return msg.channel.send('Pô cara, não tem nada tocando.');
	}

	return undefined;
});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
	const serverQueue = queue.get(msg.guild.id);
	console.log(video);
	const song = {
		id: video.id,
		title: Util.escapeMarkdown(video.title),
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true
		};
		queue.set(msg.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(msg.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`Pô cara, infelizmente não pude entrar no canal de voz: ${error}`);
			queue.delete(msg.guild.id);
			return msg.channel.send(`Pô cara, infelizmente não pude entrar no canal de voz: ${error}`);
		}
	} else {
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
		if (playlist) return undefined;
		else return msg.channel.send(`Agora a música **${song.title}** foi adicionada a lista!`);
	}
	return undefined;
}


// Função para tocar música
function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}
	console.log(serverQueue.songs);


	const stream = ytdl(song.url, {filter : 'audioonly'});
	const dispatcher = serverQueue.connection.playStream(stream, song.url);
	dispatcher.setVolumeLogarithmic(0.5);
	dispatcher.on('end', reason => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
    })
    .on('error', error => console.error(error));
dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

	serverQueue.textChannel.send(`Tocando: **${song.title}**`);
}

client.login(TOKEN);