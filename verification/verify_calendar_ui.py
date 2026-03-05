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

        # Take screenshot of the calendar
        page.screenshot(path="verification/calendar_ui.png")

        browser.close()

if __name__ == "__main__":
    test_dashboard()
