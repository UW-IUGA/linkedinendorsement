export type Person = {
	name: string,
	email: string,
	linkedin: string
}

/**
 * Connections are an id of the person to a list of other ids
 */
export type Connections = { [person: number]: number[] };