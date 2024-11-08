export type Source = {
	login: string;
	avatar: string;
	bluesky?: string;
	following?: boolean;
	name?: string;
};

export type Input = {
	file: string;
	data: Source[];
};
