import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { assert } from 'jsr:@std/assert';

import type { Input, Source } from './types.ts';

const [input] = Deno.args;
assert(input, 'Missing <input> value');

let file = resolve(input);
assert(existsSync(file), `Invalid "${input}" file`);

let m = await import('file:///' + file, {
	with: { type: 'json' },
}) as {
	default: Source[];
};

let data = m.default || [];
assert(data.length, 'Empty dataset');

function sorter(a: Source, b: Source) {
	// bluesky accounts first
	if (!!a.bluesky !== !!b.bluesky) {
		return a.bluesky ? -1 : 1;
	}

	// alphasort by login
	return a.login.localeCompare(b.login);
}

data.sort(sorter);

let html = await Deno.readTextFile('./src/view.html');
html += '<script type=module>' + await Deno.readTextFile('./src/view.jsx') + '</script>';

Deno.serve(async (req) => {
	if (req.method === 'POST') {
		let payload = await req.json() as Input;
		if (payload.file !== input) {
			return new Response('Invalid file', { status: 400 });
		}

		try {
			data = payload.data.sort(sorter);
			await Deno.writeTextFile(file, JSON.stringify(data, null, 2));
			return new Response('OK');
		} catch {
			return new Response('Error saving file', { status: 500 });
		}
	}

	return new Response(
		html + `<script>var INPUT = ${JSON.stringify({ file: input, data } satisfies Input)};</script>`,
		{
			headers: {
				'Content-Type': 'text/html',
			},
		},
	);
});
