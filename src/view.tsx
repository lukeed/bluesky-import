import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { assert } from 'jsr:@std/assert';
import { render } from 'preact-render-to-string';

import type { Source } from './types.ts';

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

data.sort((a, b) => {
	// bluesky accounts first
	if (!!a.bluesky !== !!b.bluesky) {
		return a.bluesky ? -1 : 1;
	}

	// alphasort by login
	return a.login.localeCompare(b.login);
});

let table = render(
	<table>
		<caption>Showing <b>{data.length.toLocaleString()}</b> users from <b>{input}</b> file</caption>

		<thead>
			<tr>
				<th>Name</th>
				<th>Bluesky</th>
			</tr>
		</thead>
		<tbody>
			{
				data.map((user) => (
					<tr>
						<td>
							<figure>
								<img src={user.avatar} alt={user.login} />
								<figcaption>{user.login}</figcaption>
							</figure>
						</td>
						<td>
							{user.bluesky && <a href={user.bluesky} target="_blank">{user.bluesky}</a> || ''}
						</td>
					</tr>
				))
			}
		</tbody>
	</table>
);

let html = `
<meta charset="utf-8">
<title>Bluesky Users</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
	* {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}
	html {
		font-size: 16px;
		line-height: 1.5;
		font-family: ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
		font-feature-settings: normal;
		font-variation-settings: normal;
		-webkit-font-smoothing: antialiased;
		-webkit-tap-highlight-color: transparent;
	}
	section {
		width: 96vw;
		min-width: 300px;
		margin: 2rem auto;
		overflow-x: auto;
	}
	table {
		width: 100%;
		text-align: left;
		border: 1px solid #ccc;
		border-collapse: collapse;
	}
	th, td {
		padding: 0.25rem 0.5rem;
		border-bottom: 1px solid #ccc;
	}
	th {
		padding-top: 1rem;
		padding-bottom: 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #71717a;
	}
	caption {
		font-size: 0.875rem;
		line-height: 1.25rem;
		margin-bottom: 1rem;
		color: #71717a;
	}
	figure {
		display: flex;
		align-items: center;
		column-gap: 0.5rem;
	}
	img {
		width: 2rem;
		height: 2rem;
		border-radius: 9999px;
	}
</style>
<section>
	${table}
</section>
`;

Deno.serve((req) => {
	return new Response(html, {
		headers: {
			'Content-Type': 'text/html',
		},
	});
});
