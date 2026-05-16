def add(a: float, b: float) -> float:
    return a + b


def subtract(a: float, b: float) -> float:
    return a - b


def multiply(a: float, b: float) -> float:
    return a * b


def divide(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("Division by zero is not allowed.")
    return a / b


def calculate(operation: str, a: float, b: float) -> float:
    operations = {
        "add": add,
        "subtract": subtract,
        "multiply": multiply,
        "divide": divide,
    }
    if operation not in operations:
        raise ValueError(f"Unknown operation: {operation}")
    return operations[operation](a, b)
