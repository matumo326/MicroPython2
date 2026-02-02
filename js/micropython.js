// ---------------------------------------------------------------
//	micropython.js
//  2024.1.2
//	
// ---------------------------------------------------------------
let port;
let reader;
let writer;
let connectionStatus = false;
let font_size = 14;
var editor;

document.addEventListener("DOMContentLoaded", function (event) {
	Split(['#one', '#three'], {
		sizes: [40, 60],
		// gutterSize: 12,	
		minSize: [window.innerWidth * 0.34, window.innerWidth * 0.3]
	});

	Split(['#one1', '#one2'], {
		sizes: [90, 10],
		gutterSize: 20,
		direction: 'vertical',
		minSize: [10, 10]
	});
});

// ---------------------------------------------------------------
window.addEventListener('DOMContentLoaded', function () {
	editor = CodeMirror.fromTextArea(document.getElementById("txt-editor"),
		{
			theme: "monokai",
			mode: "python", // 言語を設定する
			lineNumbers: true,
			lineSeparator: "\r",
			indentWithTabs: true,
			indentUnit: 4,
			styleActiveLine: true,
			matchBrackets: true,
			//全角スペース可視化
			specialChars: /[\u0000-\u0019\u00ad\u200b-\u200f\u2028\u2029\u3000\ufeff]/,
			specialCharPlaceholder: function (ch) {
				var token = document.createElement('span');
				//var token = elt("span", placeholderChar, "cm-invalidchar");
				var placeholderChar = "\u2022"; // default replacement character
				token.title = "\\u" + ch.charCodeAt(0).toString(16);
				if (ch === "\u3000") { // full-width space
					placeholderChar = "\u3000";
					token.style.border = 'dashed 1px #a0a0a0';
					token.title = "全角スペース";
				}
				token.innerHTML = placeholderChar;
				token.className = 'cm-invalidchar';
				token.setAttribute("aria-label", token.title);
				return token;
			},

		});
	var str = sessionStorage.getItem('txt');
	// editor.doc.setValue("from m5stack import *\rfrom m5ui import *\rfrom uiflow import *\rimport utime\rfor i in range(5):\r    print(i)\r    M5Led.on()\r    utime.sleep(0.5)\r    M5Led.off()\r    utime.sleep(0.5)\r"
	// );
	if (str) {
		editor.doc.setValue(str);
	}

	editor.on("change", function (instance, change) {
		console.log("ccc");
		var str = editor.doc.getValue();
		sessionStorage.setItem('txt', str);
	});
	const text = document.querySelector(".CodeMirror");
	text.style.fontSize = font_size + "px";
	document.getElementById("fontsize").innerHTML = "文字サイズ " + font_size + "px";
});
// ---------------------------------------------------------------
async function onConnectButtonClick() {
	var connect_button = document.getElementById('connectButton');
	//切断時にクリックされた場合
	if (connectionStatus == false) {
		try {
			port = await navigator.serial.requestPort();
			await port.open({ baudRate: 115200 });

			//errorになったらcatch (error)に飛ぶ
			connectionStatus = true;
			console.log("connected")
			connect_button.innerHTML = "切断"
			connect_button.style.backgroundColor = "#0aafff"
			reader = port.readable.getReader();

			while (connectionStatus && port.readable) {
				try {
					while (true) {
						const { value, done } = await reader.read();
						if (done) {
							// addSerial("Canceled\n");
							break;
						}
						const inputValue = new TextDecoder().decode(value);
						// if(inputValue=="\r\n>>> " || inputValue==">>> ") {
						// 	document.getElementById('run').style.backgroundColor = "#eeeeee";				
						// }
						addSerial(inputValue);
					}
				} catch (error) {
					addSerial("Error: Read" + error + "\n");
				}
			}
		} catch (error) {
			addSerial("Error: Open" + error + "\n");
		}
	}

	//接続時にクリックされた場合、もしくはconnectionStatus == trueの時に突然引き抜かれて上のループを抜けて流れてきた場合
	if (connectionStatus == true) {
		connectionStatus = false;

		//readerのリリース(writerは都度リリースしている)
		reader.cancel();//突然引き抜かれたケースではエラーになる
		reader.releaseLock();
		await port.close()
		console.log("disconnected")
		document.getElementById('connectButton').innerHTML = "接続"
		connect_button.style.backgroundColor = "#eeeeee"
	}
}

