from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Navigate to the app
        page.goto("http://localhost:5173")

        # Wait for either Today's Agenda or Dashboard
        page.wait_for_selector("text=Agenda")
        page.screenshot(path="verification/issue_verification.png")

        browser.close()

if __name__ == "__main__":
    run()
