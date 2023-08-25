import * as Server from '@minecraft/server';
import * as ServerUI from '@minecraft/server-ui';
//remember m9 helped make this
export const content = {
	warn(...messages) {
		console.warn(messages.map(message => JSON.stringify(message, (key, value) => (value instanceof Function) ? '<f>' : value)).join(' '));
	},
	chatFormat(...messages) {
		chunkString(messages.map(message => JSON.stringify(message, (key, value) => (value instanceof Function) ? '<f>' : value, 4)).join(' '), 500).forEach(message => world.sendMessage(message));
	}
};
const promiseFunctions = ['show', 'runCommandAsync'];
function fix(object) {
	if (!object?.prototype) return;
	const properties = Object.getOwnPropertyDescriptors(object.prototype);
	for (const key in properties) {
		if (key === 'constructor') continue;
		const { set, get, value, configurable, enumerable } = properties[key];
		if (!configurable || !enumerable) continue;
		if (value instanceof Function) Object.defineProperty(object.prototype, key, {
			value: (promiseFunctions.includes(key)) ?
				async function (...args) {
					try {
						return await value.apply(this, args);
					} catch (error) {
						if (error.message?.includes('have required privileges')) {
							const thisFunc = this;
							await null;
							return await value.apply(thisFunc, args);
							// return Server.system.run(() => value.apply(thisFunc, args));
						}
						throw new Error(`${error?.message}`);
					}
				} : function (...args) {
					try {
						return value.apply(this, args);
					} catch (error) {
						if (error.message?.includes('have required privileges')) {
							const thisFunc = this;
							return (async function () {
								await null;
								value.apply(thisFunc, args);
							})();
							// return Server.system.run(() => value.apply(thisFunc, args));
						}
						throw new Error(`${error?.message}`);
					}
				},
			configurable: true,
			enumerable: true
		});
		else if (get instanceof Function && set instanceof Function) Object.defineProperty(object.prototype, key, {
			get() {
				return get.call(this);
			},
			set(value) {
				try {
					return set.call(this, value);
				} catch (error) {
					if (error.message?.includes('have required privileges')) {
						const thisFunc = this;
						(async function () {
							await null;
							set.call(thisFunc, value);
						})();
						// Server.system.run(() => set.call(thisFunc, value));
						return;
					}
					throw new Error(`${error?.message}`);
				}
			},
			configurable: true,
			enumerable: true
		});
	}
}
for (const classKey in Server) {
	const object = Server[classKey];
	fix(object);
}
for (const classKey in ServerUI) {
	const object = ServerUI[classKey];
	fix(object);
}