// ---------------------------------------------------------------
function addSerial(msg) {
	var textarea = document.getElementById('outputArea');
	textarea.value += msg;
	textarea.scrollTop = textarea.scrollHeight;
}

// // ---------------------------------------------------------------
// async function sendSerial()
// {
// 	var text = document.getElementById('sendInput').value;
// 	document.getElementById('sendInput').value = "";

// 	const encoder = new TextEncoder();
// 	const writer = port.writable.getWriter();
// 	await writer.write(encoder.encode(text + "\r\n"));
// 	writer.releaseLock();
// }

// ---------------------------------------------------------------
async function run() {
	if (connectionStatus) {
		const writer = port.writable.getWriter();

		const encoder = new TextEncoder();
		await writer.write(encoder.encode("\x03"));

		await writer.write(encoder.encode("from neopixel import Neopixel\r"));
		await writer.write(encoder.encode("np=Neopixel(12,0,0,'GRB')\r"));
		await writer.write(encoder.encode("np.clear()\r\r"));
		await writer.write(encoder.encode("np.show()\r"));
		await writer.write(encoder.encode("from machine import Pin\r"));
		await writer.write(encoder.encode("np.clear()\r\r"));
		await writer.write(encoder.encode("np.show()\r"));
		await writer.write(encoder.encode("from machine import Pin\r"));
		await writer.write(encoder.encode("Pin(4,Pin.OUT).off()\r"));
		await writer.write(encoder.encode("Pin(2,Pin.OUT).off()\r"));
		await writer.write(encoder.encode("Pin(1,Pin.OUT).off()\r"));
		await writer.write(encoder.encode("\x03"));

		var str = editor.doc.getValue();
		str = str.replace(/\t/g, "    ");
		str = "\x05" + str + "\x04";
		await writer.write(encoder.encode(str));

		writer.releaseLock();
		// document.getElementById('run').style.backgroundColor = "#0aafff";
	}
}
// ---------------------------------------------------------------
async function stop() {
	if (connectionStatus) {
		const writer = port.writable.getWriter();
		const encoder = new TextEncoder();
		await writer.write(encoder.encode("\x03"));

		await writer.write(encoder.encode("from neopixel import Neopixel\r"));
		await writer.write(encoder.encode("np=Neopixel(12,0,0,'GRB')\r"));
		await writer.write(encoder.encode("np.clear()\r"));
		await writer.write(encoder.encode("np.show()\r"));
		await writer.write(encoder.encode("np.clear()\r"));
		await writer.write(encoder.encode("np.show()\r"));
		await writer.write(encoder.encode("from machine import Pin\r"));
		await writer.write(encoder.encode("from machine import Pin\r"));
		await writer.write(encoder.encode("Pin(4,Pin.OUT).off()\r"));
		await writer.write(encoder.encode("Pin(2,Pin.OUT).off()\r"));
		await writer.write(encoder.encode("Pin(1,Pin.OUT).off()\r"));
		writer.releaseLock();
	}
}
// ---------------------------------------------------------------
async function saveTextAsFile() {
	try {
		var textToWrite = editor.doc.getValue();
		textToWrite = textToWrite.replace(/\r/g, "\r\n");
		var textFileAsBlob = new Blob([textToWrite], {
			type: "text/x-python;charset=utf-8"
		});

		const options = {
			suggestedName: 'myfile.py',
			types: [
				{
					description: "Pythonファイル",
					accept: { "application/plain": [".py"] },
				},
			],
		};

		const fh = await window.showSaveFilePicker(options);

		// FileSystemWritableFileStream オブジェクトを取得
		const stream = await fh.createWritable();

		// テキストデータをファイルに書き込む
		await stream.write(textFileAsBlob);

		// ファイルを閉じる
		await stream.close();
	} catch (e) {
		console.log("File save canceled");
	}
	// var fileNameToSaveAs = "myfile.py";

	// var downloadLink = document.createElement("a");
	// downloadLink.download = fileNameToSaveAs;
	// downloadLink.innerHTML = "Download File";
	// if (window.webkitURL != null) {
	//   // Chrome allows the link to be clicked
	//   // without actually adding it to the DOM.
	//   downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
	// } else {
	//   // Firefox requires the link to be added to the DOM
	//   // before it can be clicked.
	//   downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
	//   downloadLink.onclick = destroyClickedElement;
	//   downloadLink.style.display = "none";
	//   document.body.appendChild(downloadLink);
	// }

	// downloadLink.click();
}
// ---------------------------------------------------------------
function localLoad(files) {
	if (files.length == 1) {
		document.title = escape(files[0].name);
		var reader = new FileReader();
		reader.onload = function (e) {
			var str = e.target.result;
			str = str.replace(/\n/g, "");
			editor.doc.setValue(str);
		};
		reader.readAsText(files[0]);
	}
}
// ---------------------------------------------------------------
function input_change() {
	console.log("ccc");
}
// ---------------------------------------------------------------
function terminal_clear() {
	document.getElementById('outputArea').value = "";
}
// ---------------------------------------------------------------
function fontsize(value) {
	const text = document.querySelector(".CodeMirror");
	font_size += value;
	if (font_size > 20) font_size = 20;
	if (font_size < 10) font_size = 10;
	text.style.fontSize = font_size + "px";
	document.getElementById("fontsize").innerHTML = "文字サイズ " + font_size + "px";
	editor.refresh();
}
// ---------------------------------------------------------------
async function save_main() {
	if (connectionStatus) {
		var result = window.confirm('マイコンに保存しますがいいですか？');
		if (result) {

			var str = editor.doc.getValue();
			const writer = port.writable.getWriter();
			str = str.replace(/\r/g, "\\n");
			str = str.replace(/\t/g, "    ");
			str = str.replace(/"/g, '\\"');
			str = str.replace(/'/g, "\\'");

			const encoder = new TextEncoder();
			await writer.write(encoder.encode("\x03import struct\r"));
			await writer.write(encoder.encode("f=open('main.py', 'w')\r"));
			// await writer.write(encoder.encode('f.write("'+str+'")\r'));
			await writer.write(encoder.encode("f.write('" + str + "')\r"));
			await writer.write(encoder.encode("f.close()\r"));
			// await writer.write(encoder.encode("\x04"));
			writer.releaseLock();
		}
	}
}
async function delete_main() {
	if (connectionStatus) {
		var result = window.confirm('マイコンのmain.pyを削除しますがいいですか？');
		if (result) {
			const writer = port.writable.getWriter();

			const encoder = new TextEncoder();
			await writer.write(encoder.encode("\x03import os; os.listdir()\r"));
			await writer.write(encoder.encode("os.remove('main.py')\r"));
			await writer.write(encoder.encode("os.listdir()\r"));

			writer.releaseLock();
		}
	}
}
async function file_list() {
	if (connectionStatus) {
		const writer = port.writable.getWriter();

		const encoder = new TextEncoder();
		await writer.write(encoder.encode("\x03import os; os.listdir()\r"));

		writer.releaseLock();
	}
}
function filebutton_disp() {
	document.getElementById("save_main").classList.toggle("is-hidden");
	document.getElementById("delete_main").classList.toggle("is-hidden");
	document.getElementById("file_list").classList.toggle("is-hidden");
}
function text_open() {
	// window.open("Video.webm","text","width=1000,height=760,menubar=1")
	// window.open("hikona00.mp4","text","width=1000,height=760,toolbar=yes,menubar=yes,scrollbars=yes")
	window.open("2025工学基礎演習テキスト.pdf", "_blank", "width=1000,height=760,toolbar=yes,menubar=yes,scrollbars=yes")

}









