
/* Connect to device */

function connected() {
	document.body.classList.add('connected');
	document.body.style.setProperty('--color', Floower.color);
	document.body.style.setProperty('--petal', Floower.petals);
	document.body.classList[Floower.color ? 'add' : 'remove']('on');

	if (Floower.petals) {
		document.body.classList.add('open');
	}

	let swatches = document.getElementById('swatches');

	Floower.colorScheme.forEach((color, i) => {
		let button = document.createElement('button');
		button.className = 'color';
		button.style.backgroundColor = color;
		button.dataset.value = color;
		button.dataset.swatch = i;
		swatches.insertBefore(button, swatches.lastElementChild);
	});
	
	Floower.addEventListener('disconnected', () => {
		document.body.classList.remove('connected');
		document.body.classList.remove('on');
		document.body.style.setProperty('--petal', 0);
		document.body.style.removeProperty('--color');

		document.getElementById('colorView').innerHTML = '';
	});

	Floower.addEventListener('change', onChange);
}

function onChange() {
	document.body.style.setProperty('--color', Floower.color);
	document.body.style.setProperty('--petal', Floower.petals);
	document.body.classList[Floower.color ? 'add' : 'remove']('on');
	document.body.classList[Floower.petals ? 'add' : 'remove']('open');
}

async function reconnect() {
	await Floower.reconnect();

	if (Floower.connected) {
		connected();
	}
}

reconnect();

document.getElementById('connect').disabled = false;
document.getElementById('connect').addEventListener('click', async () => {
	//await Floower.connect('L4lsvtsjMR');
	await Floower.connect('QeKLqhxu7H');

	if (Floower.connected) {
		connected();
	}
});


/* Buttons */

document.getElementById('open').addEventListener('click', () => {
	Floower.open();
	document.body.style.setProperty('--petal', 100);
	document.body.classList.add('open');
});	
	
document.getElementById('close').addEventListener('click', () => {
	Floower.close();
	document.body.style.setProperty('--petal', 0);
	document.body.classList.remove('open');
});	

document.getElementById('off').addEventListener('click', () => {
	Floower.off();
	document.body.style.removeProperty('--color');
	document.body.style.setProperty('--petal', 0);
	document.body.classList.remove('open');
	document.body.classList.remove('on');
});	


/* Petals */

document.getElementById('bulb').addEventListener('click', () => {
	Floower.toggle();
	document.body.style.setProperty('--petal', Floower.petals);
	document.body.classList.toggle('open');
});



/* Color picker */

let picker = null;

function createPicker(event) {
	if (picker) {
		picker.remove();
	}

	picker = document.createElement('input');
	picker.type = 'color';
	picker.value = event.target.dataset.value;
	picker.style.position = 'absolute';
	picker.style.left = event.pageX + 'px';
	picker.style.top = event.pageY + 'px';
	picker.style.opacity = 0;
	
	picker.oninput = (e) => { 
		event.target.style.backgroundColor = picker.value;
		event.target.dataset.value = picker.value;
	}

	picker.onchange = (e) => {
		Floower.colorScheme[event.target.dataset.swatch] = picker.value;
	}

	document.body.appendChild(picker);
	setTimeout(() => { picker.click(); picker.style.pointerEvents = 'none'; }, 100);
	event.preventDefault();
}

var controls = document.getElementById('swatches');
controls.addEventListener('mousedown', handleMouseEvent);
controls.addEventListener('touchstart', handleMouseEvent);



/* Color swatches */

function handleMouseEvent(event) {
    if (event.target.tagName != 'BUTTON') {
        return;
	}

	if (!event.target.dataset.value) {
		return;
	}

	if (event.altKey || event.ctrlKey) {
		return createPicker(event);
	}

	var c = event.target.dataset.value;
	Floower.color = c;
	document.body.style.setProperty('--color', c);
	document.body.classList.add('on');

	event.preventDefault();
}



