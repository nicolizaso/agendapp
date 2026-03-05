import datetime
from playwright.sync_api import sync_playwright, expect

def test_grid_layout():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a context with timezone and locale
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        page.goto("http://localhost:5173")
        page.wait_for_selector("text=Agenda de Hoy")

        # Click the "+" to add tasks inside Agenda de Hoy
        page.locator("h3:has-text('Agenda de Hoy') ~ button").click()

        # There should be a create task modal open
        page.wait_for_selector("text=Nueva Tarea")

        # We don't even need categories to be different to test grid layout, we can just make 3 tasks of "Otros" (the default)

        # Fill first task
        page.locator("input[type='text']").first.fill("Task 1 Casa")
        page.locator("button[type='submit']").click()
        page.wait_for_timeout(500)

        # Fill second task
        page.locator("h3:has-text('Agenda de Hoy') ~ button").click()
        page.wait_for_selector("text=Nueva Tarea")
        page.locator("input[type='text']").first.fill("Task 2 Gym")
        page.locator("button[type='submit']").click()
        page.wait_for_timeout(500)

        # Fill third task
        page.locator("h3:has-text('Agenda de Hoy') ~ button").click()
        page.wait_for_selector("text=Nueva Tarea")
        page.locator("input[type='text']").first.fill("Task 3 Trabajo with very long text that might overflow and completely break layout")
        page.locator("button[type='submit']").click()
        page.wait_for_timeout(500)

        # Take screenshot of the collapsed categories
        page.screenshot(path="verification/grid_collapsed_tasks.png")

        # Click Casa to expand it
        # Try finding the Casa button specifically in the TodaySection
        page.locator("button:has-text('Otros')").first.click()
        page.wait_for_timeout(500)

        page.screenshot(path="verification/grid_expanded_tasks.png")

        context.close()
        browser.close()

if __name__ == "__main__":
    test_grid_layout()
