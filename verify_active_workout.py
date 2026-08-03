from playwright.sync_api import sync_playwright, expect

def verify_active_workout():
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

            # 4. Click start "Entrenamiento Libre"
            page.get_by_role("button", name="INICIAR ENTRENAMIENTO").click()

            # Take screenshot of the empty active workout
            page.screenshot(path="/home/jules/verification/active_workout_empty.png")

            # Click "Agregar Ejercicio"
            page.get_by_role("button").filter(has_text="Agregar Ejercicio").click()

            page.screenshot(path="/home/jules/verification/active_workout_add_exercise.png")

            print("Verification successful!")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="/home/jules/verification/active_workout_error.png")
            raise e

        finally:
            browser.close()

if __name__ == "__main__":
    verify_active_workout()
