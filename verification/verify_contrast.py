from playwright.sync_api import sync_playwright
from datetime import datetime

def test_contrast():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173")

        # Wait for the app to load
        page.wait_for_timeout(2000)

        # Add a couple of tasks to today to ensure we have mini-labels
        categories = ['Trabajo', 'Salud']
        for category in categories:
            page.locator("button:has(svg.lucide-plus)").last.click()
            page.wait_for_timeout(500)
            page.fill("input[placeholder='Ej: Entrenar pierna']", f"Test {category}")
            page.click("button:has-text('Sin categoría')")
            page.wait_for_timeout(500)
            page.click(f"button:has-text('{category}')")
            page.click("button:has-text('Crear Tarea')")
            page.wait_for_timeout(1000)

        # Find today's date container in the calendar grid
        # It should have the text of the current day.
        today = datetime.now()
        day_str = str(today.day)

        # Click on today to make sure it's selected
        # The calendar grid is a grid of div elements containing the day number in a span.
        day_span = page.locator(f"span:text-is('{day_str}')").first
        day_span.click()
        page.wait_for_timeout(500)

        # Take screenshot of the calendar area specifically
        # Let's find the calendar section header ("Noviembre 2024" etc) and get its parent
        calendar_section = page.locator("h2.font-heading").first.locator("..").locator("..")
        calendar_section.screenshot(path="verification/calendar_contrast.png")

        # Also take a full page screenshot
        page.screenshot(path="verification/full_dashboard.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    test_contrast()
