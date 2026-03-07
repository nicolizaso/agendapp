from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:5173')

        # Wait for the main UI to load
        page.wait_for_selector('text=Mi Progreso', timeout=10000)

        plus_btn = page.locator('button').filter(has=page.locator('svg.lucide-plus'))
        plus_btn.last.click()

        # Wait for CreateTaskModal
        expect(page.locator('text=Nueva Tarea').first).to_be_visible()

        # Click the "Datos Adicionales" button to expand
        details_btn = page.locator('text=Datos Adicionales')
        if details_btn.count() > 0:
            details_btn.click()
            time.sleep(1)

        # Click the location select to open options
        # We might need to click a specific option or the trigger
        trigger = page.locator('text=Seleccionar ubicación...')
        if trigger.count() > 0:
            trigger.click()
        else:
            page.locator('text=Sin ubicación específica').click()

        # Check for "Crear nuevo lugar" option
        expect(page.locator('text=+ Crear nuevo lugar...')).to_be_visible()

        # Click it to open the LocationForm modal
        page.locator('text=+ Crear nuevo lugar...').click()

        # Check if LocationForm modal is open
        expect(page.locator('text=Nuevo Lugar Frecuente')).to_be_visible()

        page.screenshot(path='verification/task_modal_location.png')
        print("Success")
        browser.close()

if __name__ == '__main__':
    run()
