
(function() {
	'use strict';

	class Floower {
		constructor() {
			this._events = {}
			this._connected = false;
			this._colorScheme = [];
			this._state = {
				petalsLevel: 0,
				red: 0,
				green: 0,
				blue: 0
			}
			setTimeout(this._refreshState.bind(this), 5000);
		}


		/* Functions */

		async reconnect() {
			let apiKey = localStorage.getItem('last-used-api-key');
			if (apiKey) {
				this._apiKey = apiKey;
				await this._retrieveInfo();
			}
		}

		async connect(apiKey) {
			this._apiKey = apiKey;
			await this._retrieveInfo();

			localStorage.setItem('last-used-api-key', apiKey);
		}

		disconnect() {
			this._connected = false;
			localStorage.removeItem('last-used-api-key');
			this._disconnect(); 
		}

		addEventListener(e, f) {
			this._events[e] = f;
		}

		off() {
			this._state.petalsLevel = 0;
			this._state.red = 0;
			this._state.green = 0;
			this._state.blue = 0;

			this._sendState();
		}

		open() {
			this._state.petalsLevel = 100;
			this._sendState();
		}

		close() {
			this._state.petalsLevel = 0;
			this._sendState();
		}

		toggle() {
			this._state.petalsLevel = this._state.petalsLevel ? 0 : 100;
			this._sendState();
		}


		/* Properties */

		get connected() {
			return this._connected;
		}

		get color() {
			if (this._state.red != 0 || this._state.green != 0 || this._state.blue != 0) {
				return this._rgbToHex(this._state.red, this._state.green, this._state.blue);
			}
			
			return null;
		}

		set color(color) {
			var c = parseInt(color.substring(1), 16);

			this._state.red = (c >> 16) & 255;
			this._state.green = (c >> 8) & 255;
			this._state.blue = c & 255;

			this._sendState();
		}

		get colorScheme() {
			return new Proxy([...this._colorScheme], {
				set: function(target, prop, value) {
					this._colorScheme[prop] = value;
					this._sendColorScheme();
				}
			})
		}

		set colorScheme(value) {
			this._colorScheme = [...value];
			this._sendColorScheme();
		}

		get petals() {
			return this._state.petalsLevel;
		}

		set petals(value) {
			this._state.petalsLevel = value;
			this._sendState();
		}



		/* Internal functions */

		_disconnect() {
			this._connected = false;
			this._fireEvent('disconnected');
		}

		_fireEvent(e) {
			if (this._events[e]) {
				this._events[e].call();
			}
		}

		async _sendState() {
			if (!this._connected) {
				return;
			}

			await this._sendUpdate({
				petalsLevel: this._state.petalsLevel, 
				red: this._state.red, 
				green: this._state.green, 
				blue: this._state.blue
			});
		}

		async _sendColorScheme() {
			if (!this._connected) {
				return;
			}
		}

		async _refreshState() {
			if (this._connected) {
				this._retrieveInfo();
				this._fireEvent('change');
			}
			setTimeout(this._refreshState.bind(this), 5000);
		}

		async _retrieveInfo() {
			let url = "https://api.floud.cz/floower?apiKey=" + this._apiKey;
			let result = await this._httpGetRequest(url);
			
			if (result.status == 200) {
				let response = result.responseJson;
				this._state = response.state;
				if (response.settings && response.settings.colorScheme) {
					this._colorScheme = response.settings.colorScheme.map(this._schemeHsColorToHex.bind(this));
				}
				this._connected = true;
			}
		}

		async _sendUpdate(update) {
			let url = "https://api.floud.cz/floower";
			update.apiKey = this._apiKey;

			let result = await this._httpPutRequest(url, update);

			if (result.status == 204) {
				// ok
			}
		}

		async _httpGetRequest(url) {
			let xhr = new XMLHttpRequest();

			return new Promise((resolve, reject) => {
				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4) {
						if (xhr.status >= 200 && xhr.status <= 399) {
							resolve({
								responseJson: this._parseJson(xhr.responseText),
								status: xhr.status
							});
						}
						else {
							reject({
								responseText: xhr.responseText,
								error: xhr.status
							})
						}
					}
				}.bind(this);
				xhr.open("GET", url, true);
				xhr.send(null);
			});
		}

		async _httpPutRequest(url, bodyJson) {
			let xhr = new XMLHttpRequest();

			return new Promise((resolve, reject) => {
				xhr.onreadystatechange = function() { 
					if (xhr.readyState == 4) {
						if (xhr.status >= 200 && xhr.status <= 399) {
							resolve({
								responseJson: this._parseJson(xhr.responseText),
								status: xhr.status
							});
						}
						else {
							reject({
								responseText: xhr.responseText,
								error: xhr.status
							})
						}
					}
				}.bind(this);
				xhr.open("PUT", url, true);
				xhr.setRequestHeader("Content-Type", "application/json");
				xhr.send(JSON.stringify(bodyJson));
			});
		}

		_parseJson(value) {
			try {
				return JSON.parse(value)
			}
			catch (error) {
				return {};
			}
		}

		_schemeHsColorToHex(valueHS) {
            let saturation = valueHS & 0x7F
            saturation = saturation / 100.0;
            let hue = valueHS >> 7; // 0 - 360
            hue = hue / 360.0;
			let rgb = this._hsvToRgb(hue, saturation, 1);
			return this._rgbToHex(rgb.r, rgb.g, rgb.b);
		}

		_rgbToHex(red, green, blue) {
			let rgb = blue | (green << 8) | (red << 16);
			return '#' + (0x1000000 + rgb).toString(16).slice(1)
		}

		_hsvToRgb(h, s, v) {
			let i = Math.floor(h * 6);
			let f = h * 6 - i;
			let p = v * (1 - s);
			let q = v * (1 - f * s);
			let t = v * (1 - (1 - f) * s);

			let r, g, b;
			switch (i % 6) {
				case 0: r = v, g = t, b = p; break;
				case 1: r = q, g = v, b = p; break;
				case 2: r = p, g = v, b = t; break;
				case 3: r = p, g = q, b = v; break;
				case 4: r = t, g = p, b = v; break;
				case 5: r = v, g = p, b = q; break;
			}
			return {
				r: Math.round(r * 255),
				g: Math.round(g * 255),
				b: Math.round(b * 255)
			};
		}
	}

	window.Floower = new Floower();
})();
