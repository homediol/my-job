/**
 * Status Reporter — structured STEP-based status output for the bot.
 *
 * Produces clean, human-readable, real-time status updates in the format:
 *
 * STEP {number}
 * Action: <what bot is doing>
 * Status: <running / success / failed / waiting>
 * Details: <short explanation>
 *
 * Uses process.stdout.write() directly (same as logger.js) to avoid
 * buffering interleaving between console.log and process.stdout.write calls.
 */

function writeLine(line = '') {
  process.stdout.write(line + '\n');
}

let _stepCounter = 0;

/**
 * Get the next step number, auto-incrementing.
 * @returns {number}
 */
export function nextStep() {
  _stepCounter += 1;
  return _stepCounter;
}

/**
 * Reset the step counter (useful for new runs).
 */
export function resetSteps() {
  _stepCounter = 0;
}

/**
 * Get the current step number without incrementing.
 * @returns {number}
 */
export function currentStep() {
  return _stepCounter;
}

/**
 * Print a structured step status message to stdout.
 *
 * @param {object} opts
 * @param {number}  [opts.step]        Step number; auto-increments if omitted
 * @param {string}  opts.action        Short action label
 * @param {string}  opts.status        running | success | failed | waiting
 * @param {string}  opts.details       Short explanation
 * @param {boolean} [opts.divider]     Print a divider line after (default true for non-running)
 * @param {boolean} [opts.repeatStep]  Re-use the previous step number instead of incrementing
 */
export function reportStep({ step, action, status, details, divider, repeatStep }) {
  const stepNum = step || (repeatStep ? currentStep() : nextStep());
  const showDivider = divider !== undefined ? divider : (status !== 'running');

  writeLine('');
  writeLine(`STEP ${stepNum}`);
  writeLine(`Action: ${action}`);
  writeLine(`Status: ${status}`);
  writeLine(`Details: ${details}`);
  if (showDivider) {
    writeLine('');
  }
}

/**
 * Print a simple info line outside the STEP format (for monitor ticks, etc.)
 */
export function printInfo(message) {
  writeLine(`  ℹ ${message}`);
}

/**
 * Print an error line outside the STEP format.
 */
export function printError(message) {
  writeLine(`  ✖ ${message}`);
}

/**
 * Print a success line outside the STEP format.
 */
export function printSuccess(message) {
  writeLine(`  ✔ ${message}`);
}

