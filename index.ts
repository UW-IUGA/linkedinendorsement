import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { Connections, Person } from './endorsementTypes';
import nodemailer from 'nodemailer';

const IUGA_EMAIL = process.env.IUGA_EMAIL;
const IUGA_PASSWORD = process.env.IUGA_PASSWORD;

// set up email
let transporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	port: 587,
	secure: false,
	requireTLS: true,
	auth: {
		user: IUGA_EMAIL,
		pass: IUGA_PASSWORD
	}
});

// Grab the people.csv file from the data folder. (Current working directory has to be ~ of the repo)
const dataString = fs.readFileSync(path.resolve(process.cwd() + '/data/people.csv'), 'UTF8');

/**
 * potentiallyConnect will read the two IDs and determine if they should be connected, or if
 * they were already connected. 
 * 
 * SIDE EFFECTS:
 * 		- Will add the connection to connected if they were not previously connected
 * 		- Will add the connection to the connections list for the individual 
 * 		  who should instantiate the connection
 * @param id id of the person to instantiate the connection
 * @param otherId id of the person to receive the connection request
 * @param connected set of individuals that have been connected
 * @param connections object of all connections made
 * @returns if the connection was made or not
 */
const potentiallyConnect = (
	id: number,
	otherId: number,
	connected: Set<string>,
	connections: Connections
): boolean => {
	let connectedString = id < otherId ? `${id}-${otherId}` : `${otherId}-${id}`;
	if (!connected.has(connectedString)) {
		connections[id].push(otherId);
		connected.add(connectedString);
		return true;
	}
	return false;
}

const generateEmail = (
	otherIds: number[],
	id: number,
	people: Person[]
): string => {
	return `<p>Hi ${people[id].name},</p>

<p>Thank you for participating in LinkedIn endorsement week! Here are the people you should add on LinkedIn. Others not on this list will add you.</p>

	${otherIds.map(otherId => {
		let person = people[otherId];
		return `<p><a href="${person.linkedin}">${person.name}</a></p>`;
	}).join()}

<p>Best,</p>
<p>Informatics Undergraduate Association</p>
<p><a href="https://iuga.info">www.iuga.info</a></p>
`
}

const main = async () => {
	// Parse the people csv data.
	const parsedData = await Papa.parse(dataString, {
		header: true
	});

	const people: Person[] = parsedData.data;
	const countOfPeople = people.length;

	// set the maximum connection amount to half of everyone else except 1. (rounded up if odd count)
	// ie if there are 5 total people, that means there are 4 possible to connect to, so each person makes max 2 connections.
	// if there are 6 total people, that means 5 possible, so each person makes max 3 connections (2.5 -> 3)
	let maxConnect = Math.floor((countOfPeople - 1) / 2) + ((countOfPeople - 1) % 2 === 0 ? 0 : 1);

	// set up connected individuals and their list of people to connect to
	let connected = new Set<string>();
	let connections: Connections = {};

	// Fill connections with empty array to not worry about checking for existence. 
	people.forEach((_, i) => {
		connections[i] = [];
	});

	// Iterate through each person and connect em
	for (let id = 0; id < countOfPeople; id++) {
		let connectedCount = 0;

		// For all users except the person instantiating the connection, potentially
		// connect them to the person instantiating the connection.
		// 
		// Make sure the person only connects to the maximum amount of users.
		for (let i = 0; i < id; i++) {
			if (connectedCount < maxConnect) {
				let didConnect = potentiallyConnect(id, i, connected, connections);
				connectedCount += didConnect ? 1 : 0;
			}
		}

		for (let i = id + 1; i < countOfPeople; i++) {
			if (connectedCount < maxConnect) {
				let didConnect = potentiallyConnect(id, i, connected, connections);
				connectedCount += didConnect ? 1 : 0;
			}
		}
	}

	Object.keys(connections).forEach(id => {
		let idNum = Number(id);
		let html = generateEmail(connections[idNum], idNum, people);
		let mailOptions = {
			from: IUGA_EMAIL,
			to: people[idNum].email,
			subject: "TEST EMAIL FOR LIN ENDORSEMENT WEEK",
			html
		};

		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.log(error);
			} else {
				console.log('Email sent to ' + people[idNum].email + ' response: ' + info.response);
			}
		});
	})
};

main();