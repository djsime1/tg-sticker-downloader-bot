const TOKEN = "YOUR_TOKEN_HERE";
const TelegramBot = require("tgfancy");
const bot = new TelegramBot(TOKEN, {polling: true});
const sharp = require("sharp")
var cooldown = {}

bot.onText(/^\/start$/g, (msg) => {

    var resp = `
*Greetings\\!* I'm a simple bot that will help you download Telegram stickers\\.
All you need to do is _send or forward me a sticker\\._
Besides that, I do nothing else ¯\\\\\\_\\(ツ\\)\\_/¯
[__Contact my creator \\(\\@djsime1\\)__](tg://resolve?domain=djsime1) // [__View my source code \\(on GitHub\\)__](https://github.com/djsime1/tg-sticker-downloader-bot)
`
    bot.sendMessage(msg.chat.id, resp, {parse_mode: "MarkdownV2", disable_web_page_preview: true})

});

bot.on("sticker", (msg) => {

    if (cooldown[msg.from.id] == true) {bot.sendMessage(msg.chat.id, "Please wait for your previous sticker to finish conversion!", {reply_to_message_id: msg.message_id, allow_sending_without_reply: true}); return;}
    if (msg.sticker.is_animated) {bot.sendMessage(msg.chat.id, "Animated stickers are currently unsupported.", {reply_to_message_id: msg.message_id, allow_sending_without_reply: true}); return;}

    cooldown[msg.from.id] = true

    var startt = process.hrtime()
    var resp = null
    bot.sendMessage(msg.chat.id, "Processing...").then(msg => {resp = msg})
    bot.sendChatAction(msg.chat.id, "upload_photo")

    try {
        var fstream = bot.getFileStream(msg.sticker.file_id)

        var buffer = [];
        fstream.on('data', function(data) {
            buffer.push(data);
        });

        fstream.on('end', function() {
            var sticker = Buffer.concat(buffer);
            sharp(sticker).png().toBuffer()
            .then(data => {
                var endt = process.hrtime(startt)
                //bot.editMessageText("Uploading...", {message_id: resp.message_id, chat_id: resp.chat.id}) // Unreliable
                bot.sendDocument(msg.chat.id, data,
                {reply_to_message_id: msg.message_id, allow_sending_without_reply: true, caption: "Completed in " + (endt[1]/1000000000 + endt[0]) + " seconds."},
                {filename: msg.sticker.set_name + "-" + msg.sticker.file_unique_id})
                .then(bot.deleteMessage(resp.chat.id, resp.message_id));
                cooldown[msg.from.id] = false
            })
        });
    }
    catch (err) {
        var resp = `
Hmm, something went wrong...
Error details:
<pre>
`
        bot.editMessageText(resp + err + "</pre>", {message_id: resp.message_id})
        cooldown[msg.from.id] = false
    }

});