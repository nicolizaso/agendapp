import time
from playwright.sync_api import sync_playwright

def verify_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to app
        try:
            page.goto("http://localhost:5173")

            # Wait for content to load
            page.wait_for_selector("h1", timeout=10000)

            # Check title
            title = page.locator("h1").text_content()
            print(f"Title: {title}")

            # Check for Agenda de Hoy
            agenda = page.locator("text=Agenda de Hoy")
            if agenda.count() > 0:
                print("Agenda de Hoy found")
            else:
                print("Agenda de Hoy NOT found")

            # Check for Shop (should not exist)
            shop = page.locator("text=Mercado")
            if shop.count() == 0:
                print("Mercado NOT found (Good)")
            else:
                print("Mercado found (Bad)")

            # Take screenshot of Dashboard
            page.screenshot(path="verification_dashboard.png", full_page=True)

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification_error.png")

        browser.close()

if __name__ == "__main__":
    verify_dashboard()
