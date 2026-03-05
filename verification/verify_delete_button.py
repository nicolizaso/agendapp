from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173/")

        # Open Create task modal (desktop fab or mobile plus)
        page.click("button:has(.lucide-plus)")

        # Create Task
        page.fill("input[placeholder='Ej: Entrenar pierna']", "Test Task")
        page.click("button:has-text('Crear Tarea')")

        # Wait for task to be added
        page.wait_for_selector("text=Test Task")

        # Click edit on the newly created task
        page.locator("button:has(.lucide-pencil)").first.click()

        # Wait for Edit modal to be visible
        expect(page.locator("text=Editar Tarea")).to_be_visible()

        # Verification: we should see the trash button in the footer
        expect(page.locator("button:has-text('Eliminar')")).to_be_visible()

        # Screenshot to verify the Delete button is visible inside the modal
        page.screenshot(path="verification/modal_with_delete.png")

        browser.close()

if __name__ == "__main__":
    run()
