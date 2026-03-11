from playwright.sync_api import sync_playwright, expect
import time
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Wait for the dev server to be ready
        print("Navigating to local app...")
        page.goto("http://localhost:5173", timeout=10000)
        page.wait_for_load_state("networkidle")

        print("Clicking FAB (+)...")
        page.evaluate("""() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const fab = buttons.find(b => b.className.includes('rounded-full') && b.className.includes('shadow'));
            if(fab) fab.click();
        }""")

        title_input = page.get_by_placeholder("Ej: Entrenar pierna")
        expect(title_input).to_be_visible(timeout=5000)
        title_input.fill("Test Task 1")

        page.get_by_role("button", name="Crear Tarea").click()

        # Wait for modal to close
        expect(title_input).to_be_hidden()
        print("Task created.")

        time.sleep(1)

        print("Opening the task list accordion...")
        # Since it's collapsed under "Otros (1)", we need to click "Otros"
        page.get_by_text("Otros").first.click()

        time.sleep(1)

        print("Editing the task...")
        # Now the task should be visible
        task_element = page.locator("h3:has-text('Test Task 1')").first
        expect(task_element).to_be_visible(timeout=5000)

        # We need to click the pencil icon next to the task.
        # It's an icon button, probably with a specific class or SVG.
        # It's right next to the red complete button.
        # We can locate the task container and then find the edit button.
        task_container = task_element.locator("xpath=../../..")
        edit_button = task_container.locator("button").nth(1) # second button is edit usually
        edit_button.click()

        # Verify edit modal opens
        expect(page.get_by_text("Editar Tarea", exact=True)).to_be_visible(timeout=5000)

        edit_title_input = page.get_by_placeholder("Ej: Entrenar pierna")
        edit_title_input.fill("Test Task 1 - Edited")

        page.get_by_role("button", name="Guardar Cambios").click()

        # Wait for modal to close
        expect(page.get_by_text("Editar Tarea", exact=True)).to_be_hidden()
        print("Task edited.")

        time.sleep(1)

        print("Verifying no duplicates exist...")
        # The list might be collapsed or still open. Make sure it's open
        if page.get_by_text("Otros").count() > 0:
            if not page.locator("h3:has-text('Test Task 1 - Edited')").is_visible():
                page.get_by_text("Otros").first.click()
                time.sleep(1)

        expect(page.locator("h3:has-text('Test Task 1 - Edited')").first).to_be_visible()

        all_h3s = page.locator("h3").all_inner_texts()
        original_count = sum(1 for t in all_h3s if t == "Test Task 1")
        edited_count = sum(1 for t in all_h3s if t == "Test Task 1 - Edited")
        print(f"Original count: {original_count}, Edited count: {edited_count}")

        assert original_count == 0, f"Found duplicate original tasks: {original_count}"
        assert edited_count == 1, f"Expected 1 edited task, found {edited_count}"

        print("Verification successful - no duplicates found.")

        os.makedirs("/home/jules/verification", exist_ok=True)
        page.screenshot(path="/home/jules/verification/task_edit_success.png")
        print("Screenshot saved.")

    except Exception as e:
        print(f"Error during verification: {e}")
        os.makedirs("/home/jules/verification", exist_ok=True)
        page.screenshot(path="/home/jules/verification/error.png", full_page=True)
    finally:
        context.close()
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
