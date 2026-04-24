let wasmExports;

async function loadWasm() {
  try {
    const wasmModule = await fetch(chrome.runtime.getURL('engine.wasm'));
    const wasmInstance = await WebAssembly.instantiate(await wasmModule.arrayBuffer());
    wasmExports = wasmInstance.exports;
  } catch (error) {
    console.error("Failed to load Wasm module:", error);
  }
}

loadWasm();

function processKeyWithWasm(key) {
  if (wasmExports && wasmExports.process_key) {
    // This is a placeholder for how you might interact with your Wasm module.
    // You'll need to adapt this based on the actual functions in your engine.wasm.
    // For example, you might need to manage memory for string passing.
    console.log(`Sending key '${key}' to Wasm.`);
    // const result = wasmExports.process_key(key.charCodeAt(0)); 
    // console.log(`Wasm returned: ${result}`);
  }
}

chrome.input.ime.onKeyEvent.addListener(
  (engineID, keyData) => {
    console.log('Key event:', keyData);
    if (keyData.type === 'keydown') {
      processKeyWithWasm(keyData.key);
    }
    return false;
  }
);
