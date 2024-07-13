// wip what was needed so far from estatesync

import { APARTMENT_TYPE, BUILDING_STATUS, FILE_TYPE, FIRING_TYPE, HEATING_TYPE, OPTIONS_TYPE, PARKING_SPACE_TYPE, PETS, PROPERTY_TYPE } from "@App/constants";

export type Estate = {
	// estate
	id: number;
	property_id: string;
	user_id: number;
	property_type: PROPERTY_TYPE;
	apt_type: APARTMENT_TYPE;
	vacant_date: Date;
	building_status: BUILDING_STATUS;
	construction_year: string;
	floor: number;

	amenities: Amenity[];
	heating_type: HEATING_TYPE[];
	last_modernization: Date;
	area: string;
	number_floors: number;
	parking_space: number;
	rooms_number: string;
	parking_space_type: PARKING_SPACE_TYPE[];
	category: {
		name: string;
		building_id: number;
	} | null
}

export type Address = {
	street: string;
	house_number: string;
	city: string;
	zip: string;
	country: string;
	coord_raw: string;
	full_address: string;
}

export type Amenity = {
	id: number
	room_id?: number,
	option_id: number,
	status: number,
	// "amenity": null,
	type: "amenity",
	sequence_order: number,
	added_by: number,
	created_at: Date,
	updated_at: Date,
	estate_id: number,
	// location: "apt",
	option: {
		id: number,
		title: string,
		type: "apt",
		order: number
	},
	location: OPTIONS_TYPE
}

export type Room = {
	id: number,
	estate_id: number,
	type: number,
	area: string,
	status: number,
	created_at: Date,
	updated_at: Date,
	options: null,
	name: string,
	cover?: string,
	favorite: boolean,
	order: number,
	import_sequence: null,
	images: Image[]
}

export type Image = {
	id: number,
	url: string,
	relativeUrl: string,
	disk: "s3public",
	order: number,
	room_id: number,
	file_name: string
}

export type File = {
	id: number,
	url: string,
	type: FILE_TYPE,
	order: number,
	disk: "s3public",
	file_name: string,
	relativeUrl: string,
	thumb: string,
	file_format: string,
}

export type EstateWithDetails = Estate & Address & {
	// rent
	net_rent: number;
	rent_including_heating: number;
	additional_costs: number;
	heating_costs_included: number;
	heating_costs: string;
	rent_per_sqm: number;
	deposit: number;
	stp_garage: number;
	stp_parkhaus: number;
	stp_tiefgarage: number;
	budget: number;
	extra_costs: number;
	// @deprecated
	cold_rent: number;

	pets_allowed: PETS;
	energy_efficiency: string;
	firing: FIRING_TYPE[];

	rooms: Room[];
	cover: string;
	files: File[];
}