/**
 * 1. Log into Twitter
 * 2. Open https://twitter.com/following
 * 3. Copy & paste this script into console
 * 4. Run `copy(users)` in the console
 * 5. Paste clipboard into new "export/twitter.json" file
 */

// Delay between scrolls
//-> increase for slower internet
const DELAY = 500;

/**
 * @typedef {import('./types.ts').Source} Source
 */

/** @typedef {Map<string, Source>} Output */

const sleep = () => new Promise((r) => setTimeout(r, DELAY));

/**
 * @param {Output} output
 * @param {Element} div
 */
function attach(output, div) {
	let name = div.querySelector('div[dir="ltr"]')?.textContent?.trim();
	let login = div.querySelector('a')?.getAttribute('href')?.slice(1);
	let avatar = div.querySelector('img')?.src;
	if (avatar && login) output.set(login, { name, avatar, login });
}

/**
 * @param {Output} [output]
 * @returns {Promise<Output>}
 */
async function loop(output) {
	output ||= new Map();

	let prev = output.size;
	let parse = attach.bind(0, output)
	let container = document.scrollingElement;

	document.querySelectorAll('[data-testid=cellInnerDiv]').forEach(parse);

	if (container) {
		prev = container.scrollTop;
		container.scrollTop += 500; // increment
		await sleep();
		if (container.scrollTop !== prev) {
			return loop(output);
		}
	}

	return output;
}

let output = await loop();
console.log('Done', output.size);

let users = [...output.values()];
console.log('Now run: `copy(users)`');
