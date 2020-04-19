import DataSourceFrom from "./datasource/DataSourceFrom";
import {BeanBundle} from "./StockAlarmFactory";
import Processor from "./processor/Processor";
import MessageSender from "./sender/MessageSender";
import path from "path";
import yaml from "js-yaml";
import util from "util";
import fs from "fs";
import schedule from 'node-schedule';
import moment from "moment";

const readFile = util.promisify(fs.readFile);

interface StockAlarmDependencies {
	dataSourceFrom: DataSourceFrom;
}

export default class StockAlarm {
	_self: StockAlarm = new StockAlarm();

	private static dataSourceFrom: DataSourceFrom;
	private static processor: Processor;
	private static senders: MessageSender[];

	private constructor() { }

	static async init({ dataSourceFrom, processor, senders }: BeanBundle) {
		this.dataSourceFrom = dataSourceFrom;
		this.processor = processor;
		this.senders = senders;
	}

	static async execute(cron: string) {

		const dataSource = await this.dataSourceFrom.fetch();
		const alarmMessages = this.processor.process(dataSource);

		// console.log(alarmMessages);

		alarmMessages.forEach(alarmMessage => {
			this.senders.forEach(sender => sender.send(alarmMessage));
		});
	}
}
