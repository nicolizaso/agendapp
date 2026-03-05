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

        page.wait_for_timeout(2000)

        # In the pre_click screenshot we can see the button next to the plus icon
        # The clipboard icon has a class of 'lucide-clipboard-list'
        # We need to target the one specifically in the Agenda de Hoy section, not the top nav bar (which also has 'Rutinas' with a clipboard list icon).
        # Notice in the header it has Rutinas with a clipboard-list icon! That's why it navigated away!

        # Select the specific button in the TodaySection by looking within the card
        # TodaySection card has text "Agenda de Hoy"

        agenda_btn = page.locator("text=Agenda de Hoy").locator("..").locator("button:has(svg.lucide-clipboard-list)")
        agenda_btn.click()

        page.wait_for_selector("text=Todos los Eventos")
        page.screenshot(path="verification/agenda_modal.png")

        # The list might take a tick to render
        page.wait_for_timeout(500)

        # Select the task
        page.locator("input[type='checkbox']").first.click()
        page.screenshot(path="verification/agenda_modal_selected.png")

        # Click mass delete
        page.locator("button:has-text('Eliminar Seleccionadas')").click()

        page.wait_for_selector("text=No se encontraron tareas")
        page.screenshot(path="verification/agenda_modal_empty.png")

        browser.close()

if __name__ == "__main__":
    run()
