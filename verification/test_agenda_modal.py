from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:5173")
        page.wait_for_selector("text=Pipa's Journal", timeout=10000)

        # Click FAB
        page.locator("button.fixed.bottom-6.right-6").click()

        # Fill title
        page.locator("input[placeholder='Ej: Entrenar pierna']").fill("Test Task for Agenda Modal")

        # Click create button
        page.locator("button", has_text="Crear Tarea").click()

        page.wait_for_timeout(1000)

        # Open Agenda Modal
        agenda_btn = page.locator("button:has(svg.lucide-clipboard-list)").first
        agenda_btn.click()

        # Wait for the modal title to confirm it's open
        page.wait_for_selector("text=Todos los Eventos")
        expect(page.locator("text=Todos los Eventos")).to_be_visible()

        # Our newly created task should be here
        expect(page.locator("text=Test Task for Agenda Modal")).to_be_visible()

        # Let's take a screenshot of the general modal
        page.screenshot(path="verification/agenda_modal.png")

        # Click the checkbox for our task
        page.locator("input[type='checkbox']").first.click()

        # Verify the footer has appeared
        expect(page.locator("button:has-text('Eliminar Seleccionadas')")).to_be_visible()

        # Screenshot of selected state
        page.screenshot(path="verification/agenda_modal_selected.png")

        # Click mass delete
        page.locator("button:has-text('Eliminar Seleccionadas')").click()

        # Verify toast and empty state
        page.wait_for_selector("text=No se encontraron tareas")
        page.screenshot(path="verification/agenda_modal_empty.png")

        print("Test completed successfully.")
        browser.close()

if __name__ == "__main__":
    run()
