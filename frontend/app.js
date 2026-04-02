const API_BASE = "http://localhost:8000";

const form = document.getElementById("calc-form");
const operandAInput = document.getElementById("operand_a");
const operandBInput = document.getElementById("operand_b");
const operationSelect = document.getElementById("operation");
const calcBtn = document.getElementById("calc-btn");
const resultBox = document.getElementById("result-box");

/**
 * Validate inputs on the client side before sending to the API.
 * Returns an error message string if invalid, or null if valid.
 */
function validate(a, b) {
  if (a.trim() === "" || b.trim() === "") {
    return "Both number fields are required.";
  }
  if (isNaN(Number(a)) || isNaN(Number(b))) {
    return "Both inputs must be valid numbers.";
  }
  return null;
}

/**
 * Normalize the API error detail into a single string.
 * The detail may be a string or an array of validation error objects.
 */
function extractErrorMessage(detail) {
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item.msg === "string") return item.msg;
        return JSON.stringify(item);
      })
      .join(" ");
  }
  return "An unexpected error occurred.";
}

/** Render a success result in the result box. */
function showResult(value) {
  resultBox.className = "result-box success";
  resultBox.innerHTML = `
    <div class="result-label">Result</div>
    <div class="result-value">${value}</div>
  `;
}

/** Render an error message in the result box. */
function showError(message) {
  resultBox.className = "result-box error";
  resultBox.innerHTML = `
    <div class="error-label">Error</div>
    <div class="error-message">${message}</div>
  `;
}

/** Clear the result box. */
function clearResult() {
  resultBox.className = "result-box";
  resultBox.innerHTML = "";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearResult();

  const operandA = operandAInput.value;
  const operandB = operandBInput.value;
  const operation = operationSelect.value;

  // Client-side validation
  const validationError = validate(operandA, operandB);
  if (validationError) {
    showError(validationError);
    return;
  }

  calcBtn.disabled = true;
  calcBtn.textContent = "Calculating...";

  try {
    const response = await fetch(`${API_BASE}/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operand_a: Number(operandA),
        operand_b: Number(operandB),
        operation: operation,
      }),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("Invalid response from server.");
    }

    if (!response.ok) {
      const detail = data && data.detail !== undefined ? data.detail : null;
      const message = detail
        ? extractErrorMessage(detail)
        : `Request failed with status ${response.status}.`;
      showError(message);
      return;
    }

    if (data && data.result !== undefined) {
      showResult(data.result);
    } else {
      showError("Unexpected response format from server.");
    }
  } catch (err) {
    if (err instanceof TypeError && err.message.toLowerCase().includes("fetch")) {
      showError(
        "Could not connect to the server. Please ensure the backend is running."
      );
    } else {
      showError(err.message || "An unexpected error occurred.");
    }
  } finally {
    calcBtn.disabled = false;
    calcBtn.textContent = "Calculate";
  }
});
