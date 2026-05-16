'use strict';

// ===== State =====
const state = {
  current: '0',      // string currently being built
  previous: null,    // string of the previous operand
  operator: null,    // '+' | '-' | '*' | '/' | '%'
  shouldReset: false // true after = or operator press; next digit replaces current
};

// ===== DOM refs =====
const expressionEl = document.getElementById('expression');
const resultEl     = document.getElementById('result');

// ===== Helpers =====

/**
 * Format a numeric result to avoid floating-point noise while preserving
 * significant digits. Returns the string "Error" unchanged.
 */
function formatNumber(value) {
  if (value === 'Error') return 'Error';
  const n = parseFloat(value);
  if (isNaN(n)) return 'Error';
  // toPrecision(10) eliminates float noise; parseFloat strips trailing zeros
  return parseFloat(n.toPrecision(10)).toString();
}

/** Adjust result font size based on string length. */
function adjustFontSize(text) {
  const len = text.length;
  resultEl.classList.remove('large', 'medium', 'small');
  if (len <= 12)      resultEl.classList.add('large');
  else if (len <= 18) resultEl.classList.add('medium');
  else                resultEl.classList.add('small');
}

/** Render state to DOM. */
function render() {
  resultEl.textContent = state.current;
  adjustFontSize(state.current);

  if (state.operator && state.previous !== null && state.current !== 'Error') {
    expressionEl.textContent = `${state.previous} ${state.operator}`;
  } else {
    expressionEl.textContent = '';
  }
}

// ===== Core logic =====

/** Perform the arithmetic operation; returns result string. */
function calculate(prev, op, curr) {
  const a = parseFloat(prev);
  const b = parseFloat(curr);
  if (isNaN(a) || isNaN(b)) return 'Error';

  let result;
  switch (op) {
    case '+': result = a + b; break;
    case '-': result = a - b; break;
    case '*': result = a * b; break;
    case '/':
      if (b === 0) return 'Error';
      result = a / b;
      break;
    case '%': result = a % b; break;
    default:  return curr;
  }
  return formatNumber(result.toString());
}

/** User pressed a digit button. */
function inputDigit(digit) {
  // Recover from error on next digit
  if (state.current === 'Error') {
    clearAll();
  }

  if (state.shouldReset) {
    // Start fresh operand after operator or equals
    state.current = digit === '0' ? '0' : digit;
    state.shouldReset = false;
  } else {
    if (state.current === '0') {
      // Replace leading zero (avoid "007")
      state.current = digit === '0' ? '0' : digit;
    } else {
      // Limit display length to prevent overflow
      if (state.current.replace('-', '').replace('.', '').length >= 15) return;
      state.current += digit;
    }
  }
  render();
}

/** User pressed the decimal point. */
function inputDecimal() {
  if (state.current === 'Error') {
    clearAll();
    state.current = '0.';
    render();
    return;
  }

  if (state.shouldReset) {
    state.current = '0.';
    state.shouldReset = false;
    render();
    return;
  }

  if (!state.current.includes('.')) {
    state.current += '.';
    render();
  }
}

/** User pressed an operator button. */
function inputOperator(op) {
  if (state.current === 'Error') {
    clearAll();
    return;
  }

  // If we already have a pending operation and the user hasn't entered a new
  // operand yet, just swap the operator (operator chaining with no new input).
  if (state.operator !== null && state.shouldReset) {
    state.operator = op;
    // Update expression line immediately
    expressionEl.textContent = `${state.previous} ${op}`;
    highlightActiveOp(op);
    return;
  }

  // If there is a pending operation with a second operand entered, evaluate first.
  if (state.operator !== null && state.previous !== null && !state.shouldReset) {
    const result = calculate(state.previous, state.operator, state.current);
    state.current = result;
    // Show the full chain in expression before storing
    expressionEl.textContent = `${state.previous} ${state.operator} ${state.current} =`;
    state.previous = result;
  } else {
    // No pending operator — store current as previous
    state.previous = state.current;
  }

  state.operator   = op;
  state.shouldReset = true;

  render();
  highlightActiveOp(op);
}

