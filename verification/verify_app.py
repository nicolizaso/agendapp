from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate
        print("Navigating to app...")
        page.goto("http://localhost:5173")
        page.wait_for_load_state("networkidle")

        # 1. Check Typography
        print("Checking Typography...")
        font_family = page.eval_on_selector("h1", "el => getComputedStyle(el).fontFamily")
        print(f"Heading Font: {font_family}")

        # 2. Check Calendar Modal
        print("Checking Calendar Modal...")
        page.locator(".grid-cols-7 .aspect-square").first.click()
        time.sleep(1)

        create_btn = page.get_by_role("button", name="Crear Tarea")
        if create_btn.is_visible():
            print("Calendar Modal 'Crear Tarea' button found.")
        else:
            print("Calendar Modal 'Crear Tarea' button NOT found.")

        page.get_by_label("Close").click()
        time.sleep(0.5)

        # 3. Create a task (Defaults to Today)
        print("Creating Task...")
        page.locator("button.fixed.bottom-6.right-6").click() # FAB
        time.sleep(0.5)

        page.fill("input[placeholder='Ej: Entrenar pierna']", "Test Task Verification")
        page.click("button[type='submit']")
        time.sleep(1)

        # Check Dashboard (Default view)
        print("Checking Dashboard for task...")
        # Locate text
        task_text = page.get_by_text("Test Task Verification")
        if task_text.count() > 0:
             print("Task found in Dashboard.")
             # Hover to show buttons
             task_text.first.hover()
             time.sleep(0.5)
             page.screenshot(path="verification/verification.png")
             print("Screenshot taken.")
        else:
             print("Task NOT found in Dashboard.")
             page.screenshot(path="verification/failed.png")

        browser.close()

if __name__ == "__main__":
    run()
