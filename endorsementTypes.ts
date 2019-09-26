export type Person = {
	name: string,
	email: string,
	linkedin: string
}

export type Connections = { [person: number]: number[] };