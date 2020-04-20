import sequelize from "./infrastructure/database/sequelize";
import schedule from 'node-schedule';
import SlackMessage from "./infrastructure/database/models/SlackMessage.model";
import axios from 'axios';
import delay from "delay";

const POST_MESSAGE_API = 'https://slack.com/api/chat.postMessage';
const BOT_TOKEN = process.env.BOT_TOKEN || '';

(async () => {
    sequelize.sync({ force: false });
    schedule.scheduleJob('', sendSlackMessageJob);
})();

async function sendSlackMessageJob () {
    const slackMessages = await SlackMessage.findAll({
        where: { isProcessed: 'N' }
    });

    console.log(`Total ${slackMessages.length} slack messages are awaiting.`);

    for (const slackMessage of slackMessages) {
        try {
            const params = {
                token: BOT_TOKEN,
                channel: slackMessage.channelId,
                text: slackMessage.text,
            };

            const { data } = await axios.post(POST_MESSAGE_API, null, { params });
            const { ok, error } = data;

            if (ok === true) {
                slackMessage.isProcessed = 'Y';
                slackMessage.processedAt = new Date();

                console.log(`Slack Message 발송 성공: ${slackMessage.text}`);
            } else {
                slackMessage.isProcessed = 'E';
                console.log(`Slack Message 발송 실패: ${error}`);
            }

            slackMessage.save();
        } catch (e) {
            console.error(`Slack Message 발송 실패`, e);
        }
        await delay(3000);
    }
}
