import time
from playwright.sync_api import sync_playwright

def test_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173")

        # Wait for the app to load
        page.wait_for_timeout(2000)

        categories = ['Casa', 'Salud', 'Trabajo']

        # Add 3 test items
        for i, category in enumerate(categories):
            # Click the main create FAB (hidden md:flex) or BottomNav central button
            page.locator("button:has(svg.lucide-plus)").last.click()
            page.wait_for_timeout(500)

            page.fill("input[placeholder='Ej: Entrenar pierna']", "Test task " + category)

            # Select Category
            page.click("button:has-text('Sin categoría')")
            page.wait_for_timeout(500)
            page.click(f"button:has-text('{category}')")

            page.click("button:has-text('Crear Tarea')")
            page.wait_for_timeout(1000)

        # Expand Categories - handle it by finding the button inside the TodaySection
        # the button has the category name and an accordion chevron
        for category in categories:
            # They have a span with the category name
            btn = page.locator(f"button:has(span:has-text('{category}'))").first
            if btn.is_visible():
                btn.click()
            page.wait_for_timeout(500)

        # Initial screenshot showing them active
        page.screenshot(path="verification/dashboard_expanded.png")

        # Complete the Salud task. The button has a check icon inside it
        page.locator("text='Test task Salud' >> xpath=ancestor::div[contains(@class, 'flex items-center')]//button[contains(@class, 'bg-red-600')]").click()
        page.wait_for_timeout(1500)

        # Take screenshot of the result showing order
        page.screenshot(path="verification/dashboard_sort_result.png")

        browser.close()

if __name__ == "__main__":
    test_dashboard()
