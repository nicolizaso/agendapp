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

        # Click on the central create button in BottomNav
        # Wait, bottom nav is hidden on md viewport. Since width is 1280, the FAB is used.
        # Let's inspect the page content to find the button
        page.screenshot(path="verification/dashboard_before_click.png")

        # Now click the add task button (plus icon)
        # It's a button with an SVG containing the plus path
        fab = page.locator("button.fixed.bottom-6.right-6")
        fab.click()

        page.wait_for_selector("text=Nueva Tarea")

        # Toggle recurrence
        page.locator('input#recurrenceToggle').click()

        time.sleep(1) # wait for animation
        page.screenshot(path="verification/recurrence_end_date.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    run()
