const { spawn } = require("child_process");
const path = require("path");

const PYTHON_EXECUTABLE = process.platform === "win32" ? "py" : "python3";
const PYTHON_ARGS = process.platform === "win32" ? ["-3.12"] : [];
const RUNNER_SCRIPT = path.join(__dirname, "..", "..", "python", "runner.py");

/**
 * Executes a python function via runner.py
 * @param {string} funcName Name of the function in runner.py to execute
 * @param {object} args Arguments to pass as JSON
 * @returns {Promise<any>}
 */
function runPython(funcName, args = {}) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(PYTHON_EXECUTABLE, [...PYTHON_ARGS, RUNNER_SCRIPT, funcName], { env: { ...process.env, PYTHONIOENCODING: "utf-8" } });

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
        console.error(`[Python Error ${funcName}] Code: ${code}`);
        console.error(`STDERR: ${errorString}`);
        console.error(`STDOUT: ${dataString}`);
        return reject(new Error(`Python process exited with code ${code}: ${errorString}`));
      }

      try {
        const result = JSON.parse(dataString);
        if (result.error) {
          console.error(`[Python Logic Error ${funcName}]`, result.error, result.traceback);
          return reject(new Error(result.error));
        }
        resolve(result);
      } catch (e) {
        console.error(`[JSON Parse Error ${funcName}]`, e.message);
        console.error("Raw Output:", dataString);
        reject(new Error("Failed to parse Python output as JSON"));
      }
    });

    // Write JSON to stdin
    pythonProcess.stdin.write(JSON.stringify(args));
    pythonProcess.stdin.end();
  });
}

module.exports = { runPython };
