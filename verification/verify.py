from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to app...")
            page.goto("http://localhost:5173")
            # Wait for the title to appear
            print("Waiting for title...")
            page.wait_for_selector("text=La Vida de Pipa", timeout=10000)

            # Take a screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification/verification.png")
            print("Screenshot taken successfully.")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app()
