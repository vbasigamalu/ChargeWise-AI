const { spawn } = require("child_process");
const path = require("path");

const PYTHON_EXECUTABLE = process.platform === "win32" ? "py" : "python3";
const PYTHON_ARGS = process.platform === "win32" ? ["-3.12"] : [];
const RUNNER_SCRIPT = path.join(__dirname, "..", "..", "python", "runner.py");

const { mockData } = require("./mockData");

/**
 * Executes a python function via runner.py
 * @param {string} funcName Name of the function in runner.py to execute
 * @param {object} args Arguments to pass as JSON
 * @returns {Promise<any>}
 */
function runPython(funcName, args = {}) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(PYTHON_EXECUTABLE, [...PYTHON_ARGS, RUNNER_SCRIPT, funcName], { 
      env: { ...process.env, PYTHONIOENCODING: "utf-8" } 
    });

    let dataString = "";
    let errorString = "";

    pythonProcess.stdout.on("data", (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorString += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.warn(`[Python Bridge Fallback] Function ${funcName} failed. Serving mock data.`);
        if (mockData[funcName]) {
          return resolve(mockData[funcName](args));
        }
        return reject(new Error(`Python process exited with code ${code}: ${errorString}`));
      }

      try {
        const result = JSON.parse(dataString);
        if (result.error) {
          console.warn(`[Python Logic Fallback] ${funcName} errored. Serving mock data.`);
          if (mockData[funcName]) {
            return resolve(mockData[funcName](args));
          }
          return reject(new Error(result.error));
        }
        resolve(result);
      } catch (e) {
        console.warn(`[JSON Parse Fallback] ${funcName} parse error. Serving mock data.`);
        if (mockData[funcName]) {
          return resolve(mockData[funcName](args));
        }
        reject(new Error("Failed to parse Python output as JSON"));
      }
    });

    // Handle process spawn errors directly
    pythonProcess.on("error", (err) => {
      console.warn(`[Spawn Fallback] Could not start Python for ${funcName}. Serving mock data.`);
      if (mockData[funcName]) {
        return resolve(mockData[funcName](args));
      }
      reject(err);
    });

    // Write JSON to stdin
    pythonProcess.stdin.write(JSON.stringify(args));
    pythonProcess.stdin.end();
  });
}

module.exports = { runPython };
