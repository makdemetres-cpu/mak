import sys
import threading
import webbrowser

import uvicorn

from .config import load_settings
from .safety import SafetyError


def main() -> int:
    settings = load_settings()
    try:
        from .main import create_app

        app = create_app(settings)
    except SafetyError as err:
        print("\nThe app did not start, to keep you safe:\n")
        for problem in err.problems:
            print(f"  - {problem}")
        print("\nFix the .env file in the app folder and start again.\n")
        return 1

    url = f"http://127.0.0.1:{settings.port}"
    print(f"\nCrypto Paper Trader is running at {url}")
    print("Only this computer can open it. Close this window to stop the app.\n")
    if "--no-browser" not in sys.argv:
        threading.Timer(1.5, lambda: webbrowser.open(url)).start()
    uvicorn.run(app, host="127.0.0.1", port=settings.port, log_level="warning")
    return 0


if __name__ == "__main__":
    sys.exit(main())