/** User pressed equals. */
function pressEquals() {
  if (state.current === 'Error') {
    clearAll();
    return;
  }

  // = with no operator: just show the current value
  if (state.operator === null || state.previous === null) {
    expressionEl.textContent = `${state.current} =`;
    state.shouldReset = true;
    resultEl.textContent = state.current;
    adjustFontSize(state.current);
    return;
  }

  const prev = state.previous;
  const op   = state.operator;
  const curr = state.current;
  const result = calculate(prev, op, curr);

  // Show full expression in expression line
  expressionEl.textContent = `${prev} ${op} ${curr} =`;

  state.current    = result;
  state.previous   = null;
  state.operator   = null;
  state.shouldReset = true;

  resultEl.textContent = state.current;
  adjustFontSize(state.current);
  clearActiveOp();
}

/** Clear all state. */
function clearAll() {
  state.current    = '0';
  state.previous   = null;
  state.operator   = null;
  state.shouldReset = false;
  expressionEl.textContent = '';
  resultEl.textContent = '0';
  resultEl.classList.remove('medium', 'small');
  resultEl.classList.add('large');
  clearActiveOp();
}

/** Delete last character; clear if only one char remains. */
function backspace() {
  if (state.current === 'Error') {
    clearAll();
    return;
  }
  if (state.shouldReset) {
    state.shouldReset = false;
    state.current = '0';
    state.previous = '';
    state.operator = null;
    clearActiveOp();
    render();
    return;
  }

  if (state.current.length <= 1 || (state.current.length === 2 && state.current.startsWith('-'))) {
    state.current = '0';
  } else {
    state.current = state.current.slice(0, -1);
    // Clean up dangling decimal: "3." becomes "3"
    // We intentionally allow "3." during editing, but if they DEL past it, remove
  }
  render();
}

// ===== Operator highlight =====

function highlightActiveOp(op) {
  clearActiveOp();
  document.querySelectorAll('.btn-operator').forEach(btn => {
    if (btn.dataset.value === op) btn.classList.add('active-op');
  });
}

function clearActiveOp() {
  document.querySelectorAll('.btn-operator').forEach(btn => btn.classList.remove('active-op'));
}

// ===== Dispatch (click) =====

document.querySelector('.buttons').addEventListener('click', e => {
  const btn = e.target.closest('.btn');
  if (!btn) return;

  const { action, value } = btn.dataset;

  switch (action) {
    case 'digit':     inputDigit(value);    break;
    case 'decimal':   inputDecimal();       break;
    case 'operator':  inputOperator(value); break;
    case 'equals':    pressEquals();        break;
    case 'clear':     clearAll();           break;
    case 'backspace': backspace();          break;
  }

  // Brief visual press feedback
  btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 100);
});

// ===== Keyboard support =====

document.addEventListener('keydown', e => {
  // Ignore modifier combos (Ctrl+C, etc.)
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const key = e.key;

  let handled = true;

  if (key >= '0' && key <= '9') {
    inputDigit(key);
    flashKey(`[data-action="digit"][data-value="${key}"]`);
  } else if (key === '.') {
    inputDecimal();
    flashKey('[data-action="decimal"]');
  } else if (['+', '-', '*', '/', '%'].includes(key)) {
    inputOperator(key);
    flashKey(`[data-action="operator"][data-value="${key}"]`);
  } else if (key === 'Enter' || key === '=') {
    pressEquals();
    flashKey('[data-action="equals"]');
  } else if (key === 'Backspace') {
    backspace();
    flashKey('[data-action="backspace"]');
  } else if (key === 'Escape' || key === 'Delete') {
    clearAll();
    flashKey('[data-action="clear"]');
  } else {
    handled = false;
  }

  if (handled) e.preventDefault();
});

/** Briefly apply pressed class to a button to give keyboard feedback. */
function flashKey(selector) {
  const btn = document.querySelector(selector);
  if (!btn) return;
  btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 100);
}

// ===== Init =====
clearAll();
