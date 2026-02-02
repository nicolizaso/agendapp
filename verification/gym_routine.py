from playwright.sync_api import sync_playwright, expect
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    # Use Pixel 5 viewport
    context = browser.new_context(viewport={"width": 393, "height": 851}, user_agent="Mozilla/5.0 (Linux; Android 11; Pixel 5 Build/RQ3A.210605.005) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36")
    page = context.new_page()

    try:
        page.goto("http://localhost:5173")
        page.wait_for_load_state("networkidle")

        print("Navigating to Gym Tab via BottomNav...")
        # Target BottomNav specifically
        gym_tab = page.locator(".fixed.bottom-0").get_by_text("Gym")
        expect(gym_tab).to_be_visible()
        gym_tab.click()

        # Wait for Gym Page
        expect(page.get_by_text("Gym Tracker")).to_be_visible()

        print("Opening Create Routine Modal...")
        # Find the button next to the select.
        # The select has "Entrenamiento Libre" option.
        # We look for the Plus icon button.
        page.locator("button").filter(has=page.locator("svg.lucide-plus")).first.click()

        # Wait for modal
        expect(page.get_by_text("Nueva Rutina")).to_be_visible()

        print("Creating Routine...")
        # Fill name
        page.get_by_placeholder("Ej. Pecho y Tríceps").fill("Routine A")

        # Add Exercise
        page.get_by_role("button", name="Agregar").click()
        # Select first exercise (Banco Plano usually)
        page.get_by_text("Banco Plano").first.click()

        # Verify defaults (Sets 4, Reps 10)
        # We can look for inputs with value 4 and 10
        expect(page.locator("input[value='4']")).to_be_visible()
        expect(page.locator("input[value='10']")).to_be_visible()

        # Save
        page.get_by_role("button", name="Guardar Rutina").click()

        # Wait for modal to close
        expect(page.get_by_text("Nueva Rutina")).not_to_be_visible()

        print("Selecting Routine...")
        # Select "Routine A" (value will be the ID, usually 1)
        # But we select by label
        page.locator("select").select_option(label="Routine A")

        print("Starting Workout...")
        # Click Start Button. Text should change to "INICIAR RUTINA"
        expect(page.get_by_role("button", name="INICIAR RUTINA")).to_be_visible()
        page.get_by_role("button", name="INICIAR RUTINA").click()

        print("Verifying Active Workout...")
        # Check if Banco Plano is visible
        expect(page.get_by_text("Banco Plano")).to_be_visible()

        # Take screenshot
        time.sleep(2) # Wait for animation
        page.screenshot(path="verification/gym_routine.png")
        print("Screenshot saved.")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")
        raise e
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
