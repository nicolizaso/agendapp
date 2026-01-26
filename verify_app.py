from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

        # 1. Load Page
        print("Navigating to app...")
        page.goto("http://localhost:5173")

        # Check content
        time.sleep(2)
        # print("Page content:")
        # print(page.content())

        # 2. Verify Title and Headers (Localization)
        print("Verifying localization...")
        try:
            # Check for header
            page.wait_for_selector("text=La Vida de Pipa", timeout=10000)
            page.wait_for_selector("text=Gamifica tu existencia")

            # Check for Nav
            page.wait_for_selector("text=Mi Progreso")
            page.wait_for_selector("text=Misiones")
            page.wait_for_selector("text=Mercado")

            print("Localization verified.")
        except Exception as e:
            print(f"Localization check failed: {e}")
            page.screenshot(path="verification_fail_loc.png")
            browser.close()
            return

        # 3. Create a Task via FAB (Skipped for now to verify screenshot)
        # ...

        # 5. Take Screenshot
        print("Taking final screenshot...")
        # wait a bit for animations
        time.sleep(1)
        page.screenshot(path="verification_dashboard.png", full_page=True)
        print("Screenshot saved to verification_dashboard.png")

        browser.close()

if __name__ == "__main__":
    run()
