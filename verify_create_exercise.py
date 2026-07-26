from playwright.sync_api import sync_playwright, expect

def verify_create_exercise():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Open a new context with viewport suitable for the app
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        try:
            # 1. Navigate to the app root
            page.goto("http://localhost:5173")

            # 2. Click Gym Tab
            gym_btn = page.get_by_role("button", name="Gym")
            if gym_btn.is_visible():
                gym_btn.click()
            else:
                page.get_by_role("button").filter(has_text="Gym").click()

            # 3. Wait for Gym Dashboard
            expect(page.locator("h2", has_text="Gym Tracker")).to_be_visible()

            # 4. Click Rutinas Tab
            page.get_by_role("button", name="Rutinas").first.click()
            expect(page.locator("h2", has_text="Mis Rutinas")).to_be_visible()

            # 5. Open Create Routine Modal
            page.get_by_role("button", name="Nueva Rutina").click()

            # 6. In CreateRoutineModal ("Nueva Rutina")
            expect(page.get_by_role("heading", name="Nueva Rutina")).to_be_visible()

            # Click "Agregar" button to open exercise selection
            page.get_by_role("button", name="Agregar").click()

            # 6. In Exercise Selection ("Agregar Ejercicio")
            # Click the new Plus button next to search input
            page.locator("input[placeholder='Buscar ejercicio...'] + button").click()

            # 7. Verify Create Exercise Modal opens
            expect(page.get_by_role("heading", name="Crear Ejercicio")).to_be_visible()

            # 8. Fill form
            page.fill("input[placeholder='Ej. Burpees']", "Playwright Test Exercise")

            # Select Muscle Group
            # Target the select inside the form to avoid conflict with background select
            page.locator("form select").select_option("Pecho")

            # 9. Submit
            page.get_by_role("button", name="Crear Ejercicio").click()

            # 10. Verify result
            # We should be back in "Nueva Rutina" main view
            # Check if "Playwright Test Exercise" is visible
            expect(page.get_by_text("Playwright Test Exercise")).to_be_visible()

            # Take screenshot
            page.screenshot(path="/home/jules/verification/verification.png")
            print("Verification successful!")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
            raise e

        finally:
            browser.close()

if __name__ == "__main__":
    verify_create_exercise()
