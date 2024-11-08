// @ts-check
// deno-lint-ignore-file no-window

/// <reference lib="dom" />
import { Component, html, render } from 'https://esm.sh/htm@3.1.1/preact';
import { BskyAgent } from 'https://esm.sh/@atproto/api@0.13.14';

/**
 * @typedef {import('./types.ts').Source} Source
 */

/**
 * @typedef {import('./types.ts').Input} Input
 */

/**
 * @typedef {import('https://esm.sh/@atproto/api@0.13.14').AppBskyActorGetProfile.OutputSchema} Profile
 */

// @ts-ignore; global var
const INPUT = /** @type {Input} */ (window.INPUT);

let bsky = new BskyAgent({
	service: 'https://bsky.social',
});

/**
 * @param {{ src: string, alt: string,  text?: string }} props
 */
const Avatar = ({ src, alt, text }) => html`
	<figure>
		<img src=${src} alt=${alt} loading=lazy />

		<figcaption>
			${alt}
			${text && html`<small>${text}</small>`}
		</figcaption>
	</figure>
`;

/**
 * @typedef State
 * @property {boolean} user
 * @property {boolean} login
 * @property {boolean} search
 * @property {boolean} loading
 * @property {boolean} dirty
 * @property {Source} [target]
 * @property {Profile[]} results
 */

class App extends Component {
	/**
	 * @override
	 * @type {State}
	 */
	state = {
		user: false,
		login: false,
		search: false,
		loading: false,
		dirty: false,
		results: [],
	};

	/**
	 * @type {HTMLDialogElement | null}
	 */
	#rLogin = null;

