import { existsSync } from 'node:fs';
import { assert } from 'jsr:@std/assert';
import { join, relative, resolve } from 'node:path';
import { promptSecret } from 'jsr:@std/cli/prompt-secret';

import type { Endpoints } from 'npm:@octokit/types@13.6.1';
import type { Source } from './types.ts';

// https://github.com/settings/personal-access-tokens/new
// Requires: "Account Permissions" > "Followers" > "Read-only"
const GITHUB_TOKEN = promptSecret('Enter your GitHub token:');
assert(GITHUB_TOKEN, 'A GitHub token is required.');

async function GET<T>(path: `/${string}`) {
	let r = await fetch(`https://api.github.com${path}`, {
		headers: {
			'Authorization': `Bearer ${GITHUB_TOKEN}`,
			'Accept': 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
		},
	});

	if (r.ok) {
		return r.json() as Promise<T>;
	}

	let text = await r.text();
	let error = new Error(`(${r.status}) ${text}`);
	error.cause = `GET ${path}`;
	throw error;
}

type $$<K extends keyof Endpoints> = Endpoints[K]['response']['data'];

let following = await GET<$$<'GET /user/following'>>(`/user/following`);
assert(following.length > 0, 'You are not following anyone');

let output: Source[] = await Promise.all(
	following.map(async (user) => {
		let s: Source = {
			login: user.login,
			avatar: user.avatar_url,
		};

		let accts = await GET<$$<'GET /users/{username}/social_accounts'>>(
			`/users/${user.login}/social_accounts`,
		);

		for (let i = 0, len = accts.length; i < len; i++) {
			if (accts[i].provider === 'bluesky') {
				s.bluesky = accts[i].url;
				break;
			}
		}

		return s;
	}),
);

let outdir = resolve('export');
let outfile = join(outdir, 'github.json');
existsSync(outdir) || await Deno.mkdir(outdir);
await Deno.writeTextFile(outfile, JSON.stringify(output, null, 2));
console.log('+', relative(Deno.cwd(), outfile));