	/**
	 * @param {HTMLDialogElement} dom
	 */
	#setLogin = (dom) => {
		this.#rLogin = dom;
	};

	/**
	 * @param {HTMLDialogElement} dom
	 */
	#setSearch = (dom) => {
		this.#rSearch = dom;
	};

	/**
	 * @type {HTMLDialogElement | null}
	 */
	#rSearch = null;

	/**
	 * @param {SubmitEvent} ev
	 */
	#login = async (ev) => {
		try {
			ev.preventDefault();
			this.setState({ loading: true });

			let form = /** @type {HTMLFormElement} */ (ev.target);

			let r = await bsky.login({
				identifier: form.identifier.value,
				password: form.password.value,
			});

			if (!r.success) {
				throw 1; // invalid credentials
			}

			this.setState({
				user: true,
				login: false,
				loading: false,
			});
		} catch {
			this.setState({
				user: false,
				login: false,
				loading: false,
			});
		}
	};

	/**
	 * @param {Source} user
	 */
	#search = async (user) => {
		if (this.state.loading) return;

		if (!this.state.user) {
			return this.setState({ login: true });
		}

		let q = user.login;
		this.setState({ loading: true, results: [] });
		// NOTE: lucene query syntax doesnt seem to work
		// if (user.name) q = `"${user.name}" OR "${user.login}"`;
		// Currently better to check name > login
		if (user.name) q = `"${user.name}"`;
		let r = await bsky.searchActors({ q });

		this.setState({
			loading: false,
			search: r.success,
			results: r.success ? r.data.actors : [],
			target: user,
		});
	};

	/**
	 * @param {Source} user
	 */
	#follow = async (user) => {
		if (!this.state.user) {
			return this.setState({ login: true });
		}

		if (!user.bluesky) {
			return alert('Missing Bluesky account!');
		}

		let handle = user.bluesky.split('/').pop();
		if (!handle) throw 'Invalid Bluesky address';

		if (!handle.startsWith('did:')) {
			try {
				let r = await bsky.resolveHandle({ handle });
				handle = r.data.did;
				user.bluesky = `https://bsky.app/profile/${handle}`;
				this.setState({ dirty: true });
			} catch (err) {
				return console.error('[follow/resolve]', err);
			}
		}

		try {
			await bsky.follow(handle);
			user.following = true;
			this.setState({ dirty: true });
		} catch (e) {
			console.error('[follow]', e);
		}
	};

	/**
	 * @param {Event} ev
	 */
	#all = async (ev) => {
		ev.preventDefault();

		if (!this.state.user) {
			return this.setState({ login: true });
		}

		if (this.state.loading) return;
		if (!confirm('Are you sure?')) return;

		try {
			this.setState({ loading: true });
			await Promise.all(
				INPUT.data.map(user => {
					if (user.bluesky && !user.following) {
						return this.#follow(user);
					}
				})
			);
		} catch (err) {
			console.error('[followAll]', err);
		} finally {
			this.setState({ loading: false });
		}
	};

	/**
	 * @param {Profile} profile
	 * @param {Source} user
	 */
	select = (profile, user) => {
		user.bluesky = `https://bsky.app/profile/${profile.did}`;
		this.setState({ dirty: true });
		this.#close();
	};

	/**
	 * close results dialog
	 */
	#close = () => {
		this.setState({
			search: false,
			target: undefined,
			results: [],
		});
	}

	/** sync changes to server */
	#save = async () => {
		if (!this.state.dirty) return;
		if (this.state.loading) return;

		try {
			this.setState({ loading: true });

			let r = await fetch('/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(INPUT),
			});

			if (!r.ok) throw 1;
			this.setState({ dirty: false, loading: false });
		} catch (e) {
			this.setState({ loading: false });
		}
	};

	/**
	 * @override
	 */
	componentDidUpdate() {
		if (this.#rSearch) {
			this.state.search ? this.#rSearch.showModal() : this.#rSearch.close();
		}

		if (this.#rLogin) {
			this.state.login ? this.#rLogin.showModal() : this.#rLogin.close();
		}
	}

	/**
	 * @param {unknown} _
	 * @param {State} s
	 * @returns
	 */
	render(_, s) {
		let rows = INPUT.data;
		let count = rows.length.toLocaleString();

		return html`
			<header>
				<span>You are ${s.user ? '' : html`<b>NOT</b>`} logged in</span>
				<button disabled=${!s.user} onclick=${this.#all}>Follow All</button>
				<button disabled=${!s.dirty} onclick=${this.#save}>Save Changes</button>
			</header>

			<table>
				<caption>Showing <b>${count}</b> users from <b>${INPUT.file}</b> file</caption>

				<thead>
					<tr>
						<th>Name</th>
						<th>Bluesky</th>
					</tr>
				</thead>
				<tbody>
					${
						rows.map((user) => {
							let handle = '@' + user.login;

							return html`
								<tr key=${user.login}>
									<td>
										<${Avatar}
											src=${user.avatar}
											alt=${user.name || handle}
											text=${user.name && handle}
										/>
									</td>
									<td>
										<nav role=menu>
											${
												user.bluesky
													? html`
														<a href=${user.bluesky} target="_blank">Profile</a>
														${ !user.following && html`<button onclick=${() => this.#follow(user)}>Follow</button>` }
													`
													: html`
														<button onclick=${() => this.#search(user)}>Search</button>`
												}
										</nav>
									</td>
								</tr>
							`;
						})
					}
				</tbody>
			</table>

			<dialog ref=${this.#setLogin}>
				<form onsubmit=${this.#login}>
					<h2>Login to Bluesky</h2>

					<label for=identifier>Identifier</label>
					<input id=identifier type=text placeholder=identifier.bsky.social />

					<label for=password>Password</label>
					<input id=password type=password placeholder=password />

					<button type=submit>Login</button>
				</form>
			</dialog>

			<dialog ref=${this.#setSearch}>
				<button autofocus onclick=${this.#close}>
					${'\u2715'}
				</button>

				<h2>Select Match</h2>

				<ul>
					${
						s.results.length > 0
						? s.results.map((user) => html`
							<li key=${user.did}>
								<button onclick=${() => s.target && this.select(user, s.target)}>
									<${Avatar}
										src=${user.avatar || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
										alt=${user.displayName || user.handle}
										text=${user.description || user.handle}
									/>
								</button>
							</li>
						`)
						: html`<li>No results</li>`
					}
				</ul>
			</dialog>

			<pre>${JSON.stringify(s, null, 2)}</pre>
		`;
	}
}

render(html`<${App}/>`, document.body);
